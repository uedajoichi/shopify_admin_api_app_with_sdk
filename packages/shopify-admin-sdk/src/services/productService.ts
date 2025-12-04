// packages/shopify-admin-sdk/src/services/productService.ts
import type { ShopifyAdminSdk } from "../admin-api-sdk";
import type {
  ProductCreateInput,
  ProductUpdateInput,
  CreateMediaInput,
} from "../generated/admin.types";

export class ProductService {
  constructor(private readonly sdk: ShopifyAdminSdk) {}

  /**
   * 商品の新規作成
   */
  async createProduct(
    input: ProductCreateInput,
    media?: CreateMediaInput | readonly CreateMediaInput[]
  ) {
    const res = await this.sdk.ProductCreate({
      product: input,
      // undefined のときは null にして渡す
      media: media ?? null,
    });

    const errors = res.productCreate?.userErrors;
    if (errors && errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    return res.productCreate?.product;
  }

  /**
   * 商品の更新
   */
  async updateProduct(input: ProductUpdateInput) {
    const res = await this.sdk.ProductUpdateBasic({
      product: input,
    });

    const errors = res.productUpdate?.userErrors;
    if (errors && errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    return res.productUpdate?.product;
  }
}

/**
 * 単一バリアントの商品を作成して、
 * - タイトル
 * - バリアントの price / sku
 * - 在庫数量
 * までまとめて設定するヘルパー。
 *
 * @param sdk  graphql-codegen で生成された Sdk（createShopifyAdminSdk から取得したもの）
 * @param params.title   商品タイトル
 * @param params.price   価格（例: "1234"）
 * @param params.sku     SKU（例: "SDK-TEST-001"）
 * @param params.quantity 初期在庫数（0 のときは在庫更新をスキップ）
 * @param params.locationId 在庫を持たせる Location の GID
 * @param params.currencyCode 通貨コード（省略時 "JPY"）
 */
export async function createProductWithVariantAndInventory(
  sdk: ShopifyAdminSdk,
  params: {
    title: string;
    price: string;
    sku: string;
    quantity: number;
    locationId: string;
    currencyCode?: string;
  }
) {
  const {
    title,
    price,
    sku,
    quantity,
    locationId,
    currencyCode = "JPY",
  } = params;

  // --- Step 1: productCreate で商品＋デフォルトバリアント作成 ---
  const createRes = await sdk.ProductCreate({
    product: {
      title,
      // status: "ACTIVE",
      // ProductCreateInput には variants が無いので入れない
    } as any,
    media: [],
  });

  const createErrors = createRes.productCreate?.userErrors ?? [];
  if (createErrors.length > 0) {
    return {
      ok: false as const,
      step: "productCreate",
      userErrors: createErrors,
      raw: createRes,
    };
  }

  const product = createRes.productCreate?.product;
  const productId = product?.id ?? null;
  const variantNode = product?.variants?.nodes?.[0];

  if (!productId || !variantNode) {
    return {
      ok: false as const,
      step: "productCreate",
      message: "productId or default variant not found",
      raw: createRes,
    };
  }

  const variantId = variantNode.id;
  const inventoryItemId = variantNode.inventoryItem?.id ?? null;

  // --- Step 2: productVariantsBulkUpdate で price / sku を設定 ---
  const bulkRes = await sdk.ProductVariantPricingUpdate({
    productId,
    variants: [
      {
        id: variantId,
        price: {
          amount: price,
          currencyCode,
        },
        sku,
      },
    ],
  } as any);

  const bulkErrors = bulkRes.productVariantsBulkUpdate?.userErrors ?? [];
  if (bulkErrors.length > 0) {
    return {
      ok: false as const,
      step: "productVariantsBulkUpdate",
      userErrors: bulkErrors,
      productId,
      variantId,
      raw: bulkRes,
    };
  }

  // --- Step 3: inventoryAdjustQuantities で在庫を設定 ---
  // 今は「初期在庫が 0 → quantity に増える」想定で delta=quantity としている。
  // 既存在庫からの差分を扱いたい場合は、別途 現在在庫を取得して差分計算する。
  if (inventoryItemId && quantity !== 0) {
    const invRes = await sdk.InventoryAdjustAvailable({
      input: {
        reason: "correction",
        name: "available",
        referenceDocumentUri: "app://sdk/product-create",
        changes: [
          {
            delta: quantity,
            inventoryItemId,
            locationId,
          },
        ],
      },
    } as any);

    const invErrors = invRes.inventoryAdjustQuantities?.userErrors ?? [];
    if (invErrors.length > 0) {
      return {
        ok: false as const,
        step: "inventoryAdjustQuantities",
        userErrors: invErrors,
        productId,
        variantId,
        inventoryItemId,
        raw: invRes,
      };
    }

    return {
      ok: true as const,
      step: "done",
      productId,
      variantId,
      inventoryItemId,
      productCreate: createRes.productCreate,
      productVariantsBulkUpdate: bulkRes.productVariantsBulkUpdate,
      inventoryAdjustQuantities: invRes.inventoryAdjustQuantities,
    };
  }

  // 在庫更新スキップ（quantity=0 or inventoryItemId 無し）
  return {
    ok: true as const,
    step: "done_without_inventory_adjust",
    productId,
    variantId,
    inventoryItemId,
    productCreate: createRes.productCreate,
    productVariantsBulkUpdate: bulkRes.productVariantsBulkUpdate,
  };
}
