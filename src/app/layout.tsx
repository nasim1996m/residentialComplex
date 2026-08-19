import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'نظام إدارة المجمعات السكنية الذكي | Residential Complex System',
  description: 'منظومة متكاملة لإدارة الشقق، الاشتراكات، السكّان، السيارات المتعددة والكراجات، والوظائف الإدارية',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <AppProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1">{children}</div>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
