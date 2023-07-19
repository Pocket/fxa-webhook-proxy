# FxA Webhook Proxy (aka Firefox Accounts Webhook Proxy Service)

Receives FxA events as webhook requests and proxies the requests to the User Service through the Client API.

Service page (internal): [FxA Webhook Proxy](https://getpocket.atlassian.net/wiki/spaces/PE/pages/2587131924/FxA+User+Service+Proxy)

## Architecture

![image](https://user-images.githubusercontent.com/34227334/142259446-2eca97de-8e69-4256-b5c1-9544e2edc8c3.png)

Source: [Miro](https://miro.com/app/board/o9J_llkJd_0=/)

## Folder structure

- the infrastructure code is present in `.aws`
- `.docker` contains local setup
- `.circleci` contains circleCI setup
- `gateway_lambda` contains code for the lambda that listens for events from FxA and sends them to the SQS created in `.aws/src/main.ts`
- `sqs_lambda` contains code for the lambda that consumes messages from the SQS created in `.aws/src/main.ts`

## Develop Locally

As this repo consists of only two lambdas, there isn't much to run locally aside from tests.

First, install dependencies in all folders:

```bash
npm run setup
```

### Running Spec Tests

```bash
npm run test-spec
```

### Running Functional Tests

```bash
docker compose up
npm run test-functional
```
