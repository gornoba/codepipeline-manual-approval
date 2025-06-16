export interface IncomingWebhookRequestBody {
  type: string;
  actions: [
    {
      name: string;
      type: string;
      value: string;
    },
  ];
  callback_id: string;
  team: { id: string; domain: string };
  channel: { id: string; name: string };
  user: { id: string; name: string };
  action_ts: string;
  message_ts: string;
  attachment_id: string;
  token: string;
  is_app_unfurl: boolean;
  enterprise: string | null;
  is_enterprise_install: boolean;
  original_message: {
    subtype: string;
    text: string;
    attachments: {
      text: string;
      callback_id: string;
      actions: {
        name: string;
        type: string;
        value: string;
      }[];
    }[];
    type: string;
    ts: string;
    bot_id: string;
    blocks: [
      {
        type: string;
        block_id: string;
        elements: {
          type: string;
          elements: {
            type: string;
            name?: string;
            unicode?: string;
            text?: string;
            style?: {
              bold?: boolean;
              italic?: boolean;
            };
          }[];
        }[];
      },
    ];
  };
  response_url: string;
  trigger_id: string;
}

export interface SnsMsg {
  region: string;
  consoleLink: string;
  approval: {
    pipelineName: string;
    stageName: string;
    actionName: string;
    token: string;
    expires: string;
    externalEntityLink: string | null;
    approvalReviewLink: string;
    customData: string | null;
  };
}
