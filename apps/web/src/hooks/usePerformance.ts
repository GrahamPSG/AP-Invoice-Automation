import { useRef, useCallback, useEffect } from 'react'

export function usePerformance() {
  const measureCustomMetric = useCallback((name: string, startTime: number) => {
    const duration = performance.now() - startTime
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Custom metric - ${name}: ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }, [])

  return {
    measureCustomMetric,
  }
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  const startTimeRef = useRef<number>()

  useEffect(() => {
    startTimeRef.current = performance.now()
  })

  useEffect(() => {
    if (startTimeRef.current) {
      const renderTime = performance.now() - startTimeRef.current
      
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  })
}