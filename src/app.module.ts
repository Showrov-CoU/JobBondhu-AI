import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { WebhookModule } from './webhook/webhook.module';
import { BotModule } from './bot/bot.module';
import { MessengerModule } from './messenger/messenger.module';
import { ClaudeModule } from './claude/claude.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WebhookModule,
    BotModule,
    MessengerModule,
    ClaudeModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
