import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import {
  ApprovalValue,
  IncomingWebhookRequestBody,
  SnsMsg,
} from './app.interface';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const appService = appContext.get(AppService);

  const method =
    event?.requestContext?.httpMethod || event.requestContext?.http?.method;

  // 승인 요청 처리
  if (method === 'POST' && /Slackbot/.test(event.headers['user-agent'])) {
    const isBase64Encoded = event?.isBase64Encoded;
    const body = isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body;

    const encodedPayload = body.replace(/^payload=/, '');
    const decoded = decodeURIComponent(encodedPayload);
    const parsed = JSON.parse(decoded) as IncomingWebhookRequestBody;

    const requestResult = parsed.actions[0].name;
    const value = JSON.parse(parsed.actions[0].value) as ApprovalValue;
    const pushResult = await appService.executeApproval(value);
    const payload = appService.generateApprovalPayload(
      pushResult,
      requestResult,
      parsed,
      value,
    );

    return { statusCode: HttpStatus.OK, body: JSON.stringify(payload) };
  }

  // 배포 요청 처리
  if (event.Records?.[0]?.Sns?.Message) {
    const msg = JSON.parse(event.Records[0].Sns.Message) as SnsMsg;

    // 슬랙에 보낼 승인 요청 메시지 생성
    const slackPayload = await appService.processIncome(msg);

    return { statusCode: HttpStatus.OK, body: JSON.stringify(slackPayload) };
  }

  return { statusCode: HttpStatus.NOT_IMPLEMENTED, body: 'not implemented' };
};
