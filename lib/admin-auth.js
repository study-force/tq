import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = process.env.ADMIN_SESSION_SECRET || "default-secret-change-me";
const COOKIE_NAME = "admin_session";
const MAX_AGE = 60 * 60 * 24; // 24h

function sign(timestamp) {
  return crypto.createHmac("sha256", SECRET).update(timestamp).digest("hex");
}

export function createSession() {
  const ts = String(Date.now());
  const token = `${ts}.${sign(ts)}`;
  return { token, maxAge: MAX_AGE };
}

export function verifySession(token) {
  if (!token) return false;
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;
  if (sign(ts) !== sig) return false;
  const age = Date.now() - Number(ts);
  return age < MAX_AGE * 1000;
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const c = cookieStore.get(COOKIE_NAME);
  return c ? c.value : null;
}

export async function isAdminAuthenticated() {
  const token = await getSessionFromCookies();
  return verifySession(token);
}

export { COOKIE_NAME, MAX_AGE };
