import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";

export interface AuroraStackProps extends StackProps {
  vpc: ec2.IVpc;
}

export class AuroraStack extends Stack {
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: AuroraStackProps) {
    super(scope, id, props);

    const sg = new ec2.SecurityGroup(this, "AuroraSecurityGroup", {
      vpc: props.vpc,
      description: "Security group for Aurora PostgreSQL cluster",
      allowAllOutbound: true,
    });

    this.cluster = new rds.DatabaseCluster(this, "ProductMasterAuroraCluster", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_6,
      }),

      // ★ writer は Serverless v2 インスタンスを1台だけ
      writer: rds.ClusterInstance.serverlessV2("WriterInstance", {
        publiclyAccessible: false,
      }),

      // ★ Serverless v2 のスケーリング設定
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 4,

      // ★ クラスタ全体の設定
      defaultDatabaseName: "product_master",
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [sg],

      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY, // 開発用。本番は RETAIN 推奨
    });
  }
}
