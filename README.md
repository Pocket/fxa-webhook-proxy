# FxA Webhook Proxy (aka Firefox Accounts Webhook Proxy Service)

Receives FxA events as webhook requests and proxies the requests to the User Service through the Client API.

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
