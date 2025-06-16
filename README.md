## Slack Bot

### Slack Bot 생성

- https://api.slack.com
  - Your apps → Create New App → From Search → App Name → Pick a workspace to develop your app in (원하는 workspace 선택)

### OAuth & Permissions

- Scopes
  - chat:write
  - incoming-webhook
  - OAuth Tokens
  - Install to [workspace]

### Incoming Webhooks

- 이곳에서 Webhook URL과 테스트를 해볼 수 있습니다.

### Interactivity & Shortcuts

- 나중에 Lambda가 생성되고 Interactivity의 Request URL에 Lambda 도메인을 넣으면 됩니다.

## AWS

### SNS

- 주제 → 주제생성
  - 유형 → 표준
  - 생성

### Lambda

- 함수 → 함수생성

  - 함수이름, 런타임 설정
  - 추가구성
    - 함수 URL 활성화
    - 인증을 NONE으로 설정
    - 생성
    - IAM 역할이 <myFunctionName>-role-<random> 의 형식으로 생성됨
      - 생성된 IAM 역할에 AWSCodePipelineApproverAccess 정책권한을 넣어준다.

- 생성 뒤

  - 함수개요 or 구성 → 트리거추가 → 소스선택 → SNS → 위에서 만든 주제 선택
  - Interactivity & Shortcuts 에 함수 URL 입력

- 코드 작성 뒤 넣어 줌
  - 짧을 경우는 복사 붙여넣기하고
  - 코드가 길 경우는 압축하거나 s3를 이용해 업로드하여 코드 push
  - 해당 코드는 압축해서 업로드 하였음

### Code Pipeline

- 보통 Source (대부분 Git) 스테이지 다음에 넣어준다.
- 스테이지 추가 → 작업그룹 추가 → 작업공급자 수동승인 → SNS 주제 ARN (이전에 생성한 SNS) → 완료 → 저장

## 환경변수

- SLACK_WEBHOOK_URL (slack webhook 주소)
- SLACK_AUTH (codepipeline에서 진행됨을 인증하는 인증키)

## Installation

```bash
$ npm install
```

## Test

```bash
# serverless offline
$ nest build --webpack && npx serverless offline

# ngrok
$ ngrok http 3000
```

## License

MIT
