import { serializeCookie } from "../lib/cookies";
import type { HttpRequest, HttpResponse } from "../types/http";

export async function handleLogout(req: HttpRequest, res: HttpResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const isProd = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", [
    serializeCookie("spj_session", "", { maxAge: 0, secure: isProd }),
    serializeCookie("spj_oauth", "", { maxAge: 0, secure: isProd }),
  ]);
  res.status(200).json({ ok: true });
}
