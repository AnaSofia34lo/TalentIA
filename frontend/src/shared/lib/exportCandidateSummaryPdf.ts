import type { RecruiterCandidateAnalysisResponse } from '../context/AuthContext';

function escapeHtml(value: string | null | undefined): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDofaBlock(
  title: string,
  items: string[],
  note?: string,
  borderColor: string = '#d1d5db',
  titleColor: string = '#1f2937',
  bgColor: string = '#ffffff',
) {
  return `
    <div style="background:${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
      <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: ${titleColor};">${escapeHtml(title)}</h4>
      ${
        items.length > 0
          ? `<ul style="margin: 0; padding-left: 18px; font-size: 11.5px; color: #374151; line-height: 1.45;">
              ${items.map((item) => `<li style="margin-bottom: 4px;">${escapeHtml(item)}</li>`).join('')}
            </ul>`
          : `<p style="margin: 0; font-size: 11.5px; color: #6b7280; font-style: italic;">${escapeHtml(note || 'Sin evidencia suficiente.')}</p>`
      }
      ${items.length > 0 && note ? `<p style="margin: 6px 0 0; font-size: 10px; color: #9ca3af; font-style: italic;">${escapeHtml(note)}</p>` : ''}
    </div>
  `;
}

/** Genera e imprime o descarga en PDF el perfil completo del candidato con formato profesional. */
export function exportCandidateSummaryPdf(
  report: RecruiterCandidateAnalysisResponse,
) {
  const { candidate, application, analysis } = report;
  const score = analysis.overallScore ?? application.matchScore ?? 0;
  const dofa = report.dofa ?? {
    strengths: analysis.strengths ?? [],
    opportunities: analysis.improvements ?? [],
    weaknesses: analysis.improvements ?? [],
    threats: [] as string[],
    notes: {
      weaknesses: 'Sin evidencia suficiente.',
      threats: 'Sin evidencia suficiente.',
      opportunities: 'Sin evidencia suficiente.',
    },
  };

  const technicalBars =
    report.competencies?.technicalBars?.length
      ? report.competencies.technicalBars
      : candidate.technicalSkills.map((skill) => ({
          name: skill.name,
          percentage: skill.estimatedProficiency,
          source: 'cv' as const,
        }));

  const technicalPercentage =
    report.competencies?.technicalPercentage ?? analysis.technicalScore ?? 0;
  const softPercentage =
    report.competencies?.softPercentage ?? analysis.behavioralScore ?? 0;
  const evidences = report.evidences ?? [];

  const candidateInitials =
    candidate.fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'CA';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>TalentIA — Perfil Completo: ${escapeHtml(candidate.fullName)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      margin: 0;
      padding: 0;
      line-height: 1.45;
      font-size: 12px;
      background: #ffffff;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0052cc;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #0b192c;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
    }
    .doc-badge {
      background: #eef2ff;
      color: #3730a3;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid #c7d2fe;
    }
    .candidate-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .candidate-info {
      flex: 1;
    }
    .candidate-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px;
    }
    .candidate-meta {
      font-size: 12px;
      color: #475569;
      margin-bottom: 6px;
    }
    .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
    }
    .score-badge-box {
      min-width: 110px;
      background: #ffffff;
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 12px 14px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .score-value {
      font-size: 28px;
      font-weight: 900;
      color: #047857;
      line-height: 1;
    }
    .score-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #065f46;
      margin-top: 4px;
      letter-spacing: 0.5px;
    }
    .skills-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    }
    .skill-tag {
      background: #e2e8f0;
      color: #1e293b;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
    }
    .section-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #1e293b;
      border-left: 3px solid #2563eb;
      padding-left: 8px;
      margin: 18px 0 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .card-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .progress-wrap {
      margin-bottom: 8px;
    }
    .progress-head {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 3px;
      color: #334155;
    }
    .progress-bar-bg {
      height: 7px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: #2563eb;
      border-radius: 999px;
    }
    .recommendation-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 14px;
    }
    .recommendation-text {
      font-size: 12.5px;
      line-height: 1.5;
      color: #166534;
      font-weight: 500;
      margin: 0;
    }
    .evidence-item {
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 11.5px;
    }
    .evidence-item:last-child {
      border-bottom: none;
    }
    .evidence-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      margin-left: 6px;
    }
    .evidence-technical {
      background: #dbeafe;
      color: #1e40af;
    }
    .evidence-soft {
      background: #f3e8ff;
      color: #6b21a8;
    }
    .footer-note {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <div class="brand-title">
        <span>TalentIA</span>
      </div>
      <div class="brand-subtitle">Reporte Integral de Evaluación del Candidato · Apoyo a Decisiones de RRHH</div>
    </div>
    <div class="doc-badge">Evaluación IA HU-26</div>
  </div>

  <!-- CANDIDATE HEADER -->
  <div class="candidate-card">
    <div class="candidate-info">
      <h1 class="candidate-name">${escapeHtml(candidate.fullName)}</h1>
      <div class="candidate-meta">
        <strong>${escapeHtml(candidate.profile?.professionalTitle || 'Perfil profesional')}</strong>
        ${
          candidate.profile?.yearsOfExperience != null
            ? ` · ${candidate.profile.yearsOfExperience} años de experiencia`
            : ''
        }
        ${
          candidate.profile?.currentCompany
            ? ` · Empresa actual: ${escapeHtml(candidate.profile.currentCompany)}`
            : ''
        }
      </div>
      <div class="candidate-meta" style="color: #0f172a;">
        <strong>Vacante:</strong> ${escapeHtml(application.vacancy.title)} (${escapeHtml(application.vacancy.organization)})
      </div>
      <div class="contact-row">
        <span>📧 ${escapeHtml(candidate.email)}</span>
        ${candidate.phone ? `<span>📱 ${escapeHtml(candidate.phone)}</span>` : ''}
        <span>🗓️ Postulado: ${escapeHtml(new Date(application.submittedAt).toLocaleDateString('es-CO'))}</span>
        <span>📋 Estado: ${escapeHtml(application.status)}</span>
      </div>
      <div class="skills-badges">
        ${candidate.technicalSkills
          .slice(0, 10)
          .map((s) => `<span class="skill-tag">${escapeHtml(s.name)}</span>`)
          .join('')}
      </div>
    </div>
    <div class="score-badge-box">
      <div class="score-value">${Math.round(score)}%</div>
      <div class="score-label">Match IA</div>
    </div>
  </div>

  <!-- RECOMENDACIÓN DE LA IA -->
  <div class="recommendation-box">
    <h3 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #14532d;">Recomendación de la Inteligencia Artificial</h3>
    <p class="recommendation-text">
      "${escapeHtml(
        analysis.recommendation ||
          'Evaluación completada. Revisa los hallazgos técnicos y conductuales para la decisión de RRHH.',
      )}"
    </p>
    <div style="margin-top: 6px; font-size: 10px; color: #15803d; font-style: italic;">
      Esta recomendación es un apoyo al proceso; la decisión final siempre es de Recursos Humanos.
    </div>
  </div>

  <!-- COMPETENCIAS -->
  <div class="section-title">Evaluación de Competencias</div>
  <div class="grid-2" style="margin-bottom: 14px;">
    <!-- TÉCNICAS -->
    <div class="card-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
        <h4 style="margin:0; font-size:12.5px; font-weight:700; color:#1e293b;">Competencias Técnicas</h4>
        <span style="font-size:13px; font-weight:800; color:#2563eb;">${Math.round(technicalPercentage)}%</span>
      </div>
      ${
        technicalBars.length > 0
          ? technicalBars
              .slice(0, 6)
              .map(
                (bar) => `
            <div class="progress-wrap">
              <div class="progress-head">
                <span>${escapeHtml(bar.name)}</span>
                <span>${Math.round(bar.percentage)}%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${Math.max(0, Math.min(100, Math.round(bar.percentage)))}%;"></div>
              </div>
            </div>`,
              )
              .join('')
          : '<p style="color:#64748b; font-size:11px;">Sin desglose de skills técnicas.</p>'
      }
      ${
        analysis.technicalSummary
          ? `<p style="margin:8px 0 0; font-size:11px; color:#475569; line-height:1.4; border-top:1px dashed #e2e8f0; padding-top:6px;">
              ${escapeHtml(analysis.technicalSummary)}
            </p>`
          : ''
      }
    </div>

    <!-- BLANDAS -->
    <div class="card-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
        <h4 style="margin:0; font-size:12.5px; font-weight:700; color:#1e293b;">Competencias Blandas</h4>
        <span style="font-size:13px; font-weight:800; color:#7c3aed;">${Math.round(softPercentage)}%</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-head">
          <span>Evaluación Conductual / Video</span>
          <span>${Math.round(softPercentage)}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="background:#7c3aed; width: ${Math.max(0, Math.min(100, Math.round(softPercentage)))}%;"></div>
        </div>
      </div>
      ${
        analysis.behavioralSummary
          ? `<p style="margin:8px 0 0; font-size:11.5px; color:#475569; line-height:1.45;">
              ${escapeHtml(analysis.behavioralSummary)}
            </p>`
          : '<p style="color:#64748b; font-size:11px;">Evaluación conductual completada con video analizado.</p>'
      }
    </div>
  </div>

  <!-- MATRIZ DOFA -->
  <div class="section-title">Matriz DOFA</div>
  <div class="grid-2">
    <div>
      ${renderDofaBlock('Fortalezas', dofa.strengths, 'Sin evidencia suficiente.', '#86efac', '#166534', '#f0fdf4')}
      ${renderDofaBlock('Debilidades', dofa.weaknesses, dofa.notes?.weaknesses, '#fde68a', '#854d0e', '#fffbeb')}
    </div>
    <div>
      ${renderDofaBlock('Oportunidades', dofa.opportunities, dofa.notes?.opportunities, '#bfdbfe', '#1e40af', '#eff6ff')}
      ${renderDofaBlock('Riesgos / Amenazas', dofa.threats, dofa.notes?.threats, '#fecaca', '#991b1b', '#fef2f2')}
    </div>
  </div>

  <!-- EVIDENCIAS -->
  <div class="section-title" style="margin-top: 14px;">Evidencias de Entrevista y Desempeño</div>
  <div class="card-box" style="margin-bottom: 12px;">
    ${
      evidences.length === 0
        ? '<p style="color:#64748b; font-size:11.5px; margin:0;">No se registraron evidencias individuales detalladas.</p>'
        : evidences
            .map(
              (item) => `
          <div class="evidence-item">
            <div style="margin-bottom: 2px;">
              <strong>${escapeHtml(item.competency)}</strong>
              <span class="evidence-badge ${item.kind === 'soft' ? 'evidence-soft' : 'evidence-technical'}">
                ${escapeHtml(item.kind === 'soft' ? 'Conductual / Video' : 'Técnica')}
              </span>
            </div>
            <div style="color: #475569;">${escapeHtml(item.summary)}</div>
          </div>`,
            )
            .join('')
    }
  </div>

  <!-- FOOTER -->
  <div class="footer-note">
    <span>TalentIA — Sistema de Selección y Evaluación Inteligente</span>
    <span>Generado el: ${escapeHtml(new Date().toLocaleString('es-CO'))}</span>
  </div>
</body>
</html>`;

  // Imprimir mediante iframe invisible para máxima compatibilidad (sin bloqueos de popup)
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      throw new Error('No se pudo acceder al marco de impresión.');
    }

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (printErr) {
        console.error('Error al invocar impresión en iframe:', printErr);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }
    }, 300);
  } catch (err) {
    console.warn('Fallback a popup para imprimir PDF:', err);
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=920,height=750');
    if (!popup) {
      alert('Por favor habilita las ventanas emergentes en tu navegador para generar el PDF.');
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    setTimeout(() => {
      popup.focus();
      popup.print();
    }, 350);
  }
}
