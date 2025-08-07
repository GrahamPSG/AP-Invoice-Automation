import { Injectable, Logger } from '@nestjs/common'

interface PerformanceMetrics {
  requestCount: number
  totalResponseTime: number
  averageResponseTime: number
  slowQueries: Array<{
    query: string
    duration: number
    timestamp: Date
  }>
  errorRate: number
  cacheHitRate: number
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name)
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    totalResponseTime: 0,
    averageResponseTime: 0,
    slowQueries: [],
    errorRate: 0,
    cacheHitRate: 0,
  }

  private requestTimes: number[] = []
  private errorCount = 0
  private cacheHits = 0
  private cacheRequests = 0

  recordRequest(responseTime: number): void {
    this.metrics.requestCount++
    this.metrics.totalResponseTime += responseTime
    this.requestTimes.push(responseTime)
    
    // Keep only last 1000 requests for memory efficiency
    if (this.requestTimes.length > 1000) {
      const removed = this.requestTimes.shift()
      this.metrics.totalResponseTime -= removed!
      this.metrics.requestCount = Math.min(this.metrics.requestCount, 1000)
    }
    
    this.metrics.averageResponseTime = 
      this.metrics.totalResponseTime / this.metrics.requestCount

    // Log slow requests
    if (responseTime > 1000) { // > 1 second
      this.logger.warn(`Slow request detected: ${responseTime}ms`)
    }
  }

  recordSlowQuery(query: string, duration: number): void {
    this.metrics.slowQueries.push({
      query: query.substring(0, 200), // Truncate for logs
      duration,
      timestamp: new Date(),
    })

    // Keep only last 50 slow queries
    if (this.metrics.slowQueries.length > 50) {
      this.metrics.slowQueries.shift()
    }

    this.logger.warn(`Slow query detected: ${duration}ms - ${query.substring(0, 100)}...`)
  }

  recordError(): void {
    this.errorCount++
    this.metrics.errorRate = this.errorCount / this.metrics.requestCount
  }

  recordCacheHit(hit: boolean): void {
    this.cacheRequests++
    if (hit) {
      this.cacheHits++
    }
    this.metrics.cacheHitRate = this.cacheHits / this.cacheRequests
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
  } {
    const issues: string[] = []
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    // Check average response time
    if (this.metrics.averageResponseTime > 2000) {
      issues.push('High average response time')
      status = 'critical'
    } else if (this.metrics.averageResponseTime > 1000) {
      issues.push('Elevated response time')
      status = status === 'healthy' ? 'warning' : status
    }

    // Check error rate
    if (this.metrics.errorRate > 0.05) { // 5%
      issues.push('High error rate')
      status = 'critical'
    } else if (this.metrics.errorRate > 0.01) { // 1%
      issues.push('Elevated error rate')
      status = status === 'healthy' ? 'warning' : status
    }

    // Check cache hit rate
    if (this.metrics.cacheHitRate < 0.5 && this.cacheRequests > 100) {
      issues.push('Low cache hit rate')
      status = status === 'healthy' ? 'warning' : status
    }

    // Check for recent slow queries
    const recentSlowQueries = this.metrics.slowQueries.filter(
      q => Date.now() - q.timestamp.getTime() < 300000 // Last 5 minutes
    )
    if (recentSlowQueries.length > 5) {
      issues.push('Multiple slow queries detected')
      status = status === 'healthy' ? 'warning' : status
    }

    return { status, issues }
  }

  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowQueries: [],
      errorRate: 0,
      cacheHitRate: 0,
    }
    this.requestTimes = []
    this.errorCount = 0
    this.cacheHits = 0
    this.cacheRequests = 0
    
    this.logger.log('Performance metrics reset')
  }
}