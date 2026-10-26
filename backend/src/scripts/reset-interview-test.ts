import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

function readOption(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const email = readOption('--email');
const vacancyId = readOption('--vacancy-id');
const vacancyTitle = readOption('--vacancy-title');
const confirmed = process.argv.includes('--confirm');
const normalizedVacancyTitle = vacancyTitle?.trim().replace(/\s+/g, ' ');

if (!email || (!vacancyId && !normalizedVacancyTitle) || !confirmed) {
  console.error(
    'Uso: npm run test:reset-interview -- --email <correo> (--vacancy-id <id> | --vacancy-title <titulo>) --confirm',
  );
  process.exitCode = 1;
} else {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL o DIRECT_URL es obligatoria.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const candidate = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!candidate) throw new Error(`No se encontró el candidato: ${email}`);

    const vacancies = vacancyId
      ? await prisma.vacancy.findMany({
          where: { id: vacancyId },
          select: { id: true, title: true },
        })
      : await prisma.vacancy.findMany({
          where: {
            title: {
              contains: normalizedVacancyTitle,
              mode: 'insensitive',
            },
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true },
        });

    if (vacancies.length === 0) {
      const availableVacancies = await prisma.vacancy.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { id: true, title: true },
      });
      const options = availableVacancies
        .map(({ id, title }) => `- ${title} (${id})`)
        .join('\n');
      throw new Error(
        `No se encontró la vacante indicada: "${vacancyId ?? normalizedVacancyTitle}". ` +
          `Usa --vacancy-id con el ID exacto de la vacante.\nVacantes recientes:\n${options || '- No hay vacantes registradas.'}`,
      );
    }

    if (vacancies.length > 1) {
      const options = vacancies
        .map(({ id, title }) => `- ${title} (${id})`)
        .join('\n');
      throw new Error(
        `El texto coincide con varias vacantes. Usa --vacancy-id con una de estas opciones:\n${options}`,
      );
    }

    const vacancy = vacancies[0];

    const application = await prisma.candidateApplication.findUnique({
      where: {
        candidateId_vacancyId: {
          candidateId: candidate.id,
          vacancyId: vacancy.id,
        },
      },
      select: {
        id: true,
        interviews: { select: { id: true } },
      },
    });

    if (!application) {
      console.log(`No había postulación para "${vacancy.title}".`);
    } else {
      const videoFileNames = application.interviews.map(
        (interview) => `${interview.id}.webm`,
      );

      await prisma.$transaction(async (transaction) => {
        if (videoFileNames.length > 0) {
          await transaction.storageAsset.deleteMany({
            where: {
              userId: candidate.id,
              kind: 'interview_video',
              fileName: { in: videoFileNames },
            },
          });
        }
        await transaction.candidateApplication.delete({
          where: { id: application.id },
        });
      });

      console.log(
        `Postulación, entrevistas, respuestas y análisis eliminados para "${vacancy.title}".`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}
