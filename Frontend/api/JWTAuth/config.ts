// Centralized API URL configuration.
// Supports env values ending with "/api" (e.g. NEXT_PUBLIC_API_URL=https://domain/api)
// without generating duplicated segments like "/api/api/...".

const DEFAULT_API_URL = "http://localhost:8080";

function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveRawBaseUrl(): string {
  const candidate =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_API_URL;

  return trimTrailingSlashes(candidate);
}

function splitApiPrefix(url: string): { baseUrl: string; apiPrefix: "" | "/api" } {
  if (url.toLowerCase().endsWith("/api")) {
    return {
      baseUrl: url.slice(0, -4),
      apiPrefix: "/api",
    };
  }

  return {
    baseUrl: url,
    apiPrefix: "",
  };
}

function normalizeEndpoint(endpoint: string): string {
  if (!endpoint) return "/";

  const withLeadingSlash = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return withLeadingSlash;
}

const resolved = splitApiPrefix(resolveRawBaseUrl());

export const API_CONFIG = {
  BASE_URL: resolved.baseUrl || DEFAULT_API_URL,
  API_PREFIX: resolved.apiPrefix,
} as const;

// Helper to build API URLs while avoiding duplicated /api prefixes.
export function buildApiUrl(endpoint: string): string {
  const normalizedEndpoint = normalizeEndpoint(endpoint);

  if (
    API_CONFIG.API_PREFIX === "/api" &&
    (normalizedEndpoint === "/api" || normalizedEndpoint.startsWith("/api/"))
  ) {
    const endpointWithoutApi = normalizedEndpoint.slice(4) || "/";
    return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${endpointWithoutApi}`;
  }

  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${normalizedEndpoint}`;
}

// Helper to build payment receipt file URLs.
export function buildFileUrl(fileId: number | null | undefined): string | null {
  if (!fileId) return null;
  return buildApiUrl(`/api/payments/files/${fileId}`);
}
