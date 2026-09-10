
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  if (!plain || typeof plain !== "string") {
    throw new TypeError("Password must be a non-empty string");
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

export async function comparePasswords(plain: string, hash: string): Promise<boolean> {
  if (!plain || typeof plain !== "string") return false;
  if (!hash || typeof hash !== "string") return false;
  return bcrypt.compare(plain, hash);
}

import crypto from "crypto";

function base64url(str: Buffer | string): string {
  const buf = typeof str === "string" ? Buffer.from(str) : str;
  return buf.toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function signJwtHS256(payload: object, secret: string, expiresInMinutes = 1440): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + (expiresInMinutes * 60)
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", secret)
    .update(signatureInput)
    .digest();

  const encodedSignature = base64url(signature);
  return `${signatureInput}.${encodedSignature}`;
}

export function getTargetBackendUrl(req?: { headers?: { get: (name: string) => string | null }; nextUrl?: { origin?: string; host?: string } }): string {
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL.replace(/\/+$/, "");
  }

  // 1. Detect if incoming request originated from or targets localhost
  const host = req?.headers?.get?.("host") || req?.nextUrl?.host || "";
  const forwardedHost = req?.headers?.get?.("x-forwarded-host") || "";
  const origin = req?.headers?.get?.("origin") || req?.nextUrl?.origin || "";
  const referer = req?.headers?.get?.("referer") || "";

  const isLocalRequest =
    host.includes("localhost") || host.includes("127.0.0.1") ||
    forwardedHost.includes("localhost") || forwardedHost.includes("127.0.0.1") ||
    origin.includes("localhost") || origin.includes("127.0.0.1") ||
    referer.includes("localhost") || referer.includes("127.0.0.1");

  if (isLocalRequest) {
    return "http://localhost:5000";
  }

  // 2. Client-side browser check
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000";
  }

  // 3. If running locally via dev server
  if (process.env.NODE_ENV === "development" || process.env.npm_lifecycle_event === "dev") {
    return "http://localhost:5000";
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (
    envUrl.includes("localhost") ||
    process.env.NEXTAUTH_URL?.includes("localhost")
  ) {
    return "http://localhost:5000";
  }
  if (!envUrl || envUrl.includes("undefined")) {
    return "http://localhost:5000";
  }
  return envUrl.replace(/\/+$/, "");
}

export function getPublicSiteOrigin(req?: { headers?: { get: (name: string) => string | null }; nextUrl?: { origin?: string } }): string {
  // If request headers indicate localhost, prioritize local port so callbacks & redirects return to local browser
  const forwardedHost = req?.headers?.get?.("x-forwarded-host");
  const forwardedProto = req?.headers?.get?.("x-forwarded-proto") || "http";
  if (forwardedHost) {
    const cleanHost = forwardedHost.split(",")[0].trim();
    if (cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1")) {
      return `http://${cleanHost}`;
    }
  }

  const host = req?.headers?.get?.("host") || "";
  if (host && (host.includes("localhost") || host.includes("127.0.0.1"))) {
    return `http://${host}`;
  }

  const rawOrigin = req?.nextUrl?.origin || "";
  if (
    rawOrigin.includes("localhost:3000") ||
    rawOrigin.includes("localhost:3001") ||
    rawOrigin.includes("localhost:3002") ||
    rawOrigin.includes("127.0.0.1:3000")
  ) {
    return rawOrigin;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/+$/, "");
  }

  if (forwardedHost) {
    const cleanHost = forwardedHost.split(",")[0].trim();
    return `${forwardedProto}://${cleanHost}`;
  }

  if (host) {
    const proto = req?.headers?.get?.("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }

  return "https://artiory.com";
}

export function createBackendToken(user: any): string {
  const userId = user?.id || user?._id || user?.userId || "user_" + Math.random().toString(36).slice(2);
  const email = user?.email || "";
  const name = user?.name || "";

  const secret = process.env.JWT_SECRET || "werfuh3482fnrf8932rf_prod_secure_key";
  return signJwtHS256({ id: userId, email, name }, secret, 1440);
}
