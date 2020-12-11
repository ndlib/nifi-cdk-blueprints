import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import * as Cdk from '../src/app-infrastructure-stack'

test('Empty Stack', () => {
  const app = new cdk.App()
  // WHEN
  const stack = new Cdk.NiFiAppInfrastructureStack(app, 'NiFiAppInfrastructureTestStack', {
    owner: 'Justin Rittenhouse',
    contact: 'jrittenh@nd.edu',
    networkStackName: 'peered-network',
    serviceName: 'nifi',
    domainStackName: '',
    dnsNamespace: 'nifi',
  })
  // THEN
  expectCDK(stack).to(matchTemplate({
    Resources: {},
  }, MatchStyle.EXACT))
})
