import "server-only"

const DEFAULT_OAUTH_PROVIDERS = ["google", "github"] as const

function readEnv(name: string) {
  return process.env[name]?.trim() ?? ""
}

function readHeader(headers: Headers, name: string) {
  return headers.get(name)?.split(",")[0]?.trim() ?? ""
}

function normalizeOrigin(value: string) {
  if (!value) {
    return ""
  }

  try {
    return new URL(value).origin
  } catch {
    return ""
  }
}

export function getAuthEnv() {
  const supabaseUrl = readEnv("SUPABASE_URL")
  const supabaseKey = readEnv("SUPABASE_PUBLISHABLE_OR_ANON_KEY")
  const appUrl = normalizeOrigin(readEnv("APP_URL") || readEnv("SITE_URL"))
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
    appUrl,
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

export function getAppUrl() {
  return getAuthEnv().appUrl
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

export function getRequestOrigin(request: Request) {
  const appUrl = getAppUrl()

  if (appUrl) {
    return appUrl
  }

  const requestUrl = new URL(request.url)
  const forwardedProto = readHeader(request.headers, "x-forwarded-proto")
  const forwardedHost = readHeader(request.headers, "x-forwarded-host")
  const host = forwardedHost || readHeader(request.headers, "host") || requestUrl.host
  const protocol = forwardedProto || requestUrl.protocol.replace(":", "")

  return `${protocol}://${host}`
}

export function sanitizeRedirectPath(path?: string | null) {
  if (!path || !path.startsWith("/")) {
    return "/dashboard"
  }

  return path
}
