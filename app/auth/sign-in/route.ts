import { type Provider } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import {
  getRequestOrigin,
  hasSupabaseAuthEnv,
  isSupportedOAuthProvider,
  sanitizeRedirectPath,
} from "@/lib/admin/env"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = getRequestOrigin(request)
  const provider = url.searchParams.get("provider")?.trim().toLowerCase()
  const next = sanitizeRedirectPath(url.searchParams.get("next"))

  if (!hasSupabaseAuthEnv()) {
    return NextResponse.redirect(new URL("/login?error=missing-env", origin))
  }

  if (!isSupportedOAuthProvider(provider)) {
    return NextResponse.redirect(new URL("/login?error=provider", origin))
  }

  const redirectTo = new URL("/auth/callback", origin)
  redirectTo.searchParams.set("next", next)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: redirectTo.toString(),
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/login?error=oauth", origin))
  }

  return NextResponse.redirect(data.url)
}
