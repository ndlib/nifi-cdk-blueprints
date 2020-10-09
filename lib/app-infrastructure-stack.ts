import { Construct, Duration, Fn, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { Vpc, SecurityGroup } from '@aws-cdk/aws-ec2';
import { Cluster } from '@aws-cdk/aws-ecs';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import { Bucket, BucketAccessControl } from '@aws-cdk/aws-s3';
import { NamespaceType, PrivateDnsNamespace, Service } from '@aws-cdk/aws-servicediscovery';
import { HttpsAlb } from '@ndlib/ndlib-cdk';

export interface NiFiAppInfrastructureProps extends StackProps {
  readonly owner: string;
  readonly contact: string;
  readonly networkStackName: string;
  readonly serviceName: string;
  readonly domainStack: string;
}

export class NiFiAppInfrastructureStack extends Stack {
  public readonly loadBalancer: HttpsAlb;
  public readonly logs: LogGroup;
  public readonly vpc: Vpc;
  public readonly logBucket: Bucket;
  public readonly privateNamespace: PrivateDnsNamespace;
  constructor(scope: Construct, id: string, props: NiFiAppInfrastructureProps) {
    super(scope, id, props);

    const owner = props.owner || `see stack: ${this.stackName}`;
    const contact = props.contact || `see stack: ${this.stackName}`;

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

    this.loadBalancer = new HttpsAlb(this, `${props.serviceName}-LoadBalancer`, {
      certificateArns: [ Fn.importValue(`${props.domainStack}:ACMCertificateARN`) ],
      vpc: vpc,
      internetFacing: true,
    });

    this.logBucket = new Bucket(this, `${props.serviceName}-LogBucket`, {
      accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecycleRules: [{
        enabled: true,
        expiration: Duration.days(365 * 10),
        noncurrentVersionExpiration: Duration.days(1),
      }],
    });

    this.logs = new LogGroup(this, `${props.serviceName}-LogGroup`, {
      retention: RetentionDays.ONE_MONTH,
      logGroupName: this.stackName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // this.privateNamespace = new PrivateDnsNamespace(this, `${props.serviceName}-Namespace`, {
    //   vpc: vpc,
    //   name: `${props.serviceName}`,
    //   description: `Private Namespace for ${props.serviceName}`,
    // });

    const NiFiCloudMapService = new Service(this, `${props.serviceName}-CloudMap`, {
      namespace: this.privateNamespace,
      name: `${props.serviceName}`,
      description: `Cloud Map for ${props.serviceName}`,
      loadBalancer: true,

    });

    const NiFiContainerCluster = new Cluster(this, `${props.serviceName}-ContainerCluster`, {
      vpc: vpc,
      clusterName: this.stackName,
      defaultCloudMapNamespace: {
        vpc: vpc,
        name: `${props.serviceName}`,
        type: NamespaceType.DNS_PRIVATE,
      },
    });

    const NiFiLoadBalancerSecurityGroup = new SecurityGroup(this, `${props.serviceName}-LoadBalancerSecurityGroup`, {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'Access to the public facing load balancer',
      securityGroupName: this.stackName,
    });

  }
}
