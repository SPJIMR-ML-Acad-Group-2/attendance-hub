import { serializeCookie } from "../lib/cookies";
import { buildGoogleStartPayload } from "../services/googleOauthService";
import type { HttpRequest, HttpResponse } from "../types/http";

export async function handleGoogleStart(_req: HttpRequest, res: HttpResponse) {
  try {
    const payload = buildGoogleStartPayload();
    const isProd = process.env.NODE_ENV === "production";

    res.setHeader(
      "Set-Cookie",
      serializeCookie("spj_oauth", payload.oauthCookieValue, {
        maxAge: 60 * 10,
        secure: isProd,
      }),
    );
    res.statusCode = 302;
    res.setHeader("Location", payload.authorizeUrl);
    res.end();
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to initiate login",
    });
  }
}
