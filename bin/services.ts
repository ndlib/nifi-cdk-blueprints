import { App } from '@aws-cdk/core'
import { env } from 'process'
import { CustomEnvironment } from '../src/custom-environment'
import { FoundationStack } from '../src/foundation-stack'
import { CAServiceStack } from '../src/ca-stack'
import { RegistryServiceStack } from '../src/registry-stack'
import { Stacks } from '../src/types'
import { getContextByNamespace } from '../src/context-helpers'

export const instantiateStacks = (app: App, namespace: string, env: CustomEnvironment): Stacks => {
  const commonProps = {
    namespace,
    env: env,
  }

  const foundationStack = new FoundationStack(app, `${namespace}-foundation`, {
    ...commonProps,
  })

  const caServiceContext = getContextByNamespace('ca-service')
  const caServiceStack = new CAServiceStack(app, `${namespace}-ca-service`, {
    foundationStack,
    ...commonProps,
    ...caServiceContext,
  })

  const registryServiceStack = new RegistryServiceStack(app, `${namespace}-registry-service`, {
    ...commonProps,
  })

  return { foundationStack, caServiceStack, registryServiceStack }
}
