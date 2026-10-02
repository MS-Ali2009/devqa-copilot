import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { Shell } from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: 'DevQA Copilot - Personal Engineering & QA AI Agent',
  description:
    'Turn raw user stories, bug notes, PR summaries, and engineering tickets into structured acceptance criteria, QA test suites, bug reports, and checklists.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <ToastProvider>
            <Shell>{children}</Shell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
