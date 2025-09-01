"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { Sparkles, Star, Gamepad2, Rocket, Zap, Target, X } from "lucide-react"

interface TutorialModalProps {
  open: boolean
  onClose: (closedByX?: boolean) => void
  onConfirm: () => void
}

export function TutorialModal({ open, onClose, onConfirm }: TutorialModalProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState(1)

  const nextStep = () => setStep((prev) => prev + 1)
  const prevStep = () => setStep((prev) => prev - 1)

  const handleFinish = () => {
    console.log("🎯 Tutorial finished - calling onConfirm")
    setStep(1)
    onConfirm()
  }

  const handleClose = () => {
    console.log("🎯 Tutorial closed by X button")
    setStep(1)
    onClose(true) // Pass true to indicate it was closed by X button
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      console.log("🎯 Tutorial dialog onOpenChange - calling onClose")
      onClose(false) // Pass false to indicate normal close
    }
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-md p-0 border-0 bg-transparent">
        {/* Space Background */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/galaxy.webp')",
            }}
          />
          
          {/* Animated space elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute orbit-inner">
              <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg shadow-orange-400/60 border border-orange-300/30">
                <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/20"></div>
              </div>
            </div>
            <div className="absolute orbit-middle">
              <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-400/70 border border-blue-300/40 relative">
                <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/25"></div>
                <div className="absolute top-1 left-1 w-1 h-1 bg-green-300 rounded-full opacity-60"></div>
              </div>
            </div>
            <div className="absolute orbit-outer">
              <div className="w-4 h-4 bg-gradient-to-br from-purple-300 to-indigo-500 rounded-full shadow-lg shadow-purple-400/60 border border-purple-200/40">
                <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/20"></div>
              </div>
            </div>
          </div>

          {/* Cosmic rings */}
          <div className="absolute inset-0 flex items-center justify-center cosmic-ring-slow">
            <div className="w-80 h-80 border border-purple-300/10 rounded-full"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center" style={{ animation: "cosmic-ring-orbit 120s linear infinite" }}>
            <div className="w-96 h-96 border border-blue-300/8 rounded-full"></div>
          </div>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Glass morphism dialog content */}
        <div className="relative z-10 bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10 text-white hover:text-cyan-300"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t('close', 'Close')}</span>
          </button>

          <DialogHeader className="mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="mb-2 flex justify-center"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/30 to-cyan-500/30 backdrop-blur-xl rounded-xl flex items-center justify-center border-2 border-white/40 shadow-lg shadow-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-cyan-400/10 animate-pulse"></div>
                <Gamepad2 className="w-6 h-6 text-white relative z-10" />
                <Sparkles className="absolute top-1 right-1 w-1.5 h-1.5 text-cyan-300 animate-pulse" />
                <Star className="absolute bottom-1 left-1 w-1 h-1 text-purple-300 animate-pulse" style={{ animationDelay: "1s" }} />
              </div>
            </motion.div>
            
            <DialogTitle 
              className="text-xl font-bold text-center text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text"
              style={{
                textShadow: "0 0 20px rgba(147, 197, 253, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)",
                fontFamily: "monospace",
                imageRendering: "pixelated",
              }}
            >
              🎮 {t('howToPlay', 'How to Play')}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* Step 1 */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={stepVariants}
                transition={{ duration: 0.3 }}
                className="space-y-3 text-cyan-100 text-sm font-mono"
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-cyan-400/30 flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="flex-1 text-sm leading-relaxed">{t('enterName', 'Enter your name and choose an avatar.')}</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-purple-400/30 flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="flex-1 text-sm leading-relaxed">{t('gameCodeQR', 'Enter the 6-digit game code or scan the QR code.')}</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-green-400/30 flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <p className="flex-1 text-sm leading-relaxed">{t('waitForHost', 'Wait for the host to start the quiz.')}</p>
                  </div>
                  {/* penanda */}
                </div>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={stepVariants}
                transition={{ duration: 0.3 }}
                className="space-y-3 text-cyan-100 text-sm font-mono"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="h-4 w-4 text-cyan-400" />
                  <h3 className="font-semibold text-cyan-300 text-base">🚀 {t('miniGameGuide', 'Mini-Game Guide')}</h3>
                </div>
                
                <p className="text-cyan-200/90 mb-3 text-sm leading-relaxed">
                  {t('afterCorrect', 'After every')} <strong className="text-yellow-300">3 {t('correctAnswers', 'correct answers')}</strong>, {t('enterMiniGame', 'you\'ll enter a mini-game!')}
                </p>
                
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    <Image
                      src="/images/gambar-tutor.png"
                      alt="Rocket mini-game"
                      width={160}
                      height={80}
                      className="rounded-lg border border-cyan-400/30 shadow-lg shadow-cyan-400/20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-purple-400/10 rounded-lg"></div>
                  </div>
                </div>
                
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2">
                    <Zap className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{t('swipeRocket', 'Swipe left/right to move the rocket.')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{t('avoidMeteors', 'Avoid meteors/dark object — hitting them will reduce your points.')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{t('collectItems', 'Collect colorful items to increase your points.')}</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-4">
            {step > 1 && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  className="bg-black/30 border-cyan-400/30 text-cyan-100 hover:bg-cyan-400/20 hover:border-cyan-400 backdrop-blur-sm font-mono text-sm px-3 py-2 h-10"
                >
                  {t('previous', 'Back')}
                </Button>
              </motion.div>
            )}
            <div className="flex gap-2 ml-auto">
              {step < 2 && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="outline" 
                    onClick={handleFinish}
                    className="bg-black/30 border-cyan-400/30 text-cyan-200 hover:bg-cyan-400/20 hover:border-cyan-400 backdrop-blur-sm font-mono text-sm px-3 py-2 h-10"
                  >
                    {t('skip', 'Skip')}
                  </Button>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {step < 2 ? (
                  <Button 
                    onClick={nextStep}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/30 border border-cyan-400/30 backdrop-blur-sm font-mono relative overflow-hidden text-sm px-3 py-2 h-10"
                    style={{ imageRendering: "pixelated" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 animate-pulse"></div>
                    <span className="relative z-10">{t('next', 'Next')}</span>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-300 rounded-full animate-ping"></div>
                  </Button>
                ) : (
                  <Button 
                    onClick={handleFinish}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/30 border border-green-400/30 backdrop-blur-sm font-mono relative overflow-hidden text-sm px-3 py-2 h-10"
                    style={{ imageRendering: "pixelated" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 animate-pulse"></div>
                    <span className="relative z-10">{t('start', 'Start')}</span>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-300 rounded-full animate-ping"></div>
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}