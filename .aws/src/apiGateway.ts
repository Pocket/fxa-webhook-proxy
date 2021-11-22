import {
  ApiGatewayLambdaRoute,
  LAMBDA_RUNTIMES,
  PocketApiGateway,
  PocketApiGatewayProps,
  PocketPagerDuty,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { config } from './config';
import { getEnvVariableValues } from './utilities';
import { Resource } from 'cdktf';
import { Construct } from 'constructs';

export class ApiGateway extends Resource {
  constructor(
    scope: Construct,
    private name: string,
    private vpc: PocketVPC,
    pagerDuty?: PocketPagerDuty
  ) {
    super(scope, name);
    const { sentryDsn, gitSha } = getEnvVariableValues(this);
    const fxaEventsRoute: ApiGatewayLambdaRoute = {
      path: 'events',
      method: 'POST',
      eventHandler: {
        name: `${config.prefix}-ApiGateway-FxA-Events`,
        lambda: {
          runtime: LAMBDA_RUNTIMES.NODEJS14,
          handler: 'index.handler',
        },
      },
    };
    const pocketApiGatewayProps: PocketApiGatewayProps = {
      name: `${config.name}-API-Gateway`,
      stage: config.environment.toLowerCase(),
      routes: [fxaEventsRoute],
    };

    new PocketApiGateway(
      this,
      'fxa-events-apigateway-lambda',
      pocketApiGatewayProps
    );
  }
}
