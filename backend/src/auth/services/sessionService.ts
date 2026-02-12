import { getAuthEnv } from "../lib/env";
import { verifySession } from "../lib/session";

export async function getSessionFromToken(token: string | undefined) {
  if (!token) return null;
  const env = getAuthEnv();
  try {
    const payload = await verifySession(token, env.sessionSecret);
    return {
      user: {
        id: payload.sub,
        email: payload.email,
        user_metadata: {
          full_name: payload.full_name ?? "",
          name: payload.full_name ?? "",
        },
      },
      role: payload.role,
    };
  } catch {
    return null;
  }
}
