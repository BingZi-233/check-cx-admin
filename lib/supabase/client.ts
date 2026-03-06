import { createBrowserClient } from "@supabase/ssr"

export function createClient(url: string, key: string) {
  return createBrowserClient(url, key)
}
