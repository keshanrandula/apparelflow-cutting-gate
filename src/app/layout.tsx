import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/client/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/client/hooks/useTheme';

export const metadata: Metadata = {
  title: 'ApparelFlow ERP | Cutting Operations & Gatekeeper Terminal',
  description: 'Production-grade cutting floor workflow and gatekeeper verification terminal for apparel manufacturing.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
