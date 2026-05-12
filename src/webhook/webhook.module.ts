import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookController } from './webhook.controller';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [ConfigModule, BotModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
