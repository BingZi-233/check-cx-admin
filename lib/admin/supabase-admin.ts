import "server-only"

import { createClient } from "@supabase/supabase-js"

import { getServerSupabaseUrl, getServiceRoleKey } from "@/lib/admin/server-env"

export function createAdminClient() {
  const url = getServerSupabaseUrl()
  const serviceRoleKey = getServiceRoleKey()

  if (!url || !serviceRoleKey) {
    throw new Error("缺少后台数据库环境变量，无法创建管理员 Supabase 客户端")
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
