import { NextRequest, NextResponse } from "next/server";
import { signToken, verifySignedToken } from "@/lib/server/auth";

function completeHandoff(request: NextRequest, token: string | undefined) {
  const secret = process.env.TESTER_SESSION_SECRET;
  const handoff = verifySignedToken(token, secret, "dec-tester-handoff");
  if (!secret || !handoff?.tester_id) return NextResponse.json({ error: "The tester handoff is invalid or expired." }, { status: 401, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  const session = signToken({ aud: "dec-tester", tester_id: handoff.tester_id, display_name: handoff.display_name, courses: handoff.courses }, secret, 8 * 60 * 60);
  const response = NextResponse.redirect(new URL("/my-findings", request.url), 303);
  response.cookies.set("dec_tester_session", session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  return completeHandoff(request, request.nextUrl.searchParams.get("token") ?? undefined);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  const token = contentType.includes("application/json") ? String((await request.json() as { token?: string }).token ?? "") : String((await request.formData()).get("token") ?? "");
  return completeHandoff(request, token);
}
