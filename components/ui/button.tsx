"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  render,
  nativeButton,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const mergedClassName = cn(buttonVariants({ variant, size, className }))
  const resolvedNativeButton =
    nativeButton ??
    (render
      ? React.isValidElement(render) && render.type === "button"
      : true)

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>

    return React.cloneElement(child, {
      ...(props as object),
      className: cn(mergedClassName, child.props.className),
    })
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={mergedClassName}
      render={render}
      nativeButton={resolvedNativeButton}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
