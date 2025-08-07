import { Suspense, ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface LazyWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  errorFallback?: ReactNode
}

export function LazyWrapper({ children, fallback, errorFallback }: LazyWrapperProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-600">Loading...</span>
    </div>
  )

  const defaultErrorFallback = (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="text-red-500 text-lg mb-2">⚠️</div>
        <p className="text-gray-600">Failed to load component</p>
      </div>
    </div>
  )

  return (
    <ErrorBoundary fallback={errorFallback || defaultErrorFallback}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}