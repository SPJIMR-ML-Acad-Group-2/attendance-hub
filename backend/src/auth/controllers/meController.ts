import { parseCookies } from "../lib/cookies";
import { getSessionFromToken } from "../services/sessionService";
import type { HttpRequest, HttpResponse } from "../types/http";

export async function handleMe(req: HttpRequest, res: HttpResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  const session = await getSessionFromToken(cookies.spj_session);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.status(200).json(session);
}
