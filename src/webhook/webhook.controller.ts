import {
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { BotService } from '../bot/bot.service';

interface MessagingEvent {
  sender?: { id?: string };
  message?: { text?: string; is_echo?: boolean };
  postback?: { payload?: string };
}

interface WebhookEntry {
  messaging?: MessagingEvent[];
}

interface WebhookBody {
  object?: string;
  entry?: WebhookEntry[];
}

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly bot: BotService,
  ) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = this.config.get<string>('VERIFY_TOKEN');
    if (mode === 'subscribe' && token === expected) {
      this.logger.log('Webhook verified ✓');
      return res.status(200).send(challenge);
    }
    this.logger.warn(`Webhook verification failed: mode=${mode}`);
    return res.status(403).send('Forbidden');
  }

  @Post()
  @HttpCode(200)
  async receive(@Req() req: Request<unknown, unknown, WebhookBody>) {
    const body = req.body;
    if (body?.object !== 'page') {
      return { status: 'ignored' };
    }

    for (const entry of body.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        const senderId = event.sender?.id;
        const text = event.message?.text;
        if (!senderId || !text || event.message?.is_echo) {
          continue;
        }
        // Fire-and-forget — Facebook expects 200 within 20s
        this.bot.handleMessage(senderId, text).catch((err) => {
          this.logger.error(`Bot handler failed for ${senderId}`, err);
        });
      }
    }
    return { status: 'ok' };
  }
}
