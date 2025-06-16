# Slack Bot 메시지 전송 curl 예시

## 기본 메시지 전송

```bash
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"안녕하세요! 이것은 테스트 메시지입니다."}' \
https://hooks.slack.com/services/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
```

## 채널 지정하여 메시지 전송

```bash
curl -X POST -H 'Content-type: application/json' \
--data '{
  "channel": "#general",
  "text": "안녕하세요! 이것은 #general 채널로 보내는 메시지입니다."
}' \
https://hooks.slack.com/services/YOUR_WEBHOOK_URL
```

## 블록 키트를 사용한 메시지 전송

```bash
curl -X POST -H 'Content-type: application/json' \
--data '{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*안녕하세요!*\n이것은 블록 키트를 사용한 메시지입니다."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "버튼을 클릭해보세요!"
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "클릭",
          "emoji": true
        },
        "value": "click_me_123"
      }
    }
  ]
}' \
https://hooks.slack.com/services/YOUR_WEBHOOK_URL
```

## 주의사항

1. `YOUR_WEBHOOK_URL`을 실제 Slack Webhook URL로 교체해야 합니다.
2. Webhook URL은 Slack API 웹사이트에서 생성할 수 있습니다.
3. Webhook URL은 비밀이므로 안전하게 보관해야 합니다.
4. 메시지 전송 시 rate limit에 주의해야 합니다.
