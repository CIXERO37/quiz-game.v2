"use client"

import { useLanguage } from '@/contexts/language-context'
import { motion } from 'framer-motion'

export function LanguageDemo() {
  const { t, currentLanguage } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 text-white max-w-xs"
    >
      <div className="text-sm font-mono">
        <div className="mb-3 text-center">
          <span className="text-cyan-300 font-bold">🌍 {t('language')}</span>
          <div className="text-xs text-yellow-300">{currentLanguage.toUpperCase()}</div>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-yellow-300">Title:</span> {t('title')}</div>
            <div><span className="text-green-300">Host:</span> {t('host')}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-pink-300">Join:</span> {t('join')}</div>
            <div><span className="text-blue-300">Score:</span> {t('score')}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-purple-300">Ready:</span> {t('ready')}</div>
            <div><span className="text-orange-300">Time:</span> {t('time')}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-red-300">Cancel:</span> {t('cancel')}</div>
            <div><span className="text-indigo-300">Confirm:</span> {t('confirm')}</div>
          </div>
        </div>
        
        <div className="mt-3 text-center text-xs text-gray-300">
          ✨ {t('welcome')} ✨
        </div>
      </div>
    </motion.div>
  )
}
