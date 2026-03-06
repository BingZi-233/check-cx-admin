import "server-only"

const DEFAULT_OAUTH_PROVIDERS = ["google", "github"] as const

function readEnv(name: string) {
  return process.env[name]?.trim() ?? ""
}

export function getAuthEnv() {
  const supabaseUrl = readEnv("SUPABASE_URL")
  const supabaseKey = readEnv("SUPABASE_PUBLISHABLE_OR_ANON_KEY")
  const oauthProvidersRaw = readEnv("SUPABASE_OAUTH_PROVIDERS")
  const oauthProviders = oauthProvidersRaw
    ? oauthProvidersRaw
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    : [...DEFAULT_OAUTH_PROVIDERS]

  return {
    supabaseUrl,
    supabaseKey,
    oauthProviders:
      oauthProviders.length > 0 ? oauthProviders : [...DEFAULT_OAUTH_PROVIDERS],
  }
}

export function getSupabaseAuthUrl() {
  return getAuthEnv().supabaseUrl
}

export function getSupabaseAuthKey() {
  return getAuthEnv().supabaseKey
}

export function hasSupabaseAuthEnv() {
  const env = getAuthEnv()
  return Boolean(env.supabaseUrl && env.supabaseKey)
}

export function getSupabaseAuthWarnings() {
  const warnings: string[] = []
  const env = getAuthEnv()

  if (!env.supabaseUrl) {
    warnings.push("缺少 SUPABASE_URL")
  }

  if (!env.supabaseKey) {
    warnings.push("缺少 SUPABASE_PUBLISHABLE_OR_ANON_KEY")
  }

  return warnings
}

export function getOAuthProviders() {
  return getAuthEnv().oauthProviders
}

export function isSupportedOAuthProvider(provider?: string | null) {
  if (!provider) {
    return false
  }

  return getOAuthProviders().includes(provider.trim().toLowerCase())
}

export function sanitizeRedirectPath(path?: string | null) {
  if (!path || !path.startsWith("/")) {
    return "/dashboard"
  }

  return path
}
