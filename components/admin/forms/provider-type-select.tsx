"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ProviderType } from "@/lib/admin/types"

export const providerTypeItems: Record<ProviderType, string> = {
  openai: "OpenAI",
  gemini: "Gemini",
  anthropic: "Anthropic",
}

type ProviderTypeSelectProps = {
  id?: string
  name?: string
  value?: ProviderType
  defaultValue?: ProviderType
  onValueChange?: (value: ProviderType) => void
  disabled?: boolean
  className?: string
}

export function ProviderTypeSelect({
  id,
  name = "type",
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
}: ProviderTypeSelectProps) {
  return (
    <Select
      id={id}
      name={name}
      items={providerTypeItems}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onValueChange={(next) => onValueChange?.(next as ProviderType)}
    >
      <SelectTrigger className={className ?? "w-full"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(providerTypeItems) as ProviderType[]).map((type) => (
          <SelectItem key={type} value={type}>
            {providerTypeItems[type]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
