このリポジトリは、Shopify Admin API を GraphQL + TypeScript SDK 化し、
外部 API 経由で商品データの登録・更新・削除を行えるカスタムアプリを構築するための
pnpm ワークスペース + モノレポ構成です。

# 🚀 構成概要
```
shopify-admin-app-with-sdk/
├── apps/
│   └── admin-api-server/        # Shopify 認証 ＋ Admin API 呼び出し REST サーバー
│
├── packages/
│   └── shopify-admin-sdk/       # GraphQL Codegen で生成された Admin API SDK
│
├── graphql.config.ts            # GraphQL Codegen 設定
├── pnpm-workspace.yaml          # モノレポ設定
├── tsconfig.base.json           # 共通 TypeScript 設定
└── README.md                    # ← このファイル
```
# 🧩 技術スタック
```
要素	ツール
言語	TypeScript
パッケージ管理	pnpm Workspaces
管理 API	Shopify Admin GraphQL API
コード生成（SDK）	GraphQL Code Generator + Shopify Codegen Preset
カスタムアプリサーバー	Express + Admin OAuth
環境変数管理	dotenv
外部公開	ngrok / Cloudflare Tunnel
```

# 📦 パッケージ構成

**packages/shopify-admin-sdk/**

Shopify Admin API の GraphQL 型定義 & クエリ SDK を提供

下記のような構造で利用：
```
import { createShopifyAdminSdk, ProductService } from '@your-org/shopify-admin-sdk';

const sdk = createShopifyAdminSdk({
  shopDomain: 'xxx.myshopify.com',
  accessToken: 'shpat_...',
  apiVersion: '2025-07',
});
```
**apps/admin-api-server/**

外部 API から Shopify を制御するための「中間 API サーバー」

主な役割：

Shopify OAuth（認証）

token_store.json にアクセストークンを保存

/products/... で商品作成・更新・削除

例：商品作成 API
```
POST /products/sync
{
  "shop": "xxx.myshopify.com",
  "sku": "ABC-001",
  "title": "テスト商品"
}
```
# 🛠 セットアップ手順（Step by Step）
## ① リポジトリを clone
```
git clone <this repo>
cd shopify-admin-app-with-sdk
```
## ② pnpm を準備（Node バージョン固定）
1. Node のバージョンを自動適用

このプロジェクトには .node-version があります：
```
corepack enable
corepack prepare pnpm@latest --activate
```
2. 依存をインストール
```
pnpm install
```
## ③ GraphQL SDK を生成
```
pnpm codegen
```

生成物：
```
packages/shopify-admin-sdk/src/generated/
  admin.sdk.ts
  admin.types.ts
```
## ④ SDK パッケージをビルド
```
pnpm --filter @your-org/shopify-admin-sdk build
```

成果物：
```
packages/shopify-admin-sdk/dist/
```
## ⑤ API サーバーの環境構築

apps/admin-api-server/.env を作成：
```
APP_URL=https://xxxx.ngrok.io             # 後で差し替え
SHOPIFY_API_KEY=xxxxx                     # ShopifyアプリのAPIキー
SHOPIFY_API_SECRET=xxxxx                 # Shopifyアプリのシークレット
PORT=3001
```
## ⑥ API サーバー起動
```
pnpm --filter admin-api-server dev
```

成功すると：
```
admin-api-server listening on port 3001
```

## ⑦ /health の動作確認
```
curl http://localhost:3001/health
```

期待値：
```
{"status":"ok"}
```
## ⑧ Public URL を用意（ngrokの場合）

別ターミナルで：
```
ngrok http 3001
```

表示される：
```
Forwarding https://abcd1234.ngrok.io -> http://localhost:3001
```

→ この URL を .env の APP_URL= に設定

## ⑨ Shopify アプリに Callback URL を登録

管理画面 →
Settings → Apps and sales channels → Develop apps → (アプリを選択) → App setup

App URL
https://abcd1234.ngrok.io/auth

Allowed redirection URL
https://abcd1234.ngrok.io/auth/callback

## ⑩ カスタムアプリをインストール（重要）

ブラウザでアクセス：

https://abcd1234.ngrok.io/auth?shop=tokyomtg.myshopify.com


→ Shopify のインストール画面が出る
→ 承認すると .token/token_store.json が生成

場所：

apps/admin-api-server/.token/token_store.json

## ⑪ 商品作成テスト（SDK 利用）
```
curl -X POST https://abcd1234.ngrok.io/products/sync \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "tokyomtg.myshopify.com",
    "sku": "SDK-TEST-001",
    "title": "SDK テスト商品"
  }'
```

結果例：
```
{
  "status": "ok",
  "shop": "tokyomtg.myshopify.com",
  "sku": "SDK-TEST-001",
  "createdProductId": "gid://shopify/Product/1234567890"
}
```

# 🗂 開発ワークフロー
Action	コマンド
```
依存を更新	pnpm install
SDK を生成	pnpm codegen
SDK ビルド	pnpm --filter @your-org/shopify-admin-sdk build
API サーバー起動（dev）	pnpm --filter admin-api-server dev
全体ビルド	pnpm -r build
```
🔐 セキュリティ注意点

.env や .token/ は 絶対にリポジトリにコミットしない

Shopify Admin Token は 無期限トークンなので特に危険

.gitignore で保護済み

🧹 ディレクトリごとの .gitignore
```
/.gitignore … 全体用
```
apps/admin-api-server/.gitignore … Token など機密を除外

packages/shopify-admin-sdk/.gitignore … dist/ と Codegen 生成物除外

→ すでにプロジェクトに含まれているため調整済み
