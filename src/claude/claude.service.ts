import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT =
  'তুমি JobBondhu AI। বাংলাদেশের job seekers ও students দের help করো। সবসময় বাংলায় reply করো। Short ও helpful উত্তর দাও। চাকরি, CV, interview, BCS সম্পর্কে expert advice দাও।';

export interface CvData {
  name: string;
  phone: string;
  email: string;
  education: string;
  experience: string;
  skills: string;
}

@Injectable()
export class ClaudeService implements OnModuleInit {
  private readonly logger = new Logger(ClaudeService.name);
  private client!: Anthropic;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — Claude calls will fail until configured.',
      );
    }
    this.client = new Anthropic({ apiKey });
  }

  async chat(userMessage: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });
      return this.extractText(response);
    } catch (err) {
      this.logger.error('Claude chat failed', err as Error);
      return 'দুঃখিত, এখন AI সাড়া দিতে পারছে না। একটু পরে আবার চেষ্টা করো। 🙏';
    }
  }

  async generateCv(data: CvData): Promise<string> {
    const prompt = `নিচের তথ্য দিয়ে একটা professional CV summary বানাও (বাংলায়, formatted, Messenger-friendly):

নাম: ${data.name}
ফোন: ${data.phone}
ইমেইল: ${data.email}
শিক্ষা: ${data.education}
অভিজ্ঞতা: ${data.experience}
দক্ষতা: ${data.skills}

CV summary টা hiring manager দের আকর্ষণ করার মতো করে লিখো। ৪-৫ লাইনের bullet points এ key strengths highlight করো।`;

    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });
      return this.extractText(response);
    } catch (err) {
      this.logger.error('Claude CV generation failed', err as Error);
      return 'দুঃখিত, এখন CV বানাতে পারছি না। একটু পরে আবার চেষ্টা করো। 🙏';
    }
  }

  async bcsMcq(): Promise<string> {
    const prompt = `একটা BCS preliminary level MCQ question তৈরি করো বাংলায়।
Format:
প্রশ্ন: ...
ক) ...
খ) ...
গ) ...
ঘ) ...

সঠিক উত্তর: ...
ব্যাখ্যা: ১-২ লাইনে।

General Knowledge, বাংলাদেশ বিষয়াবলী, আন্তর্জাতিক, বিজ্ঞান — যেকোনো একটা topic থেকে দাও।`;

    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });
      return this.extractText(response);
    } catch (err) {
      this.logger.error('Claude BCS MCQ failed', err as Error);
      return 'দুঃখিত, এখন BCS question বানাতে পারছি না। একটু পরে আবার চেষ্টা করো। 🙏';
    }
  }

  private extractText(response: Anthropic.Message): string {
    for (const block of response.content) {
      if (block.type === 'text') {
        return block.text;
      }
    }
    return '';
  }
}
