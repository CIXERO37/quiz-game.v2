"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

interface TutorialModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function TutorialModal({ open, onClose, onConfirm }: TutorialModalProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState(1)

  const nextStep = () => setStep((prev) => prev + 1)
  const prevStep = () => setStep((prev) => prev - 1)

  const handleFinish = () => {
    setStep(1)
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white/95 backdrop-blur-lg border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎮 {t('howToPlay', 'How to Play')}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4 text-gray-700 text-sm sm:text-base">
            <p><strong>1.</strong> {t('enterName', 'Enter your name and choose an avatar.')}</p>
            <p><strong>2.</strong> {t('gameCodeQR', 'Enter the 6-digit game code or scan the QR code.')}</p>
            <p><strong>3.</strong> {t('waitForHost', 'Wait for the host to start the quiz.')}</p>
            {/* <p><strong>4.</strong> Answer questions quickly and accurately to win!</p>
            <p><strong>5.</strong> Your score is based on speed and correctness.</p> */}
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-3 text-gray-700 text-sm sm:text-base">
            <h3 className="font-semibold text-purple-600">🚀 {t('miniGameGuide', 'Mini-Game Guide')}</h3>
            <p>
              {t('afterCorrect', 'After every')} <strong>3 {t('correctAnswers', 'correct answers')}</strong>, {t('enterMiniGame', 'you\'ll enter a mini-game!')}
            </p>
            <div className="flex justify-center">
              <Image
                src="/images/gambar-tutor.png" // Ganti dengan URL gambar kamu
                alt="Rocket mini-game"
                width={240}
                height={120}
                className="rounded-lg border"
              />
            </div>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('swipeRocket', 'Swipe left/right to move the rocket.')}</li>
              <li>{t('avoidMeteors', 'Avoid meteors/dark object — hitting them will reduce your points.')}</li>
              <li>{t('collectItems', 'Collect colorful items to increase your points.')}</li>
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          {step > 1 && (
            <Button variant="outline" onClick={prevStep}>
              {t('previous', 'Back')}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            {step < 2 && (
              <Button 
                variant="outline" 
                onClick={handleFinish}
                className="text-gray-600 hover:text-gray-800"
              >
                {t('skip', 'Skip')}
              </Button>
            )}
            {step < 2 ? (
              <Button onClick={nextStep}>
                {t('next', 'Next')}
              </Button>
            ) : (
              <Button onClick={handleFinish}>
                {t('start', 'Start')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}