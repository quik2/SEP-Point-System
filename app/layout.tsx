import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SEP Point System',
  description: 'Live leaderboard and point tracking system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
