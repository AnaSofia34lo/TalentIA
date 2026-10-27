import { Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export class UnreadableResumeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnreadableResumeError';
  }
}

@Injectable()
export class ResumeTextExtractor {
  private readonly logger = new Logger(ResumeTextExtractor.name);

  async extract(buffer: Buffer, mimeType: string | null, fileName: string): Promise<string> {
    const normalizedMime = (mimeType ?? '').toLowerCase();
    const lowerName = fileName.toLowerCase();
    const isPdf = normalizedMime.includes('pdf') || lowerName.endsWith('.pdf');

    let text = '';
    try {
      if (isPdf) {
        text = await this.fromPdf(buffer);
      } else if (
        normalizedMime.includes('wordprocessingml') ||
        normalizedMime.includes('msword') ||
        lowerName.endsWith('.docx') ||
        lowerName.endsWith('.doc')
      ) {
        text = await this.fromDocx(buffer);
      } else {
        throw new UnreadableResumeError(
          `Formato de archivo no soportado: ${mimeType ?? fileName}`,
        );
      }
    } catch (error) {
      if (!isPdf) throw error;
      this.logger.warn(
        `No se pudo extraer texto local del PDF; se intentará lectura visual con Gemini: ${String(error)}`,
      );
      text = '';
    }

    const cleaned = text.split('\0').join('').trim();
    if (cleaned.length < 40 && !isPdf) {
      throw new UnreadableResumeError(
        'No se pudo extraer texto legible del documento (posible PDF escaneado o vacío).',
      );
    }

    return cleaned;
  }

  private async fromPdf(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text ?? '';
    } catch (error) {
      this.logger.warn(`Fallo al parsear PDF: ${String(error)}`);
      throw new UnreadableResumeError('El PDF no se pudo leer o está dañado.');
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  private async fromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value ?? '';
    } catch (error) {
      this.logger.warn(`Fallo al parsear DOCX: ${String(error)}`);
      throw new UnreadableResumeError('El documento Word no se pudo leer o está dañado.');
    }
  }
}
