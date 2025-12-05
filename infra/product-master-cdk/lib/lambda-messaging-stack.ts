// infra/product-master-cdk/lib/lambda-messaging-stack.ts（将来）
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export interface LambdaMessagingStackProps extends StackProps {
  vpc: ec2.IVpc;
  productMasterTable: dynamodb.ITable;
  auroraCluster: rds.IDatabaseCluster;
}

export class LambdaMessagingStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaMessagingStackProps) {
    super(scope, id, props);

    // 例: 同期 Lambda（DynamoDB ⇔ Aurora ⇔ Shopify）
    // 例: SNS Topic（SMS送信 / アラート）
    // 例: CPC 系のメトリクスを集計して通知 など
  }
}
