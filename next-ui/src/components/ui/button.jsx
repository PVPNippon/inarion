/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white shadow-button hover:bg-buttonHover hover:text-white disabled:shadow-none active:bg-darkPrimary disabled:bg-secondary disabled:text-secondary-foreground', // Add disabled:shadow-none
        destructive:
          'bg-destructive text-white shadow-button hover:bg-destructiveHover hover:text-white disabled:shadow-none active:bg-darkDestructive', // Add disabled:shadow-none
        outline:
          'border text-primary bg-background shadow-button hover:text-primary hover:border-primary hover:bg-outlineHover active:bg-darkOutline disabled:shadow-none disabled:border-none disabled:bg-secondary disabled:text-secondary-foreground', // Add disabled:shadow-none
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/70 active:bg-secondary/90 disabled:shadow-none', // Add disabled:shadow-none
        ghost: 'hover:bg-accent hover:text-accent-foreground disabled:shadow-none', // Add disabled:shadow-none
        link: 'text-accent-foreground underline-offset-4 hover:underline hover:text-primary disabled:shadow-none active:text-darkPrimary', // Add disabled:shadow-none
        noBorder: 'text-primary hover:bg-primary/90 hover:text-accent-foreground disabled:shadow-none', // Add disabled:shadow-none
        carousel:
          'border border-forground/30 text-foreground bg-background hover:text-primary hover:border-primary disabled:shadow-none', // Add disabled:shadow-none'
        select:
          'flex h-9 w-full gap-2 items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-menu1 shadow-menu2 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      },
      size: {
        default: 'h-10 rounded-s-lg px-4 py-2',
        sm: 'h-9 rounded-s-lg px-6 py-2 text-xs',
        lg: 'h-11 rounded-s-lg px-8 py-3',
        icon: 'h-9 w-9 rounded-4xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button'

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
