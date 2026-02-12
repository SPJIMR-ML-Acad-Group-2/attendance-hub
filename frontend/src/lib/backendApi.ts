function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getBackendBaseUrl(): string {
  const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
  if (!envUrl) {
    throw new Error("Missing environment variable: VITE_BACKEND_URL");
  }
  return trimSlash(envUrl);
}

export function backendApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
}
