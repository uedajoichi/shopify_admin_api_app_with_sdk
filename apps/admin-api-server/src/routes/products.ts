// apps/admin-api-server/src/routes/products.ts
import type { Request, Response } from "express";
import { Router } from "express";
import { tokenStore } from "../infra/tokenStore";
import {
  createShopifyAdminSdk,
  ProductService,
  type ProductCreateInput,
} from "@your-org/shopify-admin-sdk";

const router = Router();

// POST /products/sync
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

    const sdk = createShopifyAdminSdk({
      shopDomain: shop,
      accessToken: record.accessToken,
      apiVersion: "2025-07",
    });
    const productService = new ProductService(sdk);

    const input: ProductCreateInput = {
      title,
      status: "ACTIVE",
      variants: [
        {
          sku,
          price: "1000",
        },
      ],
    };

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

export default router;
