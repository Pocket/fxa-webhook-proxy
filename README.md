# FxA Webhook Proxy (aka Firefox Accounts Webhook Proxy Service)

Receives FxA events as webhook requests and proxies the requests to the User Service through the Client API.

Service page (internal): [FxA Webhook Proxy](https://getpocket.atlassian.net/wiki/spaces/PE/pages/2587131924/FxA+User+Service+Proxy)

## Architecture
![image](https://user-images.githubusercontent.com/34227334/142259446-2eca97de-8e69-4256-b5c1-9544e2edc8c3.png)

Source: [Miro](https://miro.com/app/board/o9J_llkJd_0=/)

## Folder structure
- the infrastructure code is present in `.aws`
- the application code is in `src`
- `.docker` contains local setup
- `.circleci` contains circleCI setup

## Develop Locally
```bash
npm install
npm start:dev
```

## Start docker
```bash
# npm ci not required if already up-to-date
npm ci
docker compose up
```
