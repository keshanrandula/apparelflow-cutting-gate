import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/client/hooks/useAuth';
import { ToastProvider } from '@/client/components/ui/Toast';
import { ThemeProvider } from '@/client/hooks/useTheme';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://apparelflow.vercel.app'),
  title: {
    default: 'ApparelFlow ERP | Cutting Operations & Gatekeeper Terminal',
    template: '%s | ApparelFlow ERP',
  },
  description: 'Enterprise apparel manufacturing ERP for precision fabric cutting operations, real-time BOM calculation, automated traffic-light quality control, and zero-defect sewing line handover.',
  keywords: [
    'ApparelFlow',
    'Apparel ERP',
    'Garment Manufacturing',
    'Fabric Cutting Operations',
    'Gatekeeper Verification Terminal',
    'Bill of Materials BOM',
    'Sewing Line Intake',
    'Quality Control QC',
    'Fabric Wastage Analytics',
    'Industry 4.0 Factory ERP',
  ],
  authors: [{ name: 'ApparelFlow Engineering Team' }],
  creator: 'ApparelFlow Systems',
  publisher: 'ApparelFlow ERP',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'ApparelFlow ERP | Cutting Operations & Gatekeeper Terminal',
    description: 'Precision fabric cutting operations, automated traffic-light quality control, and zero-shortage sewing line handover for modern garment factories.',
    url: 'https://apparelflow.vercel.app',
    siteName: 'ApparelFlow ERP',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApparelFlow ERP | Precision Garment Cutting & Gatekeeper Terminal',
    description: 'Next-generation apparel ERP with zero-shortage gatekeeper verification.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={fontSans.variable}>
      <body className={`${fontSans.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased transition-colors duration-200 font-sans`}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
