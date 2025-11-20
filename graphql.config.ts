// graphql.config.ts（root に配置）
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  // Shopify Admin GraphQL のスキーマ
  // バージョンは好きなものに変更OK（2025-01 など）
  schema: "https://shopify.dev/admin-graphql-direct-proxy/2025-07",

  // あなたが書く .graphql ファイルの場所
  documents: "./packages/shopify-admin-sdk/src/graphql/*.graphql",

  generates: {
    // 1. 型定義だけのファイル
    "./packages/shopify-admin-sdk/src/generated/admin.types.ts": {
      plugins: ["typescript", "typescript-operations"],
    },

    // 2. getSdk() を含むクライアント
    "./packages/shopify-admin-sdk/src/generated/admin.sdk.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-graphql-request",
      ],
    },
  },

  // お好み：strict 系のオプションを追加してもOK
  config: {
    avoidOptionals: true,
    immutableTypes: true,
  },
};

export default config;
