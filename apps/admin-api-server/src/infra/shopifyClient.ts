import { tokenStore } from "./tokenStore";
import { createShopifyAdminSdk, ShopifyAdminSdkConfig } from "@your-org/shopify-admin-sdk"; // ← packages/shopify-admin-sdk の index.ts で export 済みを想定

const API_VERSION = "2024-07" as const; // codegen と合わせる

export async function getShopifyAdminClient(shop: string) {
  const record = await tokenStore.getShopToken(shop);
  if (!record) {
    throw new Error(`No token stored for shop: ${shop}`);
  }

  const config: ShopifyAdminSdkConfig = {
    shopDomain: shop,
    accessToken: record.accessToken,
    apiVersion: API_VERSION,
  };

  return createShopifyAdminSdk(config);
}
