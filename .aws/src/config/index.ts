const name = 'FxAWebhookProxy';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';

export const config = {
  name,
  isDev,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'FXAWP',
  environment,
  tags: {
    service: name,
    environment,
  },
  apiGateway: {
  }
};
