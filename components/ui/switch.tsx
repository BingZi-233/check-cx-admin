'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type SwitchProps = {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  name?: string
}

function Switch({
  checked,
  defaultChecked,
  disabled,
  onCheckedChange,
  className,
  name,
}: SwitchProps) {
  const [uncontrolled, setUncontrolled] = React.useState(!!defaultChecked)
  const isControlled = typeof checked === 'boolean'
  const value = isControlled ? checked : uncontrolled

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      name={name}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        const next = !value
        if (!isControlled) setUncontrolled(next)
        onCheckedChange?.(next)
      }}
      className={cn(
        'focus-visible:ring-ring/50 focus-visible:ring-[3px] inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        value ? 'bg-primary' : 'bg-input',
        className
      )}
    >
      <span
        className={cn(
          'bg-background pointer-events-none block size-4 rounded-full shadow-sm transition-transform',
          value ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

export { Switch }

