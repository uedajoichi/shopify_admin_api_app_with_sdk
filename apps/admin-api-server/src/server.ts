// apps/admin-api-server/src/server.ts
import "dotenv/config";
import express from "express";
import authRouter from "./routes/auth";
import productsRouter from "./routes/products";

const app = express();
app.use(express.json());

// シンプルなヘルスチェック
app.get("/health", (_req, res) => {
  res.json({ status: "ok" , shop: process.env.SHOP_NAME  || null });
});

// /auth, /auth/callback
app.use("/auth", authRouter);

// /products/sync
app.use("/products", productsRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`admin-api-server listening on port ${port}`);
});
