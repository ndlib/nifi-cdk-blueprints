import { Construct, Duration, Fn, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { Vpc, SecurityGroup } from '@aws-cdk/aws-ec2';
import { Cluster } from '@aws-cdk/aws-ecs';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import { Bucket, BucketAccessControl } from '@aws-cdk/aws-s3';
import { INamespace, NamespaceType, Service } from '@aws-cdk/aws-servicediscovery';
import { HttpsAlb } from '@ndlib/ndlib-cdk';
import { CustomEnvironment } from './custom-environment';

export interface FoundationStackProps extends StackProps {
  readonly env: CustomEnvironment;
}

export class FoundationStack extends Stack {
  public readonly loadBalancer: HttpsAlb;
  public readonly logs: LogGroup;
  public readonly vpc: Vpc;
  public readonly logBucket: Bucket;
  public readonly privateNamespace: INamespace;
  public readonly cloudMapService: Service;
  public readonly containerCluster: Cluster;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: FoundationStackProps) {
    super(scope, id, props);

    const vpcId = Fn.importValue(`${props.env.networkStackName}:VPCID`);
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

    this.securityGroup = new SecurityGroup(this, `${props.env.name}-LoadBalancerSecurityGroup`, {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'Access to the public facing load balancer',
      securityGroupName: this.stackName,
    });

    this.loadBalancer = new HttpsAlb(this, `${props.env.name}-LoadBalancer`, {
      certificateArns: [ Fn.importValue(`${props.env.domainStackName}:ACMCertificateARN`) ],
      vpc: vpc,
      internetFacing: true,
    });

    this.logBucket = new Bucket(this, `${props.env.name}-LogBucket`, {
      accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecycleRules: [{
        enabled: true,
        expiration: Duration.days(365 * 10),
        noncurrentVersionExpiration: Duration.days(1),
      }],
    });

    this.logs = new LogGroup(this, `${props.env.name}-LogGroup`, {
      retention: RetentionDays.ONE_MONTH,
      logGroupName: this.stackName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.containerCluster = new Cluster(this, `${props.env.name}-ContainerCluster`, {
      vpc: vpc,
      clusterName: this.stackName,
    });
    this.privateNamespace = this.containerCluster.addDefaultCloudMapNamespace({
      name: `${props.env.domainStackName.dnsNamespace}`,
      vpc: vpc,
      type: NamespaceType.DNS_PRIVATE,
    });

    this.cloudMapService = new Service(this, `${props.env.name}-CloudMap`, {
      namespace: this.privateNamespace,
      name: `${props.env.name}`,
      description: `Cloud Map for ${props.env.name}`,
      loadBalancer: true,
    });
  }
}
