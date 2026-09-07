import type { Metadata } from 'next';
import { AuthProvider } from '../shared/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'TalentIA — Selección inteligente de talento',
  description: 'TalentIA analiza hojas de vida, conduce entrevistas y evalúa competencias con IA para que tu equipo decida con evidencia, no con intuición.',
  icons: {
    icon: '/icon',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
