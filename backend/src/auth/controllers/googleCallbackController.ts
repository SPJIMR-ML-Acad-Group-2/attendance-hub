import { parseCookies, serializeCookie } from "../lib/cookies";
import { exchangeGoogleCallback } from "../services/googleOauthService";
import type { HttpRequest, HttpResponse } from "../types/http";

function redirectWithError(res: HttpResponse, appBaseUrl: string, message: string) {
  const url = new URL(appBaseUrl);
  url.searchParams.set("auth_error", message);
  res.statusCode = 302;
  res.setHeader("Location", url.toString());
  res.end();
}

function queryString(queryValue: string | string[] | undefined): string {
  if (typeof queryValue === "string") return queryValue;
  if (Array.isArray(queryValue) && queryValue[0]) return queryValue[0];
  return "";
}

export async function handleGoogleCallback(req: HttpRequest, res: HttpResponse) {
  const code = queryString(req.query?.code);
  const state = queryString(req.query?.state);
  const cookies = parseCookies(req.headers.cookie);

  const result = await exchangeGoogleCallback(code, state, cookies.spj_oauth);
  const isProd = process.env.NODE_ENV === "production";

  const cookieHeaders = [
    serializeCookie("spj_oauth", "", { maxAge: 0, secure: isProd }),
    ...(result.sessionToken
      ? [
          serializeCookie("spj_session", result.sessionToken, {
            maxAge: 60 * 60 * 24 * 7,
            secure: isProd,
          }),
        ]
      : []),
  ];
  res.setHeader("Set-Cookie", cookieHeaders);

  if (result.error) {
    redirectWithError(res, result.appBaseUrl, result.error);
    return;
  }

  res.statusCode = 302;
  res.setHeader("Location", `${result.appBaseUrl}${result.redirectPath}`);
  res.end();
}
