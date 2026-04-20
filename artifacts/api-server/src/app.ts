import express, { type Express } from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app: Express = express();

app.use(cors());

const FLASK_URL = "http://localhost:3000";

app.use(
  "/api",
  createProxyMiddleware({
    target: FLASK_URL,
    changeOrigin: true,
    pathRewrite: undefined,
    on: {
      error: (err, req, res: any) => {
        console.error("Proxy error:", (err as Error).message);
        res.status(502).json({ error: "Backend unavailable" });
      },
    },
  })
);

export default app;
