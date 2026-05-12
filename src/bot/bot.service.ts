import { Injectable, Logger } from '@nestjs/common';
import { MessengerService } from '../messenger/messenger.service';
import { ClaudeService, CvData } from '../claude/claude.service';

type ConvState =
  | 'IDLE'
  | 'CV_NAME'
  | 'CV_PHONE'
  | 'CV_EMAIL'
  | 'CV_EDUCATION'
  | 'CV_EXPERIENCE'
  | 'CV_SKILLS';

interface Conversation {
  state: ConvState;
  cv: Partial<CvData>;
}

const GREETINGS = ['hi', 'hello', 'hey', 'হাই', 'হ্যালো', 'শুরু', 'start'];

const MENU = `স্বাগতম JobBondhu AI তে! 👋
আমি তোমার চাকরির স্মার্ট সঙ্গী!

1️⃣ আজকের Job Circular
2️⃣ AI দিয়ে CV বানাও
3️⃣ Interview Preparation
4️⃣ BCS Practice
5️⃣ আমার সাথে কথা বলো (AI)

একটা number পাঠাও!`;

const JOB_CATEGORIES = `আজকের Job Circular 📋

🏛️ সরকারি চাকরি
🏢 বেসরকারি চাকরি
💻 IT Jobs
🌍 বিদেশে যেতে চাই

কোন category চাও? লেখো!`;

const INTERVIEW_PREP = `Interview Preparation 💼

কোন ধরনের interview?
1. Govt / BCS
2. Private Company
3. IT Company

number লেখো!`;

const CV_INTRO = `AI CV Builder 📄

তোমার CV বানাতে এই তথ্যগুলো দাও:
1. তোমার পুরো নাম কী?`;

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private readonly conversations = new Map<string, Conversation>();

  constructor(
    private readonly messenger: MessengerService,
    private readonly claude: ClaudeService,
  ) {}

  async handleMessage(senderId: string, rawText: string): Promise<void> {
    const text = rawText.trim();
    this.logger.log(`← ${senderId}: ${text}`);

    const convo = this.getOrCreate(senderId);

    if (convo.state !== 'IDLE') {
      await this.handleCvFlow(senderId, convo, text);
      return;
    }

    const lower = text.toLowerCase();
    if (GREETINGS.some((g) => lower === g || lower.startsWith(g))) {
      await this.messenger.sendText(senderId, MENU);
      return;
    }

    switch (text) {
      case '1':
        await this.messenger.sendText(senderId, JOB_CATEGORIES);
        return;
      case '2':
        convo.state = 'CV_NAME';
        convo.cv = {};
        await this.messenger.sendText(senderId, CV_INTRO);
        return;
      case '3':
        await this.messenger.sendText(senderId, INTERVIEW_PREP);
        return;
      case '4': {
        const mcq = await this.claude.bcsMcq();
        await this.messenger.sendText(senderId, mcq);
        return;
      }
      default: {
        const reply = await this.claude.chat(text);
        await this.messenger.sendText(senderId, reply);
        return;
      }
    }
  }

  private async handleCvFlow(
    senderId: string,
    convo: Conversation,
    text: string,
  ): Promise<void> {
    switch (convo.state) {
      case 'CV_NAME':
        convo.cv.name = text;
        convo.state = 'CV_PHONE';
        await this.messenger.sendText(senderId, '2. তোমার ফোন নম্বর কী?');
        return;
      case 'CV_PHONE':
        convo.cv.phone = text;
        convo.state = 'CV_EMAIL';
        await this.messenger.sendText(senderId, '3. তোমার ইমেইল কী?');
        return;
      case 'CV_EMAIL':
        convo.cv.email = text;
        convo.state = 'CV_EDUCATION';
        await this.messenger.sendText(
          senderId,
          '4. তোমার শিক্ষাগত যোগ্যতা কী? (যেমন: BSc in CSE, DU)',
        );
        return;
      case 'CV_EDUCATION':
        convo.cv.education = text;
        convo.state = 'CV_EXPERIENCE';
        await this.messenger.sendText(
          senderId,
          '5. তোমার কাজের অভিজ্ঞতা কী? (না থাকলে "নাই" লেখো)',
        );
        return;
      case 'CV_EXPERIENCE':
        convo.cv.experience = text;
        convo.state = 'CV_SKILLS';
        await this.messenger.sendText(
          senderId,
          '6. তোমার দক্ষতা কী কী? (comma দিয়ে লেখো)',
        );
        return;
      case 'CV_SKILLS': {
        convo.cv.skills = text;
        await this.messenger.sendText(
          senderId,
          'তোমার CV বানাচ্ছি... একটু অপেক্ষা করো ⏳',
        );
        const summary = await this.claude.generateCv(convo.cv as CvData);
        await this.messenger.sendText(senderId, summary);
        await this.messenger.sendText(
          senderId,
          'আরও কিছু লাগলে "হাই" পাঠাও — menu আবার দেখাবো! 👋',
        );
        convo.state = 'IDLE';
        convo.cv = {};
        return;
      }
    }
  }

  private getOrCreate(senderId: string): Conversation {
    let convo = this.conversations.get(senderId);
    if (!convo) {
      convo = { state: 'IDLE', cv: {} };
      this.conversations.set(senderId, convo);
    }
    return convo;
  }
}
