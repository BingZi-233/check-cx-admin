import { LoginForm } from '@/components/login-form'
import { ThemeToggle } from '@/components/theme/theme-toggle'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-end pb-2">
          <ThemeToggle />
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
