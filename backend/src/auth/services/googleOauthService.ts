import { createHash, randomBytes } from "node:crypto";
import { getAuthEnv } from "../lib/env";
import { signSession, type AppRole } from "../lib/session";
import { getUserRole } from "../database-services/userRoleDatabaseService";

export interface OauthStartPayload {
  authorizeUrl: string;
  oauthCookieValue: string;
}

interface TokenExchangeResponse {
  user?: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
}

interface OauthCookie {
  state: string;
  verifier: string;
  createdAt: number;
}

export interface CallbackResult {
  appBaseUrl: string;
  redirectPath: string;
  oauthCookieClear: boolean;
  sessionToken?: string;
  error?: string;
}

function toBase64Url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildOauthCookie(): OauthCookie {
  return {
    state: toBase64Url(randomBytes(20)),
    verifier: toBase64Url(randomBytes(32)),
    createdAt: Date.now(),
  };
}

function fullNameFromMetadata(user: TokenExchangeResponse["user"]): string {
  const fullName = user?.user_metadata?.full_name;
  const name = user?.user_metadata?.name;
  if (typeof fullName === "string" && fullName) return fullName;
  if (typeof name === "string" && name) return name;
  return user?.email?.split("@")[0] ?? "user";
}

export function buildGoogleStartPayload(): OauthStartPayload {
  const env = getAuthEnv();
  const oauth = buildOauthCookie();
  const challenge = toBase64Url(createHash("sha256").update(oauth.verifier).digest());
  const redirectTo = `${env.appBaseUrl}/api/auth/google/callback`;

  const authorizeUrl = new URL(`${env.supabaseUrl}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", redirectTo);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "s256");
  authorizeUrl.searchParams.set("state", oauth.state);
  authorizeUrl.searchParams.set("prompt", "select_account");
  authorizeUrl.searchParams.set("hd", env.allowedDomain);

  return {
    authorizeUrl: authorizeUrl.toString(),
    oauthCookieValue: JSON.stringify(oauth),
  };
}

export async function exchangeGoogleCallback(
  code: string,
  state: string,
  rawOauthCookie: string | undefined,
): Promise<CallbackResult> {
  const env = getAuthEnv();
  const invalid = (error: string): CallbackResult => ({
    appBaseUrl: env.appBaseUrl,
    redirectPath: "/",
    oauthCookieClear: true,
    error,
  });

  if (!code || !state) return invalid("Missing OAuth code/state");
  if (!rawOauthCookie) return invalid("Login session expired. Please retry.");

  let oauth: OauthCookie;
  try {
    oauth = JSON.parse(rawOauthCookie) as OauthCookie;
  } catch {
    return invalid("Invalid OAuth session");
  }

  if (oauth.state !== state || Date.now() - oauth.createdAt > 10 * 60 * 1000) {
    return invalid("Invalid or expired OAuth state");
  }

  try {
    const tokenResp = await fetch(`${env.supabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.supabaseAnonKey,
      },
      body: JSON.stringify({
        auth_code: code,
        code_verifier: oauth.verifier,
      }),
    });

    if (!tokenResp.ok) {
      throw new Error("Failed to exchange OAuth code with Supabase");
    }

    const tokenData = (await tokenResp.json()) as TokenExchangeResponse;
    const user = tokenData.user;
    if (!user?.id || !user?.email) {
      throw new Error("Supabase returned an invalid user session");
    }

    if (!user.email.endsWith(`@${env.allowedDomain}`)) {
      return invalid(`Only @${env.allowedDomain} accounts are allowed.`);
    }

    const role: AppRole = await getUserRole(env.supabaseUrl, env.supabaseServiceRoleKey, user.id);
    const sessionToken = await signSession(
      {
        sub: user.id,
        email: user.email,
        role,
        full_name: fullNameFromMetadata(user),
      },
      env.sessionSecret,
    );

    return {
      appBaseUrl: env.appBaseUrl,
      redirectPath: "/dashboard",
      oauthCookieClear: true,
      sessionToken,
    };
  } catch (error) {
    return invalid(error instanceof Error ? error.message : "Login failed");
  }
}
