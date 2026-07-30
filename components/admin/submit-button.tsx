"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  /** 由 useActionForm 传入；跨 portal 提交时 useFormStatus 拿不到状态，所以优先用它 */
  isPending?: boolean
  pendingText?: string
}

export function SubmitButton({
  children,
  isPending,
  pendingText,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()
  const busy = isPending ?? pending

  return (
    <Button type="submit" disabled={disabled || busy} {...props}>
      {busy ? <Spinner /> : null}
      {busy && pendingText ? pendingText : children}
    </Button>
  )
}
