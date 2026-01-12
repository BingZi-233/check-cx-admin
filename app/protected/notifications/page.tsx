import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { NotificationsClient } from './notifications-client'

export type NotificationLevel = 'info' | 'warning' | 'error'

export type SystemNotification = {
  id: string
  message: string
  level: NotificationLevel
  is_active: boolean
  created_at: string
  updated_at: string
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const { data: notifications, error: listError } = await supabase
    .from('system_notifications')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <NotificationsClient
        initialNotifications={(notifications ?? []) as SystemNotification[]}
        initialError={listError?.message ?? null}
      />
    </div>
  )
}

