"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"
import { X } from "lucide-react"

interface QRCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  joinUrl: string
}

export function QRCodeModal({ open, onOpenChange, joinUrl }: QRCodeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg lg:max-w-2xl xl:max-w-3xl w-[95vw] max-h-[100vh] overflow-y-auto bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl p-4 sm:p-6 lg:p-8">
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
                size={1000}
                level="M"
                includeMargin={false}
                className="block w-full h-auto"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
