// packages/shopify-admin-sdk/src/admin-api-sdk.ts
import { GraphQLClient } from "graphql-request";
import { getSdk } from "./generated/admin.sdk";

export type ShopifyAdminSdkConfig = {
  shopDomain: string; // "xxx.myshopify.com"
  accessToken: string; // Admin API access token
  apiVersion: string; // "2025-07" など
};

export type ShopifyAdminSdk = ReturnType<typeof getSdk>;

/**
 * Shopify Admin GraphQL SDK を作成するファクトリ
 */
export function createShopifyAdminSdk(
  config: ShopifyAdminSdkConfig
): ShopifyAdminSdk {
  const { shopDomain, accessToken, apiVersion } = config;

  const endpoint = `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`;

  const client = new GraphQLClient(endpoint, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  return getSdk(client);
}
