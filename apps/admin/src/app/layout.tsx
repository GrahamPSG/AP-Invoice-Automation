'use client';

import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../lib/auth';
import { signOut } from 'next-auth/react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

function NavBar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Holds', href: '/holds', icon: '⚠️' },
    { name: 'Vendors', href: '/vendors', icon: '🏢', adminOnly: true },
    { name: 'Settings', href: '/settings', icon: '⚙️', adminOnly: true },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || isAdmin
  );

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-gray-900">
              PARIS AP Agent
            </h1>
            <div className="flex space-x-4">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Paris Mechanical - Invoice Processing
            </div>
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.name || user.email}</div>
                  <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <NavBar />
            <main className="p-6">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}