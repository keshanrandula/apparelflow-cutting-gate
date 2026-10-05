import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/client/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';

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
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
