import 'server-only'

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('缺少环境变量：NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) throw new Error('缺少环境变量：SUPABASE_SERVICE_ROLE_KEY')

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
