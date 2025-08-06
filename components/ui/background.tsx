"use client"

import { ReactNode } from 'react'

interface BackgroundProps {
  children: ReactNode
  variant?: 'default' | 'gradient' | 'dots'
}

export function Background({ children, variant = 'default' }: BackgroundProps) {
  const getBackgroundClass = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800'
      case 'dots':
        return 'bg-gray-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black'
      default:
        return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900'
    }
  }

  return (
    <div className={`min-h-screen ${getBackgroundClass()} relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}