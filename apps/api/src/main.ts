import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  app.use(helmet())
  app.enableCors()
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  
  const config = new DocumentBuilder()
    .setTitle('What-If Calculator API')
    .setDescription('API for running what-if scenarios on job cost data')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)
  
  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(`API running on port ${port}`)
}

bootstrap()