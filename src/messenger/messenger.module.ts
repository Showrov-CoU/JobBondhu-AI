import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessengerService } from './messenger.service';

@Module({
  imports: [ConfigModule],
  providers: [MessengerService],
  exports: [MessengerService],
})
export class MessengerModule {}
