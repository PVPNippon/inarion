import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva('border-4 border-gray-300 border-l-transparent rounded-full animate-spin', {
  variants: {
    size: {
      small: 'w-6 h-6',
      medium: 'w-9 h-9',
      large: 'w-12 h-12',
    },
    color: {
      primary: 'border-blue-500 border-l-transparent',
      secondary: 'border-gray-500 border-l-transparent',
      danger: 'border-red-500 border-l-transparent',
    },
  },
  defaultVariants: {
    size: 'medium',
    color: 'primary',
  },
})

export function Spinner({ size, color, className }) {
  return <div className={cn(spinnerVariants({ size, color }), className)} />
}
