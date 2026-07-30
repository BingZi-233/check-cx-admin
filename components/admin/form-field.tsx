"use client"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { cn } from "@/lib/utils"

type FormFieldProps = {
  label?: React.ReactNode
  htmlFor?: string
  description?: React.ReactNode
  /** 来自 ActionState.fieldErrors，为空时不占位 */
  error?: string
  className?: string
  children: React.ReactNode
}

/** 标签 + 控件 + 字段级错误。错误显示在字段下方，而不是顶部横幅。 */
export function FormField({
  label,
  htmlFor,
  description,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <Field className={cn("gap-1.5", className)} data-invalid={error ? "" : undefined}>
      {label ? <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel> : null}
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  )
}
