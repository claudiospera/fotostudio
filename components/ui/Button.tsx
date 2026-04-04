'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className = '', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary:   'bg-[var(--ac)] text-[#0f0f0f] hover:bg-[var(--ac2)]',
      secondary: 'bg-[var(--s2)] border border-[var(--b1)] text-[var(--tx)] hover:bg-[var(--s3)] hover:border-[var(--b2)]',
      ghost:     'text-[var(--t2)] hover:bg-[var(--s2)] hover:text-[var(--tx)]',
      danger:    'bg-[var(--s2)] border border-[var(--b1)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white hover:border-[var(--red)]',
    }

    const sizes = {
      sm: 'h-7 px-3 text-xs rounded-[var(--r2)]',
      md: 'h-9 px-4 text-sm rounded-[var(--r2)]',
      lg: 'h-11 px-6 text-sm rounded-[var(--r)]',
    }

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
