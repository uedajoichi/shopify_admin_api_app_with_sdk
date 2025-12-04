// apps/admin-api-server/src/routes/products.ts
import type { Request, Response } from "express";
import { Router } from "express";
import { tokenStore } from "../infra/tokenStore";
import {
  createShopifyAdminSdk,
  ProductService,
  createProductWithVariantAndInventory,
  type ProductCreateInput,
} from "@your-org/shopify-admin-sdk";

const router = Router();

// 環境変数からロケーションIDを取得 (例: gid://shopify/Location/1234567890)
const DEFAULT_LOCATION_ID = process.env.DEFAULT_LOCATION_ID;

/**
 * Admin GraphQL クライアント生成ヘルパ
 * → 既にある createShopifyAdminSdk を薄くラップするだけ
 */
function createShopAdminSdk(shop: string, accessToken: string) {
  return createShopifyAdminSdk({
    shopDomain: shop,
    accessToken,
    apiVersion: "2024-07", // ★ codegen と揃える（2025-10/2025-07 は存在しない）
  });
}

/**
 * 既存: /products/sync（variants 周りは後で直す前提でいったん残す）
 */
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const { shop, sku, title } = req.body as {
      shop?: string;
      sku?: string;
      title?: string;
    };

    if (!shop || !sku || !title) {
      return res
        .status(400)
        .json({ error: "shop, sku, title are required in body" });
    }

    const record = await tokenStore.getShopToken(shop);
    if (!record) {
      return res
        .status(400)
        .json({ error: `token not found for shop=${shop}` });
    }

    const sdk = createShopAdminSdk(shop, record.accessToken);
    const productService = new ProductService(sdk);

    // ★ ProductCreateInput の定義に合わせて、variants は一旦外しておくと安全
    const input: ProductCreateInput = {
      title,
      // status: "ACTIVE",
      // variants: [...] ← ここは後で ProductVariantsBulkUpdate 側に移す
    } as any;

    const product = await productService.createProduct(input);

    res.json({
      status: "ok",
      shop,
      sku,
      createdProductId: product?.id,
      createdProductTitle: product?.title,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message ?? "Internal Server Error" });
  }
});

/**
 * 新規: バリアントの price / sku / 在庫まで設定するルート
 */
router.post("/create-with-variant", async (req: Request, res: Response) => {
  try {
    const { shop, title, price, sku, quantity } = req.body as {
      shop?: string;
      title?: string;
      price?: string;
      sku?: string;
      quantity?: number;
    };

    if (!shop || !title || !price || !sku) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["shop", "title", "price", "sku", "quantity"],
      });
    }

    if (!DEFAULT_LOCATION_ID) {
      return res.status(500).json({
        error: "DEFAULT_LOCATION_ID is not set in environment variables",
      });
    }

    // トークン取得
    const tokenData = await tokenStore.getShopToken(shop);
    if (!tokenData) {
      return res.status(400).json({
        error: "No token stored for this shop. Install app first.",
      });
    }

    const accessToken = tokenData.accessToken;
    const sdk = createShopAdminSdk(shop, accessToken);

    // SDKサービスを使って、商品 + バリアント + 在庫まで設定
    const result = await createProductWithVariantAndInventory(sdk, {
      title,
      price,
      sku,
      quantity: typeof quantity === "number" ? quantity : 0,
      locationId: DEFAULT_LOCATION_ID,
    });

    if (!result.ok) {
      return res.status(500).json({
        error: "Failed to create product with variant",
        step: result.step,
        details: result,
      });
    }

    res.json({
      ok: true,
      shop,
      productId: result.productId,
      variantId: result.variantId,
      inventoryItemId: result.inventoryItemId,
      step: result.step,
    });
  } catch (e: any) {
    console.error("[POST /products/create-with-variant] error:", e);
    res.status(500).json({
      error: "Internal Server Error",
      message: e?.message ?? "unknown",
    });
  }
});

export default router;
