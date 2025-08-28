"use client"

import { useLanguage } from '@/contexts/language-context'
import { Globe, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LanguageSelector() {
  const { t, changeLanguage, currentLanguage, isClient } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en', name: t('english', 'English'), flag: '🇺🇸', nativeName: 'English' },
    { code: 'id', name: t('indonesian', 'Indonesian'), flag: '🇮🇩', nativeName: 'Bahasa Indonesia' },
    { code: 'zh', name: t('chinese', 'Chinese'), flag: '🇨🇳', nativeName: '中文' },
  ]

  const currentLanguageData = languages.find(lang => lang.code === currentLanguage) || languages[0]

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  // Don't render until client-side
  if (!isClient) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Select value={currentLanguage} onValueChange={handleLanguageChange} onOpenChange={handleOpenChange}>
        <SelectTrigger className="w-[160px] h-10 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all duration-300 shadow-lg [&>svg]:hidden">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-cyan-300" />
            <div className="flex items-center space-x-2">
              <span className="text-lg">{currentLanguageData.flag}</span>
              <span className="text-sm font-medium">{currentLanguageData.nativeName}</span>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-cyan-300 transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white/95 backdrop-blur-md border-white/20 shadow-xl">
          {languages.map((language) => (
            <SelectItem
              key={language.code}
              value={language.code}
              className="hover:bg-white/80 cursor-pointer data-[state=checked]:bg-cyan-50 data-[state=checked]:text-cyan-700"
            >
              <div className="flex items-center space-x-3 py-2">
                <span className="text-xl">{language.flag}</span>
                <div className="flex flex-col">
                  <span className="text-gray-800 font-medium">{language.nativeName}</span>
                  <span className="text-gray-500 text-xs">{language.name}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
