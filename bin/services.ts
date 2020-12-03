import { App } from '@aws-cdk/core';
import { env } from 'process';
import { NiFiCAServiceStack } from '../src/nifi-ca-stack';
import { NiFiRegistryServiceStack } from '../src/nifi-registry-stack';

export const instantiateStacks = (app: App, namespace: string, env: CustomEnvironment): Stacks ={
    const commonProps = {
        namespace,
        env: env,
    }
}
