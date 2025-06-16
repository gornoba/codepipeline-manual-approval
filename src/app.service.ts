import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  ApprovalValue,
  IncomingWebhookRequestBody,
  SnsMsg,
} from './app.interface';
import AWS from 'aws-sdk';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}

  async processIncome(msg: SnsMsg) {
    const {
      token,
      pipelineName,
      stageName,
      actionName,
      expires,
      approvalReviewLink,
    } = msg.approval;

    const payload = {
      text:
        `🚨 파이프라인 배포 승인 요청 🚨\n\n` +
        `📌 Pipeline Name: *_${pipelineName}_*\n` +
        `✅ 승인하시려면 아래 버튼을 클릭해주세요.\n\n` +
        `🔄 만료 시간: ${dayjs(expires).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')}`,
      attachments: [
        {
          text: '세부내용',
          callback_id: 'approval_cb',
          actions: [
            {
              name: 'approve',
              text: 'Yes',
              type: 'button',
              style: 'primary',
              value: JSON.stringify({
                pipelineName,
                stageName,
                actionName,
                approve: true,
                token,
                approvalReviewLink,
                auth: process.env.SLACK_AUTH,
              }),
            },
            {
              name: 'reject',
              text: 'No',
              type: 'button',
              style: 'danger',
              value: JSON.stringify({
                pipelineName,
                stageName,
                actionName,
                approve: false,
                token,
                approvalReviewLink,
                auth: process.env.SLACK_AUTH,
              }),
            },
          ],
        },
      ],
    };

    const slackWebhookUrl = /dev/.test(pipelineName)
      ? process.env.SLACK_WEBHOOK_URL_DEV
      : process.env.SLACK_WEBHOOK_URL;

    const res = await firstValueFrom(
      this.httpService.post(slackWebhookUrl, payload),
    );

    return res.data;
  }

  async executeApproval(value: ApprovalValue) {
    const { pipelineName, approve, token, stageName, actionName, auth } = value;

    if (auth !== process.env.SLACK_AUTH) {
      return false;
    }

    const client = new AWS.CodePipeline({
      region: 'ap-northeast-2',
    });

    if (!approve) {
      await client
        .putApprovalResult({
          pipelineName,
          stageName,
          actionName,
          token,
          result: {
            summary: 'approval rejected',
            status: 'Rejected',
          },
        })
        .promise();
    } else {
      await client
        .putApprovalResult({
          pipelineName,
          stageName,
          actionName,
          token,
          result: {
            summary: 'approval approved',
            status: 'Approved',
          },
        })
        .promise();
    }

    return true;
  }

  generateApprovalPayload(
    pushResult: boolean,
    requestResult: string,
    parsed: IncomingWebhookRequestBody,
    value: ApprovalValue,
  ) {
    let payload = null;
    if (pushResult) {
      payload = {
        attachments: [
          {
            color: requestResult === 'approve' ? '#00FF00' : '#FF0000',
            text:
              `⏰ 시간: ${dayjs
                .unix(Number(parsed.action_ts))
                .tz('Asia/Seoul')
                .format('YYYY-MM-DD HH:mm:ss')}\n\n` +
              `🔄 Pipeline Name: ${value.pipelineName} (<${value.approvalReviewLink}|링크>)\n\n` +
              `👤 승인자: ${parsed.user.name}\n\n` +
              `${requestResult === 'approve' ? '✅' : '❌'} 승인 여부: ${parsed.actions[0].name}`,
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

    return payload;
  }
}
