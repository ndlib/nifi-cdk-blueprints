import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import * as Cdk from '../src/foundation-stack'

test.todo('Empty Stack', /* ()  => {
  const app = new cdk.App()
  // WHEN
  const stack = new Cdk.FoundationStack(app, 'NiFiAppInfrastructureTestStack', {
    env: {
      name: 'test',
      domainName: 'test.edu',
      domainStackName: 'test-edu-domain',
      networkStackName: 'test-network',
      region: 'test-region',
      account: 'test-account',
      createDns: true,
      slackNotifyStackName: 'slack-test',
      createGithubWebhooks: false,
      useExistingDnsZone: true,
      notificationReceivers: 'test@test.edu',
      alarmsEmail: 'test@test.edu',
      serviceName: 'test-service',
      dnsNamespace: 'test.edu',
    },
  })
  // THEN
  expectCDK(stack).to(matchTemplate({
    Resources: {},
  }, MatchStyle.EXACT))
} */)
