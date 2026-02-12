import { createClient } from "@supabase/supabase-js";
import type { AppRole } from "../lib/session";

export async function getUserRole(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
): Promise<AppRole> {
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: roleData } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  const role = roleData?.role;
  if (role === "developer" || role === "program_office" || role === "student") {
    return role;
  }
  return "user";
}
