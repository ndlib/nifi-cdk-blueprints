import { Construct, Fn, Stack, StackProps } from '@aws-cdk/core';
import { Vpc } from '@aws-cdk/aws-ec2';

export interface NiFiCAServiceStackProps extends StackProps {
    readonly networkStackName: string;
    readonly infrastructureStackName: string;
    readonly namespace: string;
    readonly environment: string;
}

export class NiFiCAServiceStack extends Stack {
    constructor(scope: Construct, id: string, props: NiFiCAServiceStackProps) {
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

        // const
    }
}
