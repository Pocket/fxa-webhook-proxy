import { Construct } from 'constructs';
import { App, DataTerraformRemoteState, RemoteBackend, TerraformStack } from 'cdktf';
import { AwsProvider, DataSources } from '@cdktf/provider-aws';
import { config } from './config';
import { PocketPagerDuty } from '@pocket-tools/terraform-modules';
import { PagerdutyProvider } from '@cdktf/provider-pagerduty';

class FxAWebhookProxy extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });
    new PagerdutyProvider(this, 'pagerduty_provider', { token: undefined });

    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'Pocket',
      workspaces: [{ prefix: `${config.name}-` }]
    });

    const region = new DataSources.DataAwsRegion(this, 'region');
    const caller = new DataSources.DataAwsCallerIdentity(this, 'caller');
  }

  /**
   * Create PagerDuty service for alerts
   * @private
   */
  private createPagerDuty() {
    // don't create any pagerduty resources if in dev
    if (config.isDev) {
      return undefined;
    }

    const incidentManagement = new DataTerraformRemoteState(
      this,
      'incident_management',
      {
        organization: 'Pocket',
        workspaces: {
          name: 'incident-management'
        }
      }
    );

    return new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        criticalEscalationPolicyId: incidentManagement.get(
          'policy_backend_critical_id'
        ),
        nonCriticalEscalationPolicyId: incidentManagement.get(
          'policy_backend_non_critical_id'
        )
      }
    });
  }
}

const app = new App();
new FxAWebhookProxy(app, 'fxa-webhook-proxy');
app.synth();
