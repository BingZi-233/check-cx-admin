import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

function redirectToLogin(origin: string) {
  return NextResponse.redirect(new URL("/login", origin), 303)
}

async function handleSignOut(request: Request) {
  const url = new URL(request.url)
  const supabase = await createClient()

  await supabase.auth.signOut()

  return redirectToLogin(url.origin)
}

export async function GET(request: Request) {
  return handleSignOut(request)
}

export async function POST(request: Request) {
  return handleSignOut(request)
}
