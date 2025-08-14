'use client';

import { getProviders, signIn, getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [providers, setProviders] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const setUpProviders = async () => {
      const response = await getProviders();
      setProviders(response);
    };

    setUpProviders();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/');
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-blue-100 rounded-lg">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to PARIS AP Agent
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access the automated invoice processing admin panel
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm">
            {providers &&
              Object.values(providers).map((provider: any) => (
                <div key={provider.name} className="mb-3">
                  <button
                    onClick={() => signIn(provider.id, { callbackUrl: '/' })}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <svg
                        className="h-5 w-5 text-blue-500 group-hover:text-blue-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    Sign in with Microsoft
                  </button>
                </div>
              ))}
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Authorized for Paris Mechanical/Service Group employees only</p>
            <p className="mt-2">
              Need access?{' '}
              <a
                href="mailto:grahamm@parisservicegroup.com"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Contact IT Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}