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
