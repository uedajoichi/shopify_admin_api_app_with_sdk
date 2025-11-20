import "dotenv/config";
import {
  createShopifyAdminSdk,
  ProductService,
  type ProductCreateInput,
} from "@your-org/shopify-admin-sdk";

async function main() {
  const sdk = createShopifyAdminSdk({
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!, // "xxx.myshopify.com"
    accessToken: process.env.SHOPIFY_ADMIN_TOKEN!, // Admin API トークン
    apiVersion: "2025-07",
  });

  const productService = new ProductService(sdk);

  const input: ProductCreateInput = {
    title: "SDK Test Product",
    status: "ACTIVE",
    variants: [
      {
        price: "1000",
        sku: "SDK-TEST-001",
      },
    ],
  };

  const product = await productService.createProduct(input);
  console.log("Created product:", product?.id, product?.title);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
