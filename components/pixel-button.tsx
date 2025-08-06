"use client"

import React from "react"

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: 'blue' | 'green' | 'red' | 'yellow'
  size?: 'sm' | 'md' | 'lg'
}

export function PixelButton({
  children,
  color = 'blue',
  size = 'md',
  className = '',
  ...props
}: PixelButtonProps) {
  const colorStyles = {
    blue: 'bg-blue-500 border-blue-700 text-white hover:bg-blue-600 active:bg-blue-700',
    green: 'bg-green-500 border-green-700 text-white hover:bg-green-600 active:bg-green-700',
    red: 'bg-red-500 border-red-700 text-white hover:bg-red-600 active:bg-red-700',
    yellow: 'bg-yellow-400 border-yellow-600 text-black hover:bg-yellow-500 active:bg-yellow-600',
  }

  const sizeStyles = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
  }

  return (
    <button
      className={`border-2 font-mono uppercase tracking-wide shadow-[4px_4px_0px_rgba(0,0,0,0.8)] active:shadow-[2px_2px_0px_rgba(0,0,0,0.8)] active:translate-x-[2px] active:translate-y-[2px] transition-all ${colorStyles[color]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}