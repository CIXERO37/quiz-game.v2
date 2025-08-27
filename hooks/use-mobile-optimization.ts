import { useRef, useEffect, useCallback } from 'react'

interface MobileOptimizationConfig {
  isMobile: boolean
  isLowEnd: boolean
  frameRate: number
  maxItems: number
  spawnInterval: number
  velocityMultiplier: number
}

export function useMobileOptimization(level: number = 1): MobileOptimizationConfig {
  const isMobile = useRef(false)
  const isLowEnd = useRef(false)
  const frameRate = useRef(60)
  const maxItems = useRef(20)
  const spawnInterval = useRef(500)
  const velocityMultiplier = useRef(1)

  // Detect device capabilities
  useEffect(() => {
    // Mobile detection
    isMobile.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                      window.innerWidth <= 768
    
    // Low-end device detection
    const coreCount = navigator.hardwareConcurrency || 4
    const memory = (navigator as any).deviceMemory || 4
    const connection = (navigator as any).connection?.effectiveType || '4g'
    
    isLowEnd.current = coreCount <= 4 || 
                      memory <= 4 || 
                      window.innerWidth <= 480 || 
                      connection === 'slow-2g' || 
                      connection === '2g'

    // Set performance parameters based on device
    if (isLowEnd.current) {
      frameRate.current = 30
      maxItems.current = 6
      spawnInterval.current = 800
      velocityMultiplier.current = 0.7
    } else if (isMobile.current) {
      frameRate.current = 45
      maxItems.current = 10
      spawnInterval.current = 600
      velocityMultiplier.current = 0.8
    } else {
      frameRate.current = 60
      maxItems.current = 15
      spawnInterval.current = 500
      velocityMultiplier.current = 1
    }

    // Adjust for level difficulty
    const levelMultiplier = Math.max(0.5, 1 - (level * 0.1))
    spawnInterval.current = Math.max(spawnInterval.current, (1000 - level * 100) * levelMultiplier)
  }, [level])

  // Adaptive performance adjustment based on frame rate
  const adjustPerformance = useCallback(() => {
    if (isLowEnd.current) {
      // Reduce complexity for low-end devices
      maxItems.current = Math.max(4, maxItems.current - 1)
      frameRate.current = Math.max(20, frameRate.current - 5)
    }
  }, [])

  // Get current configuration
  const getConfig = useCallback((): MobileOptimizationConfig => ({
    isMobile: isMobile.current,
    isLowEnd: isLowEnd.current,
    frameRate: frameRate.current,
    maxItems: maxItems.current,
    spawnInterval: spawnInterval.current,
    velocityMultiplier: velocityMultiplier.current
  }), [])

  return getConfig()
}
