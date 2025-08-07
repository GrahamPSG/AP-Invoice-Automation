import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { PerformanceService } from '../performance/performance.service'
import { CacheService } from '../cache/cache.service'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly performanceService: PerformanceService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    }
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with performance metrics' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  getDetailedHealth() {
    const basicHealth = this.getHealth()
    const performanceMetrics = this.performanceService.getMetrics()
    const healthStatus = this.performanceService.getHealthStatus()

    return {
      ...basicHealth,
      performance: {
        metrics: performanceMetrics,
        status: healthStatus,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check for container orchestration' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  async getReadiness() {
    const healthStatus = this.performanceService.getHealthStatus()
    
    // Consider service ready if not in critical state
    const isReady = healthStatus.status !== 'critical'
    
    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        performance: healthStatus,
      }
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check for container orchestration' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getLiveness() {
    // Basic liveness check - if we can respond, we're alive
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Performance metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Current performance metrics' })
  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.performanceService.getMetrics(),
    }
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache performance statistics' })
  async getCacheStats() {
    // This would need to be implemented based on your cache backend
    const metrics = this.performanceService.getMetrics()
    
    return {
      timestamp: new Date().toISOString(),
      cacheHitRate: metrics.cacheHitRate,
      // Add more cache-specific stats if available from Redis
    }
  }
}