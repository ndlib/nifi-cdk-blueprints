import { StackProps } from '@aws-cdk/core';
import { FoundationStack } from './foundation-stack';

export interface SharedServiceStackProps extends StackProps {
    foundationStack: FoundationStack;
}
