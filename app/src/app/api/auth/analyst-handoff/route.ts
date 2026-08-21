import { NextRequest, NextResponse } from "next/server";
import { signToken, verifySignedToken } from "@/lib/server/auth";

async function suppliedToken(request: NextRequest) {
  if (request.method === "GET") return request.nextUrl.searchParams.get("token") ?? undefined;
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? String((await request.json() as { token?: string }).token ?? "") : String((await request.formData()).get("token") ?? "");
}

async function complete(request: NextRequest) {
  const secret = process.env.ANALYST_SESSION_SECRET;
  const claims = verifySignedToken(await suppliedToken(request), secret, "dec-analyst-handoff");
  if (!secret || !claims?.email || !["analyst", "admin"].includes(claims.role ?? "")) return NextResponse.json({ error: "The DEC analyst handoff is invalid or expired." }, { status: 401, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  const allowlist = (process.env.APP_ADMIN_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (allowlist.length && !allowlist.includes(claims.email.toLowerCase())) return NextResponse.json({ error: "This identity is not authorized for the DEC analyst workspace." }, { status: 403 });
  const session = signToken({ aud: "dec-analyst", email: claims.email, role: claims.role }, secret, 8 * 60 * 60);
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set("dec_analyst_session", session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) { return complete(request); }
export async function POST(request: NextRequest) { return complete(request); }
