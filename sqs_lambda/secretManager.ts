import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import config from './config';

const client = new SecretsManagerClient({ region: config.aws.region });

//https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/getsecretvaluecommand.html
export async function getFxaPrivateKey() {
  let privateKey;
  try {
    privateKey = await client.send(
      new GetSecretValueCommand({
        SecretId: config.aws.keyName,
      })
    );
  } catch (e) {
    throw new Error('unable to fetch private key' + e);
  }
  return privateKey;
}
