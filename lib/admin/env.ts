const DEFAULT_OAUTH_PROVIDERS = ["google", "github"]

export function getPublicSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ""
}

export function getPublicSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    ""
  )
}

export function hasPublicSupabaseEnv() {
  return Boolean(getPublicSupabaseUrl() && getPublicSupabaseKey())
}

export function getPublicEnvWarnings() {
  const warnings: string[] = []

  if (!getPublicSupabaseUrl()) {
    warnings.push("缺少 NEXT_PUBLIC_SUPABASE_URL")
  }

  if (!getPublicSupabaseKey()) {
    warnings.push(
      "缺少 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY（或 NEXT_PUBLIC_SUPABASE_ANON_KEY）"
    )
  }

  return warnings
}

export function getOAuthProviders() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_OAUTH_PROVIDERS?.trim()

  if (!raw) {
    return DEFAULT_OAUTH_PROVIDERS
  }

  const providers = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return providers.length > 0 ? providers : DEFAULT_OAUTH_PROVIDERS
}

export function sanitizeRedirectPath(path?: string | null) {
  if (!path || !path.startsWith("/")) {
    return "/dashboard"
  }

  return path
}
