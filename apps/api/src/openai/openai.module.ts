import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { OpenAIController } from './openai.controller';

@Module({
  imports: [ConfigModule],
  providers: [OpenAIService],
  controllers: [OpenAIController],
  exports: [OpenAIService],
})
export class OpenAIModule {}