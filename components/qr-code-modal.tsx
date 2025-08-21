"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"
import { X, Copy, Check } from "lucide-react"
import { useState } from "react"

interface QRCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameCode: string
  joinUrl: string
}

export function QRCodeModal({ open, onOpenChange, gameCode, joinUrl }: QRCodeModalProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(joinUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md lg:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="space-y-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Join Game
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4 sm:space-y-6">
          <div className="flex justify-center">
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-lg border border-gray-100">
              <QRCodeSVG
                value={joinUrl}
                size={Math.min(240, window.innerWidth * 0.6)}
                level="M"
                includeMargin={false}
                className="block w-full h-auto max-w-[240px] max-h-[240px]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 sm:gap-3 bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-mono font-bold text-gray-800 tracking-wider break-all">
                {gameCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                title="Copy game code"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
              <span className="text-xs sm:text-sm text-gray-700 flex-1 font-mono break-all">{joinUrl}</span>
              <button
                onClick={handleCopyUrl}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                title="Copy join link"
              >
                {copiedUrl ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
