import { Resource } from 'cdktf';
import { Construct } from 'constructs';
import { config } from './config';
import {
  ApplicationSQSQueue,
  LAMBDA_RUNTIMES,
  PocketPagerDuty,
  PocketSQSWithLambdaTarget,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { getEnvVariableValues } from './utilities';
import { SQS } from '@cdktf/provider-aws';
import SqsQueue = SQS.SqsQueue;

export class SqsLambda extends Resource {
  constructor(
    scope: Construct,
    private name: string,
    private vpc: PocketVPC,
    private sqsQueue: SqsQueue,
    pagerDuty?: PocketPagerDuty
  ) {
    super(scope, name);

    const { sentryDsn, gitSha } = getEnvVariableValues(this);

    new PocketSQSWithLambdaTarget(this, 'fxa-events-sqs-lambda', {
      name: `${config.prefix}-Sqs-FxA-Events`,
      // set batchSize to something reasonable
      batchSize: 25,
      batchWindow: 60,
      configFromPreexistingSqsQueue: {
        name: sqsQueue.name,
      },
      lambda: {
        runtime: LAMBDA_RUNTIMES.NODEJS14,
        handler: 'index.handler',
        timeout: 120,
        environment: {
          REGION: vpc.region,
          JWT_KEY: config.sqsLambda.jwtKey,
          SENTRY_DSN: sentryDsn,
          GIT_SHA: gitSha,
          ENVIRONMENT:
            config.environment === 'Prod' ? 'production' : 'development',
        },
        vpcConfig: {
          securityGroupIds: vpc.defaultSecurityGroups.ids,
          subnetIds: vpc.privateSubnetIds,
        },
        codeDeploy: {
          region: vpc.region,
          accountId: vpc.accountId,
        },
        executionPolicyStatements: [
          {
            actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
            resources: [
              `arn:aws:secretsmanager:${vpc.region}:${vpc.accountId}:secret:FxAWebhookProxy/${config.environment}`,
              `arn:aws:secretsmanager:${vpc.region}:${vpc.accountId}:secret:FxAWebhookProxy/${config.environment}/*`,
            ],
          },
        ],
        alarms: {
          // TODO: set better alarm values
          /*
          errors: {
            evaluationPeriods: 3,
            period: 3600, // 1 hour
            threshold: 20,
            actions: config.isDev
              ? []
              : [pagerDuty!.snsNonCriticalAlarmTopic.arn],
          },
          */
        },
      },
      tags: config.tags,
    });
  }
}
