import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { SnsMsg } from './app.interface';
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

    const res = await firstValueFrom(
      this.httpService.post(process.env.SLACK_WEBHOOK_URL, payload),
    );

    return res.data;
  }

  async executeApproval(value: {
    pipelineName: string;
    approve: boolean;
    token: string;
    stageName: string;
    actionName: string;
    auth: string;
  }) {
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
}
