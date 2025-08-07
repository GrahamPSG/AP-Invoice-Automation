import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'

import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ProjectsModule } from './projects/projects.module'
import { ScenariosModule } from './scenarios/scenarios.module'
import { ExportsModule } from './exports/exports.module'
import { AppCacheModule } from './cache/cache.module'
import { PerformanceModule } from './performance/performance.module'
import { HealthModule } from './health/health.module'
import { CacheService } from './cache/cache.service'
import { PerformanceService } from './performance/performance.service'
import { PerformanceInterceptor } from './performance/performance.interceptor'
import { CompressionMiddleware } from './performance/compression.middleware'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'whatif',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      // Performance optimizations
      logging: process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : false,
      maxQueryExecutionTime: 1000, // Log slow queries > 1s
      cache: {
        duration: 30000, // 30 seconds cache for queries
      },
    }),
    AppCacheModule,
    PerformanceModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    ScenariosModule,
    ExportsModule,
  ],
  providers: [
    CacheService,
    PerformanceService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CompressionMiddleware)
      .forRoutes('*')
  }
}