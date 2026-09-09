
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

export function getTargetBackendUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "";
  if (!envUrl || envUrl.includes("undefined")) {
    return "https://api.artiory.com";
  }
  return envUrl.replace(/\/+$/, "");
}

export function getPublicSiteOrigin(req?: { headers?: { get: (name: string) => string | null }; nextUrl?: { origin?: string } }): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/+$/, "");
  }

  const forwardedHost = req?.headers?.get?.("x-forwarded-host");
  const forwardedProto = req?.headers?.get?.("x-forwarded-proto") || "https";
  if (forwardedHost) {
    const cleanHost = forwardedHost.split(",")[0].trim();
    if (!cleanHost.includes("localhost") && !cleanHost.includes("127.0.0.1")) {
      return `${forwardedProto}://${cleanHost}`;
    }
  }

  const host = req?.headers?.get?.("host") || "";
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const proto = req?.headers?.get?.("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }

  const rawOrigin = req?.nextUrl?.origin || "";
  // Port 3011 is strictly the internal production port behind Nginx reverse proxy
  if (rawOrigin.includes("3011") || process.env.NODE_ENV === "production") {
    return "https://artiory.com";
  }

  if (
    rawOrigin.includes("localhost:3000") ||
    rawOrigin.includes("localhost:3001") ||
    rawOrigin.includes("localhost:3002") ||
    rawOrigin.includes("127.0.0.1:3000")
  ) {
    return rawOrigin;
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
