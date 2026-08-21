import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface SessionClaims {
  aud: string;
  exp: number;
  iat?: number;
  iss?: string;
  nbf?: number;
  role?: string;
  email?: string;
  tester_id?: string;
  display_name?: string;
  courses?: string[];
  [key: string]: Json | undefined;
}

const decode = (value: string) => Buffer.from(value, "base64url");
const encode = (value: string | Buffer) => Buffer.from(value).toString("base64url");

export function constantTimeTextEqual(actual: string, expected: string) {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifySignedToken(token: string | undefined, secret: string | undefined, audience: string): SessionClaims | null {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const [headerPart, payloadPart, signaturePart] = parts;
    const header = JSON.parse(decode(headerPart).toString("utf8")) as { alg?: string; typ?: string };
    if (header.alg !== "HS256" || (header.typ && header.typ !== "JWT")) return null;
    const expected = createHmac("sha256", secret).update(`${headerPart}.${payloadPart}`).digest();
    const signature = decode(signaturePart);
    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
    const claims = JSON.parse(decode(payloadPart).toString("utf8")) as SessionClaims;
    const now = Math.floor(Date.now() / 1000);
    if (claims.aud !== audience || !Number.isFinite(claims.exp) || claims.exp <= now) return null;
    if (typeof claims.nbf === "number" && claims.nbf > now + 30) return null;
    if (process.env.SESSION_ISSUER && claims.iss !== process.env.SESSION_ISSUER) return null;
    return claims;
  } catch {
    return null;
  }
}

export function signToken(claims: Omit<SessionClaims, "exp"> & { exp?: number }, secret: string, lifetimeSeconds = 8 * 60 * 60) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encode(JSON.stringify({ iat: now, exp: claims.exp ?? now + lifetimeSeconds, ...claims }));
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function bearerToken(request: NextRequest) {
  const value = request.headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7) : undefined;
}

export function analystClaims(request: NextRequest) {
  const token = request.cookies.get("dec_analyst_session")?.value ?? bearerToken(request);
  const claims = verifySignedToken(token, process.env.ANALYST_SESSION_SECRET, "dec-analyst");
  if (!claims || !["analyst", "admin"].includes(claims.role ?? "")) return null;
  const allowlist = (process.env.APP_ADMIN_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (allowlist.length && (!claims.email || !allowlist.includes(claims.email.toLowerCase()))) return null;
  return claims;
}

export function testerClaimsFromToken(token: string | undefined) {
  const claims = verifySignedToken(token, process.env.TESTER_SESSION_SECRET, "dec-tester");
  return claims?.tester_id ? claims : null;
}

export function testerClaims(request: NextRequest) {
  return testerClaimsFromToken(request.cookies.get("dec_tester_session")?.value);
}

export function authorizedInternal(request: NextRequest, allowCron = false) {
  if (allowCron) {
    const cronSecret = process.env.CRON_SECRET;
    const bearer = bearerToken(request);
    if (cronSecret && bearer && constantTimeTextEqual(bearer, cronSecret)) return true;
  }
  return Boolean(analystClaims(request));
}
