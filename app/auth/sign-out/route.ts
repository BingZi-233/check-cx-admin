import { NextResponse } from "next/server"

import { getRequestOrigin } from "@/lib/admin/env"
import { createClient } from "@/lib/supabase/server"

function redirectToLogin(origin: string) {
  return NextResponse.redirect(new URL("/login", origin), 303)
}

async function handleSignOut(request: Request) {
  const origin = getRequestOrigin(request)
  const supabase = await createClient()

  await supabase.auth.signOut()

  return redirectToLogin(origin)
}

export async function GET(request: Request) {
  return handleSignOut(request)
}

export async function POST(request: Request) {
  return handleSignOut(request)
}
