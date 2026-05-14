import { NextResponse } from "next/server";
import { createSession, verifySession, COOKIE_NAME, MAX_AGE } from "../../../../lib/admin-auth";

export async function POST(request) {
  try {
    const { password } = await request.json();
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다" }, { status: 401 });
    }
    const { token, maxAge } = createSession();
    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });
    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}

export async function GET(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = verifySession(token);
  return NextResponse.json({ authenticated: valid });
}
