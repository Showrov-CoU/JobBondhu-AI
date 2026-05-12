import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { MessengerModule } from '../messenger/messenger.module';
import { ClaudeModule } from '../claude/claude.module';

@Module({
  imports: [MessengerModule, ClaudeModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
