import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import path from "path";
import fs from "fs";

(globalThis as any).__APP_READY__ = false;

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err?.message ?? err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

export function log(message: string, source = "express") {
  const t = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${t} [${source}] ${message}`);
}

let indexHtml: string | null = null;
let distPath: string | null = null;
try {
  distPath = path.resolve(__dirname, "public");
  indexHtml = fs.readFileSync(path.resolve(distPath, "index.html"), "utf8");
} catch {
}

const app = express();
const httpServer = (globalThis as any).__preloadServer ?? createServer(app);

declare module "http" {
  interface IncomingMessage { rawBody: unknown; }
}

app.set("trust proxy", 1);

app.get("/", (_req, res) => { res.status(200).send("OK"); });
app.get("/health", (_req, res) => { res.status(200).send("OK"); });
app.get("/healthz", (_req, res) => { res.status(200).send("OK"); });

app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJson: Record<string, unknown> | undefined;
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    capturedJson = body as Record<string, unknown>;
    return originalJson(body);
  };
  res.on("finish", () => {
    if (reqPath.startsWith("/api")) {
      let line = `${req.method} ${reqPath} ${res.statusCode} in ${Date.now() - start}ms`;
      if (capturedJson) line += ` :: ${JSON.stringify(capturedJson)}`;
      log(line);
    }
  });
  next();
});

const port = parseInt(process.env.PORT || "5000", 10);
if (!(globalThis as any).__preloadServer) {
  httpServer.listen(port, "0.0.0.0", () => {
    log(`listening on port ${port}`);
  });
}

(async () => {
  try {
    await registerRoutes(httpServer, app);
  } catch (err) {
    console.error("[startup] registerRoutes failed:", err);
    process.exit(1);
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    if (res.headersSent) return next(err);
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });

  if (!indexHtml) {
    try {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    } catch (err) {
      console.error("[startup] Vite setup failed:", err);
      process.exit(1);
    }
  } else if (distPath) {
    app.use(express.static(distPath, { index: false, maxAge: "1y", immutable: true }));
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.status(200).end(indexHtml);
    });
  }

  (globalThis as any).__APP_READY__ = true;

  if ((globalThis as any).__preloadServer) {
    (globalThis as any).__expressApp = app;
    log(`app ready, attached to preloaded server on port ${port}`);
  } else {
    log(`app fully initialized`);
  }
})().catch((err) => {
  console.error("[startup] Fatal error:", err);
  process.exit(1);
});
