import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shadow Runtime — AI Backend Execution Observability',
  description: 'AI-powered backend execution observability platform with real-time architecture topology, predictive shadow execution, blast radius calculation, and Gemini AI root-cause narration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased selection:bg-cyber-cyan selection:text-black">
        {children}
      </body>
    </html>
  );
}
