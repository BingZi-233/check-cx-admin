import { NextResponse } from "next/server"

import { getRequestOrigin, sanitizeRedirectPath } from "@/lib/admin/env"

function redirectTo(path: string, origin: string) {
  return NextResponse.redirect(new URL(path, origin), 303)
}

export async function POST(request: Request) {
  const origin = getRequestOrigin(request)
  const formData = await request.formData()
  sanitizeRedirectPath(String(formData.get("next") ?? "/dashboard"))
  return redirectTo("/login?error=provider", origin)
}
