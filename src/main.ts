import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT || 8080);
  await app.listen(port);
  Logger.log(`JobBondhu AI listening on :${port}`, 'Bootstrap');
}

bootstrap();
