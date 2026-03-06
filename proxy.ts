import { NextResponse, type NextRequest } from "next/server"

import { hasPublicSupabaseEnv } from "@/lib/admin/env"
import { updateSession } from "@/lib/supabase/middleware"

export async function proxy(request: NextRequest) {
  if (!hasPublicSupabaseEnv()) {
    return NextResponse.next({ request })
  }

  return updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
