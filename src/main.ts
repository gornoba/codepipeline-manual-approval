import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { IncomingWebhookRequestBody, SnsMsg } from './app.interface';
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
    const result = parsed.actions[0].name;

    const value = JSON.parse(parsed.actions[0].value);

    const pushResult = await appService.executeApproval(value);

    let payload = null;
    if (pushResult) {
      payload = {
        attachments: [
          {
            color: result === 'approve' ? '#00FF00' : '#FF0000',
            text:
              `⏰ 시간: ${dayjs
                .unix(Number(parsed.action_ts))
                .tz('Asia/Seoul')
                .format('YYYY-MM-DD HH:mm:ss')}\n\n` +
              `🔄 Pipeline Name: ${value.pipelineName} (<${value.approvalReviewLink}|링크>)\n\n` +
              `👤 승인자: ${parsed.user.name}\n\n` +
              `${result === 'approve' ? '✅' : '❌'} 승인 여부: ${parsed.actions[0].name}`,
          },
        ],
      };
    } else {
      payload = {
        attachments: [
          {
            color: '#FF0000',
            text:
              '❌ 승인 요청이 거절되었습니다.\n\n' +
              `⏰ 시간: ${dayjs
                .unix(Number(parsed.action_ts))
                .tz('Asia/Seoul')
                .format('YYYY-MM-DD HH:mm:ss')}\n\n` +
              `🔄 Pipeline Name: ${value.pipelineName} (<${value.approvalReviewLink}|링크>)`,
          },
        ],
      };
    }

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
