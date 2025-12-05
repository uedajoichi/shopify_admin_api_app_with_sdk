import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface NetworkStackProps extends StackProps {}

export class NetworkStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: NetworkStackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "AppVpc", {
      vpcName: "shopify-admin-vpc",
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: "public",
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          name: "private-egress",
        },
      ],
    });
  }
}

// // infra/product-master-cdk/lib/network-stack.ts
// import { Stack, StackProps } from "aws-cdk-lib";
// import { Construct } from "constructs";
// import * as ec2 from "aws-cdk-lib/aws-ec2";

// export interface NetworkStackProps extends StackProps {
//   // 将来ここに VPC CIDR などを外から渡してもOK
// }

// export class NetworkStack extends Stack {
//   public readonly vpc: ec2.Vpc;

//   constructor(scope: Construct, id: string, props?: NetworkStackProps) {
//     super(scope, id, props);

//     this.vpc = new ec2.Vpc(this, "AppVpc", {
//       vpcName: "shopify-admin-vpc",
//       maxAzs: 2,
//       natGateways: 1,
//       subnetConfiguration: [
//         {
//           subnetType: ec2.SubnetType.PUBLIC,
//           name: "public",
//         },
//         {
//           subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
//           name: "private-egress",
//         },
//       ],
//     });

//     // 将来 Lambda, Aurora, ECS などはこの VPC にぶら下げる想定
//   }
// }
