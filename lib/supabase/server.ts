import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getServerSupabasePublicKey, getServerSupabaseUrl } from "@/lib/admin/server-env"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(getServerSupabaseUrl(), getServerSupabasePublicKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
        }
      },
    },
  })
}
