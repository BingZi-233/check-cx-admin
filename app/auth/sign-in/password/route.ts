import { NextResponse } from "next/server"

import { sanitizeRedirectPath } from "@/lib/admin/env"

function redirectTo(path: string, origin: string) {
  return NextResponse.redirect(new URL(path, origin), 303)
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const formData = await request.formData()
  sanitizeRedirectPath(String(formData.get("next") ?? "/dashboard"))
  return redirectTo("/login?error=provider", url.origin)
}
