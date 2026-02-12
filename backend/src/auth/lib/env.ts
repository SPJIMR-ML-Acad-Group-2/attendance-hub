export interface AuthEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  appBaseUrl: string;
  sessionSecret: string;
  allowedDomain: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getAuthEnv(): AuthEnv {
  return {
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    appBaseUrl: requireEnv("APP_BASE_URL"),
    sessionSecret: requireEnv("AUTH_COOKIE_SECRET"),
    allowedDomain: requireEnv("ALLOWED_EMAIL_DOMAIN"),
  };
}
