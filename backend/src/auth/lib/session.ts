import { SignJWT, jwtVerify } from "jose";

export type AppRole = "developer" | "program_office" | "user" | "student";

export interface SessionPayload {
  sub: string;
  email: string;
  role: AppRole;
  full_name?: string;
}

const SESSION_ISSUER = "attendance-hub-api";
const SESSION_AUDIENCE = "attendance-hub-web";

function getSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    full_name: payload.full_name ?? "",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret(secret));
}

export async function verifySession(token: string, secret: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecret(secret), {
    issuer: SESSION_ISSUER,
    audience: SESSION_AUDIENCE,
  });

  const role = payload.role;
  if (
    role !== "developer" &&
    role !== "program_office" &&
    role !== "student" &&
    role !== "user"
  ) {
    throw new Error("Invalid role in session");
  }

  return {
    sub: String(payload.sub),
    email: String(payload.email),
    role,
    full_name: payload.full_name ? String(payload.full_name) : undefined,
  };
}
