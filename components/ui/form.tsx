'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

type FormFieldContextValue = {
  id: string
  name: string
  error?: string
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  if (!fieldContext) {
    throw new Error('useFormField should be used within FormField')
  }
  return fieldContext
}

function Form({ className, ...props }: React.ComponentProps<'form'>) {
  return <form className={cn('space-y-4', className)} {...props} />
}

interface FormFieldProps {
  name: string
  error?: string
  children: React.ReactNode
}

function FormField({ name, error, children }: FormFieldProps) {
  const id = React.useId()
  return (
    <FormFieldContext.Provider value={{ id, name, error }}>
      {children}
    </FormFieldContext.Provider>
  )
}

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('space-y-2', className)} {...props} />
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<'label'>) {
  const { error, id } = useFormField()

  return (
    <Label
      className={cn(error && 'text-destructive', className)}
      htmlFor={id}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, id } = useFormField()

  return (
    <Slot
      id={id}
      aria-describedby={error ? `${id}-message` : undefined}
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormMessage({
  className,
  children,
  ...props
}: React.ComponentProps<'p'>) {
  const { error, id } = useFormField()
  const body = error ?? children

  if (!body) {
    return null
  }

  return (
    <p
      id={`${id}-message`}
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
}
