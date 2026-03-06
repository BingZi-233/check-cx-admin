import { NextResponse } from "next/server"

import { hasSupabaseAuthEnv, sanitizeRedirectPath } from "@/lib/admin/env"
import { isAllowedAdminEmail } from "@/lib/admin/server-env"
import { createClient } from "@/lib/supabase/server"

function redirectTo(path: string, origin: string) {
  return NextResponse.redirect(new URL(path, origin), 303)
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const formData = await request.formData()
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const next = sanitizeRedirectPath(String(formData.get("next") ?? "/dashboard"))

  if (!hasSupabaseAuthEnv()) {
    return redirectTo("/login?error=missing-env", url.origin)
  }

  if (!email || !password) {
    return redirectTo("/login?error=invalid-credentials", url.origin)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return redirectTo("/login?error=invalid-credentials", url.origin)
  }

  if (!isAllowedAdminEmail(data.user.email)) {
    await supabase.auth.signOut()
    return redirectTo("/login?error=forbidden", url.origin)
  }

  return redirectTo(next, url.origin)
}
