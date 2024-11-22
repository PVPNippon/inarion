import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { ChevronDownIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white shadow-button hover:bg-buttonHover hover:text-white disabled:shadow-none active:bg-darkPrimary', // Add disabled:shadow-none
        destructive:
          'bg-destructive text-white shadow-button hover:bg-destructiveHover hover:text-white disabled:shadow-none active:bg-darkDestructive', // Add disabled:shadow-none
        outline:
          'border text-primary bg-background shadow-button hover:text-primary hover:border-primary hover:bg-outlineHover active:bg-darkOutline disabled:shadow-none', // Add disabled:shadow-none
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

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
      {props.children}
      {variant === 'select' && <ChevronDownIcon className="h-4 w-4 opacity-50 ml-auto" />}
    </Comp>
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
