'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Authentication service is not properly configured.';
      case 'AccessDenied':
        return 'Access denied. You are not authorized to access this application.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  const getErrorDetails = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return 'Only Paris Mechanical and Paris Service Group employees are authorized to access this system.';
      case 'Configuration':
        return 'Please contact your system administrator.';
      case 'Verification':
        return 'Please request a new sign-in link.';
      default:
        return 'If this problem persists, please contact IT support.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-red-100 rounded-lg">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error === 'AccessDenied' ? 'Access Denied' : 'Error Details'}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{getErrorDetails(error)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Sign In Again
            </Link>

            {error === 'AccessDenied' && (
              <a
                href="mailto:grahamm@parisservicegroup.com?subject=PARIS AP Access Request"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Request Access
              </a>
            )}
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Error Code: {error || 'UNKNOWN'}</p>
            <p className="mt-1">
              Need help?{' '}
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