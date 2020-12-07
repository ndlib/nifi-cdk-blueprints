import { Construct, Fn, Stack, StackProps } from '@aws-cdk/core';
import { SubnetType, Vpc } from '@aws-cdk/aws-ec2';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import { AwsLogDriver, Cluster, Compatibility, ContainerImage, FargateService, FargateTaskDefinition, NetworkMode, Secret, TaskDefinition } from '@aws-cdk/aws-ecs';
import { ApplicationTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { CustomEnvironment } from './custom-environment';
import { FoundationStackProps } from './foundation-stack';
import { SharedServiceStackProps } from './shared-stack-props';

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

export interface CAServiceStackProps extends SharedServiceStackProps {
  readonly env: CustomEnvironment;
}

export class CAServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: CAServiceStackProps) {
    super(scope, id, props);

    const vpcId = Fn.importValue(`${props.env.networkStackName}:VPCID`)
    const vpc = Vpc.fromVpcAttributes(this, 'peered-network', {
      vpcId: vpcId,
      availabilityZones: [
        Fn.select(0, Fn.getAzs()),
        Fn.select(1, Fn.getAzs()),
      ],
      publicSubnetIds: [
        Fn.importValue(`${props.env.networkStackName}:PublicSubnet1ID`),
        Fn.importValue(`${props.env.networkStackName}:PublicSubnet2ID`),
      ],
      privateSubnetIds: [
        Fn.importValue(`${props.env.networkStackName}:PrivateSubnet1ID`),
        Fn.importValue(`${props.env.networkStackName}:PrivateSubnet2ID`),
      ],
    });

    const logging = new AwsLogDriver({
      streamPrefix: `${props.env.serviceName}-Task`,
      logGroup: new LogGroup(this, `${this.stackName}`, {
        retention: RetentionDays.ONE_WEEK,
      }),
    })

    const secretsHelper = (task: string, key: string, version = 1) => {
      const parameter = StringParameter.fromSecureStringParameterAttributes(this, `${task}${key}`, {
        parameterName: ``,
        version: version,
      });
      return Secret.fromSsmParameter(parameter);
    };

    const containerImage = new DockerImageAsset(this, `${props.env.serviceName}-CA-Image`, {
      directory: '',
      file: '',
    });

    const task = new FargateTaskDefinition(this, `${props.env.serviceName}-CA-Task`, {
      cpu: 256,
      memoryLimitMiB: 512,
      family: `${props.env.serviceName}-CA-Service`,
    });

    const container = task.addContainer(`${props.env.serviceName}-CA-Container`, {
      image: ContainerImage.fromDockerImageAsset(containerImage),
      essential: true,
      logging,
      secrets: {
        SECRET_KEY_BASE: secretsHelper('', ''),
      },
      environment: {

      },
    });

    const appService = new FargateService(this, `${props.env.serviceName}-CA-Service`, {
      taskDefinition: task,
      cluster: props.foundationStack.containerCluster,
      vpcSubnets: { subnetType: SubnetType.PRIVATE },
      desiredCount: 1,
    });

    const targetGroup = new ApplicationTargetGroup(this, `${props.env.serviceName}-CA-TargetGroup`, {

    });
    // targetGroup.addTarget(targets: task);
  }
}
