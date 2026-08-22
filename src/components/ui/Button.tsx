'use client';

import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-bold rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-xs md:text-sm font-bold rounded-xl gap-2',
    lg: 'px-6 py-3 text-sm md:text-base font-extrabold rounded-xl gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white hover:from-[var(--gold-dark)] hover:to-[var(--gold)] shadow-xs hover:shadow-gold transition-all duration-200 border border-[rgba(0,0,0,0.06)]',
    secondary:
      'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--gold)] hover:bg-[var(--gold-tint)] shadow-2xs transition-all duration-200',
    danger:
      'bg-[var(--overdue-bg)] text-[var(--overdue-color)] border border-[var(--overdue-border)] hover:bg-[var(--overdue-color)] hover:text-white transition-all duration-200',
    ghost:
      'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-all duration-150',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-sans tracking-tight cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
