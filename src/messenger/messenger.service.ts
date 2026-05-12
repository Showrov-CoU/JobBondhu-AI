import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

const GRAPH_URL = 'https://graph.facebook.com/v19.0/me/messages';

@Injectable()
export class MessengerService {
  private readonly logger = new Logger(MessengerService.name);

  constructor(private readonly config: ConfigService) {}

  async sendText(recipientId: string, text: string): Promise<void> {
    const token = this.config.get<string>('PAGE_ACCESS_TOKEN');
    if (!token) {
      this.logger.error('PAGE_ACCESS_TOKEN missing — cannot send message');
      return;
    }

    try {
      await axios.post(
        GRAPH_URL,
        {
          recipient: { id: recipientId },
          message: { text },
          messaging_type: 'RESPONSE',
        },
        {
          params: { access_token: token },
          timeout: 10_000,
        },
      );
      this.logger.log(`→ ${recipientId}: ${text.slice(0, 60)}…`);
    } catch (err) {
      const axiosErr = err as AxiosError;
      this.logger.error(
        `Failed to send message to ${recipientId}: ${axiosErr.message}`,
        axiosErr.response?.data,
      );
    }
  }
}
