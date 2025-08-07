import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'

import { AppModule } from './app.module'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn', 'log'] 
      : ['log', 'debug', 'error', 'verbose', 'warn'],
  })
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    hsts: process.env.NODE_ENV === 'production',
  }))
  
  // CORS configuration
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') || false
      : true,
    credentials: true,
  })
  
  // Global validation with performance optimizations
  app.useGlobalPipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
  }))
  
  // Swagger documentation (only in non-production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('What-If Calculator API')
      .setDescription('API for running what-if scenarios on job cost data')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('projects', 'Project management')
      .addTag('scenarios', 'Scenario computation')
      .addTag('exports', 'Report generation')
      .addTag('health', 'Health and monitoring')
      .build()
    
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api', app, document)
    logger.log('Swagger documentation available at /api')
  }
  
  // Performance optimizations
  app.set('trust proxy', 1) // Trust first proxy for load balancers
  
  // Graceful shutdown
  const server = await app.listen(process.env.PORT || 3000, '0.0.0.0')
  
  process.on('SIGTERM', () => {
    logger.log('SIGTERM received, shutting down gracefully')
    server.close(() => {
      logger.log('Process terminated')
      process.exit(0)
    })
  })
  
  process.on('SIGINT', () => {
    logger.log('SIGINT received, shutting down gracefully')
    server.close(() => {
      logger.log('Process terminated')
      process.exit(0)
    })
  })
  
  const port = process.env.PORT || 3000
  logger.log(`🚀 What-If Calculator API running on port ${port}`)
  
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`📚 API Documentation: http://localhost:${port}/api`)
    logger.log(`🔍 Health Check: http://localhost:${port}/health`)
    logger.log(`📊 Metrics: http://localhost:${port}/health/metrics`)
  }
}

bootstrap().catch(err => {
  console.error('Failed to start application:', err)
  process.exit(1)
})