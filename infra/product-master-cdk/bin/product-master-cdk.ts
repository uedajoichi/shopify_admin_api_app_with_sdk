#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { ProductMasterDynamoStack } from '../lib/product-master-dynamo-stack';
import { AuroraStack } from '../lib/aurora-stack';

const app = new App();

// 必要ならアカウント・リージョンを固定
// const env = { account: '123456789012', region: 'ap-northeast-1' };

// ① VPC
const network = new NetworkStack(app, 'NetworkStack', {
  // env,
});

// ② DynamoDB（VPCに依存しない）
const dynamo = new ProductMasterDynamoStack(app, 'ProductMasterDynamoStack', {
  // env,
});

// ③ Aurora（VPC内に作成）
const aurora = new AuroraStack(app, 'AuroraStack', {
  vpc: network.vpc,
  // env,
});

// 将来ここに Lambda/SNS/CPC 用スタックを足せる
// new LambdaMessagingStack(app, 'LambdaMessagingStack', { vpc: network.vpc, ... });



// #!/usr/bin/env node
// import "source-map-support/register";
// import { App } from "aws-cdk-lib";
// import { ProductMasterStack } from "../lib/product-master-stack";

// const app = new App();

// // 必要なら env を指定
// // const env = { account: '123456789012', region: 'ap-northeast-1' };

// new ProductMasterStack(app, "ProductMasterStack", {
//   // env,
// });


