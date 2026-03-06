import { NextResponse } from "next/server"

import { getRequestOrigin, sanitizeRedirectPath } from "@/lib/admin/env"
import { isAllowedAdminEmail } from "@/lib/admin/server-env"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = getRequestOrigin(request)
  const code = url.searchParams.get("code")
  const next = sanitizeRedirectPath(url.searchParams.get("next"))

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", origin))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth", origin))
  }

  if (!isAllowedAdminEmail(data.user?.email)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL("/login?error=forbidden", origin))
  }

  return NextResponse.redirect(new URL(next, origin))
}
