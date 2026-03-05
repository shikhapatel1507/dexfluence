import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import type { Express, Request, Response, NextFunction } from "express";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

const PROMO_CODES: Record<string, { discount: number; label: string; type: "percent" | "fixed" }> = {
  LAUNCH50: { discount: 50, label: "Launch Special", type: "percent" },
  REEL20: { discount: 20, label: "Reel Creator Discount", type: "percent" },
  DEXFLUENCE: { discount: 30, label: "Dexfluence Welcome", type: "percent" },
  FIRSTMONTH: { discount: 100, label: "First Month Free", type: "fixed" },
  SCALE100: { discount: 100, label: "$100 Off Scale Plan", type: "fixed" },
  SHIKHA: { discount: 100, label: "Shikha — 100% Off", type: "percent" },
};

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `h_${Math.abs(hash)}_${password.length}`;
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";

  let sessionStore: InstanceType<typeof PgSession> | undefined;
  if (process.env.DATABASE_URL) {
    try {
      sessionStore = new PgSession({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
        ttl: 30 * 24 * 60 * 60,
      });
      sessionStore.on("error", (err: Error) => {
        console.error("[session-store] pg pool error (non-fatal):", err?.message ?? err);
      });
    } catch (err) {
      console.error("[session-store] Failed to create pg session store (falling back to memory):", err);
      sessionStore = undefined;
    }
  }

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "dexfluence-secret-key-2026",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "Invalid email or password" });
        if (!verifyPassword(password, user.password)) return done(null, false, { message: "Invalid email or password" });
        return done(null, user);
      } catch (e) {
        return done(e);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user ?? false);
    } catch (e) {
      done(e);
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, brandName } = req.body;
      if (!username || !password) return res.status(400).json({ error: "Email and password are required" });
      if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(409).json({ error: "An account with this email already exists" });

      const user = await storage.createUser({
        username,
        password: hashPassword(password),
      });

      await storage.updateBrandSettings({ brandName: brandName || username.split("@")[0] });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed after registration" });
        res.status(201).json({ id: user.id, username: user.username });
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ id: user.id, username: user.username });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    const user = req.user as any;
    res.json({ id: user.id, username: user.username });
  });

  app.post("/api/auth/promo", (req: Request, res: Response) => {
    const { code, planPrice } = req.body;
    const promo = PROMO_CODES[String(code).toUpperCase().trim()];
    if (!promo) return res.status(404).json({ error: "Invalid promo code" });

    const price = Number(planPrice) || 0;
    let discountAmount = 0;
    if (promo.type === "percent") {
      discountAmount = Math.round((price * promo.discount) / 100);
    } else {
      discountAmount = Math.min(promo.discount, price);
    }
    const finalPrice = Math.max(0, price - discountAmount);

    res.json({
      valid: true,
      code: code.toUpperCase().trim(),
      label: promo.label,
      discount: promo.discount,
      type: promo.type,
      discountAmount,
      finalPrice,
    });
  });
}
