'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function LogoutButton({
  redirectTo = '/auth/login',
  onLoggedOut,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'onClick'> & {
  redirectTo?: string
  onLoggedOut?: () => void
}) {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    onLoggedOut?.()
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <Button onClick={logout} {...props}>
      {children ?? '登出'}
    </Button>
  )
}
