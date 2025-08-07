import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { PerformanceService } from './performance.service'

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name)

  constructor(private readonly performanceService: PerformanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const startTime = Date.now()
    
    const method = request.method
    const url = request.url
    const userAgent = request.get('User-Agent') || 'Unknown'
    
    return next.handle().pipe(
      tap((response) => {
        const responseTime = Date.now() - startTime
        this.performanceService.recordRequest(responseTime)
        
        // Log request details for monitoring
        this.logger.log(
          `${method} ${url} - ${responseTime}ms - ${userAgent.substring(0, 50)}`
        )
        
        // Add performance headers to response
        const httpResponse = context.switchToHttp().getResponse()
        httpResponse.setHeader('X-Response-Time', `${responseTime}ms`)
        httpResponse.setHeader('X-Request-ID', this.generateRequestId())
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime
        this.performanceService.recordRequest(responseTime)
        this.performanceService.recordError()
        
        this.logger.error(
          `${method} ${url} - ${responseTime}ms - ERROR: ${error.message}`
        )
        
        return throwError(() => error)
      }),
    )
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}