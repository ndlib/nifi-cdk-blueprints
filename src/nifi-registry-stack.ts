import { Construct, Fn, Stack, StackProps } from '@aws-cdk/core';
import { Cluster, Compatibility, NetworkMode, TaskDefinition } from '@aws-cdk/aws-ecs';
import { Vpc } from '@aws-cdk/aws-ec2';

// import codebuild = require('@aws-cdk/aws-codebuild');
// import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
// import { GitHubSourceAction, CodeBuildAction, ManualApprovalAction, ServiceCatalogDeployAction } from '@aws-cdk/aws-codepipeline-actions';
// import { Construct, Duration, FileSystem, Fn, RemovalPolicy, SecretValue, Stack, StackProps } from '@aws-cdk/core';
// import { Vpc, SecurityGroup, CfnVPCCidrBlock } from '@aws-cdk/aws-ec2';
// import { PolicyStatement } from '@aws-cdk/aws-iam';
// import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
// import { Bucket, BucketAccessControl } from '@aws-cdk/aws-s3';
// import { NamespaceType, PrivateDnsNamespace, Service } from '@aws-cdk/aws-servicediscovery';
// import { Topic } from '@aws-cdk/aws-sns';
// import { ArtifactBucket, HttpsAlb, SlackApproval } from '@ndlib/ndlib-cdk';

export interface NiFiRegistryServiceStackProps extends StackProps {
  readonly networkStackName: string;
  readonly infrastructureStackName: string;
  readonly namespace: string;
  readonly environment: string;
  readonly serviceName: string;
}

export class NiFiRegistryServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: NiFiRegistryServiceStackProps) {
    super(scope, id, props);

    const vpcId = Fn.importValue(`${props.networkStackName}:VPCID`)
    const vpc = Vpc.fromVpcAttributes(this, 'peered-network', {
      vpcId: vpcId,
      availabilityZones: [
        Fn.select(0, Fn.getAzs()),
        Fn.select(1, Fn.getAzs()),
      ],
      publicSubnetIds: [
        Fn.importValue(`${props.networkStackName}:PublicSubnet1ID`),
        Fn.importValue(`${props.networkStackName}:PublicSubnet2ID`),
      ],
      privateSubnetIds: [
        Fn.importValue(`${props.networkStackName}:PrivateSubnet1ID`),
        Fn.importValue(`${props.networkStackName}:PrivateSubnet2ID`),
      ],
    });

    const task = new TaskDefinition(this, '${props.serviceName}-Registry-Task', {
      compatibility: Compatibility.FARGATE,
      cpu: '256',
      memoryMiB: '512',
      networkMode: NetworkMode.AWS_VPC,
      family: `${this.stackName}-Registry-Service`,
    });


  }
}
