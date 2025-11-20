// apps/admin-api-server/src/infra/tokenStore.ts
import { promises as fs } from "fs";
import path from "path";

const TOKEN_DIR = path.join(__dirname, "..", "..", ".token");
const TOKEN_FILE = path.join(TOKEN_DIR, "token_store.json");

export type ShopId = string; // "xxx.myshopify.com"

export type ShopTokenRecord = {
  accessToken: string;
  scope?: string;
  installedAt: string;
};

type TokenStoreFile = {
  shops: Record<ShopId, ShopTokenRecord>;
};

async function ensureDir() {
  await fs.mkdir(TOKEN_DIR, { recursive: true });
}

async function readFile(): Promise<TokenStoreFile> {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf8");
    return JSON.parse(data) as TokenStoreFile;
  } catch {
    // ファイルが無い or 壊れている場合は初期状態にする
    return { shops: {} };
  }
}

async function writeFile(store: TokenStoreFile): Promise<void> {
  await ensureDir();
  await fs.writeFile(TOKEN_FILE, JSON.stringify(store, null, 2), "utf8");
}

export const tokenStore = {
  async getShopToken(shop: ShopId): Promise<ShopTokenRecord | null> {
    const store = await readFile();
    return store.shops[shop] ?? null;
  },

  async setShopToken(shop: ShopId, record: ShopTokenRecord): Promise<void> {
    const store = await readFile();
    store.shops[shop] = record;
    await writeFile(store);
  },
};
