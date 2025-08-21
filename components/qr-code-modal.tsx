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
      <DialogContent className="max-w-lg bg-white/95 backdrop-blur-lg border border-white/20 p-10">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Join Game
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <QRCodeSVG value={joinUrl} size={300} />
            </div>
          </div>

          <div className="space-y-2">
           
            <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-lg p-3">
              <span className="text-6xl font-mono font-bold text-gray-800">{gameCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Copy game code"
              >
                {copiedCode ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6 text-gray-600" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
      
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3">
              <span className="text-lg text-gray-700 truncate flex-1">{joinUrl}</span>
              <button
                onClick={handleCopyUrl}
                className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                title="Copy join link"
              >
                {copiedUrl ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6 text-gray-600" />}
              </button>
            </div>
          </div>

            
        </div>
      </DialogContent>
    </Dialog>
  )
}
