// apps/admin-api-server/src/routes/auth.ts
import type { Request, Response } from "express";
import { Router } from "express";
import { tokenStore } from "../infra/tokenStore";

const router = Router();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const APP_URL = process.env.APP_URL!; // 例: https://preferred-....trycloudflare.com

const SCOPES = [
  "read_products",
  "write_products",
  "read_inventory",
  "write_inventory",
].join(",");

// ★テスト用: /auth/test-save
router.get("/test-save", async (_req: Request, res: Response) => {
  try {
    console.log("[auth/test-save] called");
    await tokenStore.setShopToken("test-shop.myshopify.com", {
      accessToken: "dummy-token",
      scope: "read_products,write_products",
      installedAt: new Date().toISOString(),
    });
    res.send("test-save OK. token_store.json を確認して下さい。");
  } catch (e) {
    console.error("[auth/test-save] error:", e);
    res.status(500).send("test-save ERROR");
  }
});

// GET /auth?shop=xxx.myshopify.com
router.get("/", (req: Request, res: Response) => {
  const shop = req.query.shop as string;
  console.log("[auth/] called, shop=", shop);

  if (!shop) {
    return res.status(400).send('Missing "shop" query parameter');
  }

  const redirectUri = `${APP_URL}/auth/callback`;
  const state = "dummy-state"; // TODO: 本番はランダムにしてセッション保存

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${encodeURIComponent(SHOPIFY_API_KEY)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;

  console.log("[auth/] redirect to:", installUrl);
  res.redirect(installUrl);
});

// GET /auth/callback
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as string | undefined;
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;

    console.log(
      "[auth/callback] called, shop=",
      shop,
      "code=",
      !!code,
      "state=",
      state
    );

    if (!shop || !code) {
      console.error("[auth/callback] missing shop or code");
      return res.status(400).send('Missing "shop" or "code"');
    }

    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    console.log("[auth/callback] fetch token from:", tokenUrl);

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }),
    } as any);

    console.log("[auth/callback] tokenRes status=", tokenRes.status);

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("[auth/callback] Failed to fetch access token:", text);
      return res
        .status(500)
        .send("Failed to fetch access token: " + text.substring(0, 200));
    }

    const json: any = await tokenRes.json();
    console.log("[auth/callback] tokenRes json=", json);

    const accessToken: string = json.access_token;
    const scope: string | undefined = json.scope;

    if (!accessToken) {
      console.error("[auth/callback] no access_token in response");
      return res.status(500).send("No access_token in response");
    }

    await tokenStore.setShopToken(shop, {
      accessToken,
      scope,
      installedAt: new Date().toISOString(),
    });

    console.log("[auth/callback] token saved for shop=", shop);

    res.send(
      `App installed for ${shop}. token_store.json に保存しました。このタブは閉じてOKです。`
    );
  } catch (e: any) {
    console.error("[auth/callback] error:", e);
    res.status(500).send("Internal Server Error: " + (e?.message ?? "unknown"));
  }
});

export default router;
