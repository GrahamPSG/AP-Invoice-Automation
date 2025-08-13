import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextUIProvider } from '@nextui-org/react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PARIS AP Agent - Admin',
  description: 'Administration interface for automated AP processing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextUIProvider>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">
                  PARIS AP Agent
                </h1>
                <div className="text-sm text-gray-500">
                  Paris Mechanical - Invoice Processing
                </div>
              </div>
            </nav>
            <main className="p-6">
              {children}
            </main>
          </div>
        </NextUIProvider>
      </body>
    </html>
  );
}