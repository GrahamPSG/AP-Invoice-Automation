import { useEffect, useRef, useCallback } from 'react'
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'

interface PerformanceMetrics {
  cls: number | null
  fid: number | null
  fcp: number | null
  lcp: number | null
  ttfb: number | null
}

export function usePerformance() {
  const metricsRef = useRef<PerformanceMetrics>({
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
  })

  const reportMetric = useCallback((metric: any) => {
    // Store the metric
    metricsRef.current = {
      ...metricsRef.current,
      [metric.name.toLowerCase()]: metric.value,
    }

    // Send to analytics (in production)
    if (process.env.NODE_ENV === 'production') {
      // Send to your analytics service
      console.log('Performance metric:', metric.name, metric.value)
    }
  }, [])

  useEffect(() => {
    // Measure all Core Web Vitals
    onCLS(reportMetric)
    onFID(reportMetric)
    onFCP(reportMetric)
    onLCP(reportMetric)
    onTTFB(reportMetric)
  }, [reportMetric])

  const getMetrics = useCallback(() => {
    return metricsRef.current
  }, [])

  const measureCustomMetric = useCallback((name: string, startTime: number) => {
    const duration = performance.now() - startTime
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Custom metric - ${name}: ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }, [])

  return {
    getMetrics,
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