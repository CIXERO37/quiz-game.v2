"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type TranslationKey = 
  | 'title' | 'subtitle' | 'host' | 'join' | 'language' | 'english' | 'indonesian' | 'chinese'
  | 'welcome' | 'startGame' | 'joinGame' | 'createGame' | 'gameCode' | 'enterCode' | 'waiting'
  | 'players' | 'ready' | 'notReady' | 'gameStarting' | 'loading' | 'error' | 'success'
  | 'cancel' | 'confirm' | 'close' | 'next' | 'previous' | 'submit' | 'reset'
  | 'score' | 'points' | 'time' | 'question' | 'answer' | 'correct' | 'incorrect'
  | 'tutorial' | 'rules' | 'howToPlay' | 'instructions' | 'backToMenu' | 'playAgain'
  | 'gameOver' | 'winner' | 'loser' | 'tie' | 'finalScore' | 'highScore' | 'newRecord'
  | 'enterName' | 'chooseAvatar' | 'gameCodeQR' | 'waitForHost' | 'miniGameGuide'
  | 'afterCorrect' | 'correctAnswers' | 'enterMiniGame' | 'swipeRocket' | 'avoidMeteors'
  | 'collectItems' | 'reducePoints' | 'increasePoints' | 'skip' | 'start' | 'name'

const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    // Main page
    "title": "QUIZ GAME",
    "subtitle": "Play a quiz game and with your friends!",
    "host": "HOST",
    "join": "JOIN",
    "language": "Language",
    "english": "English",
    "indonesian": "Indonesian",
    "chinese": "Chinese",
    
    // General UI
    "welcome": "Welcome",
    "name": "Name",
    "startGame": "Start Game",
    "joinGame": "Join Game",
    "createGame": "Create Game",
    "gameCode": "Game Code",
    "enterCode": "Enter Code",
    "waiting": "Waiting...",
    "players": "Players",
    "ready": "Ready",
    "notReady": "Not Ready",
    "gameStarting": "Game Starting...",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "close": "Close",
    "next": "Next",
    "previous": "Previous",
    "submit": "Submit",
    "reset": "Reset",
    
    // Game related
    "score": "Score",
    "points": "Points",
    "time": "Time",
    "question": "Question",
    "answer": "Answer",
    "correct": "Correct!",
    "incorrect": "Incorrect!",
    
    // Tutorial and rules
    "tutorial": "Tutorial",
    "rules": "Rules",
    "howToPlay": "How to Play",
    "instructions": "Instructions",
    "backToMenu": "Back to Menu",
    "playAgain": "Play Again",
    
    // Game results
    "gameOver": "Game Over",
    "winner": "Winner!",
    "loser": "Game Over",
    "tie": "It's a Tie!",
    "finalScore": "Final Score",
    "highScore": "High Score",
    "newRecord": "New Record!",
    
    // Tutorial specific
    "enterName": "Enter your name and choose an avatar.",
    "chooseAvatar": "Choose Your Avatar",
    "gameCodeQR": "Enter the 6-digit game code or scan the QR code.",
    "waitForHost": "Wait for the host to start the quiz.",
    "miniGameGuide": "Mini-Game Guide",
    "afterCorrect": "After every",
    "correctAnswers": "correct answers",
    "enterMiniGame": "you'll enter a mini-game!",
    "swipeRocket": "Swipe left/right to move the rocket.",
    "avoidMeteors": "Avoid meteors/dark object — hitting them will reduce your points.",
    "collectItems": "Collect colorful items to increase your points.",
    "reducePoints": "reduce your points",
    "increasePoints": "increase your points",
    "skip": "Skip",
    "start": "Start"
  },
  id: {
    // Main page
    "title": "PERMAINAN KUIS",
    "subtitle": "Mainkan permainan kuis bersama teman-temanmu!",
    "host": "HOST",
    "join": "GABUNG",
    "language": "Bahasa",
    "english": "Bahasa Inggris",
    "indonesian": "Bahasa Indonesia",
    "chinese": "Bahasa Mandarin",
    
    // General UI
    "welcome": "Selamat Datang",
    "name": "Nama",
    "startGame": "Mulai Permainan",
    "joinGame": "Gabung Permainan",
    "createGame": "Buat Permainan",
    "gameCode": "Kode Permainan",
    "enterCode": "Masukkan Kode",
    "waiting": "Menunggu...",
    "players": "Pemain",
    "ready": "Siap",
    "notReady": "Belum Siap",
    "gameStarting": "Permainan Dimulai...",
    "loading": "Memuat...",
    "error": "Kesalahan",
    "success": "Berhasil",
    "cancel": "Batal",
    "confirm": "Konfirmasi",
    "close": "Tutup",
    "next": "Selanjutnya",
    "previous": "Sebelumnya",
    "submit": "Kirim",
    "reset": "Reset",
    
    // Game related
    "score": "Skor",
    "points": "Poin",
    "time": "Waktu",
    "question": "Pertanyaan",
    "answer": "Jawaban",
    "correct": "Benar!",
    "incorrect": "Salah!",
    
    // Tutorial and rules
    "tutorial": "Tutorial",
    "rules": "Aturan",
    "howToPlay": "Cara Bermain",
    "instructions": "Petunjuk",
    "backToMenu": "Kembali ke Menu",
    "playAgain": "Main Lagi",
    
    // Game results
    "gameOver": "Permainan Selesai",
    "winner": "Pemenang!",
    "loser": "Permainan Selesai",
    "tie": "Seri!",
    "finalScore": "Skor Akhir",
    "highScore": "Skor Tertinggi",
    "newRecord": "Rekor Baru!",
    
    // Tutorial specific
    "enterName": "Masukkan nama dan pilih avatar.",
    "chooseAvatar": "Pilih Avatar Anda",
    "gameCodeQR": "Masukkan kode permainan 6 digit atau scan QR code.",
    "waitForHost": "Tunggu host untuk memulai kuis.",
    "miniGameGuide": "Panduan Mini-Game",
    "afterCorrect": "Setelah setiap",
    "correctAnswers": "jawaban benar",
    "enterMiniGame": "Anda akan masuk ke mini-game!",
    "swipeRocket": "Geser kiri/kanan untuk menggerakkan roket.",
    "avoidMeteors": "Hindari meteor/objek gelap — terkena akan mengurangi poin.",
    "collectItems": "Kumpulkan item berwarna untuk menambah poin.",
    "reducePoints": "mengurangi poin",
    "increasePoints": "menambah poin",
    "skip": "Lewati",
    "start": "Mulai"
  },
  zh: {
    // Main page
    "title": "问答游戏",
    "subtitle": "和你的朋友一起玩问答游戏！",
    "host": "主持",
    "join": "加入",
    "language": "语言",
    "english": "英语",
    "indonesian": "印尼语",
    "chinese": "中文",
    
    // General UI
    "welcome": "欢迎",
    "name": "姓名",
    "startGame": "开始游戏",
    "joinGame": "加入游戏",
    "createGame": "创建游戏",
    "gameCode": "游戏代码",
    "enterCode": "输入代码",
    "waiting": "等待中...",
    "players": "玩家",
    "ready": "准备就绪",
    "notReady": "未准备",
    "gameStarting": "游戏开始中...",
    "loading": "加载中...",
    "error": "错误",
    "success": "成功",
    "cancel": "取消",
    "confirm": "确认",
    "close": "关闭",
    "next": "下一个",
    "previous": "上一个",
    "submit": "提交",
    "reset": "重置",
    
    // Game related
    "score": "分数",
    "points": "点数",
    "time": "时间",
    "question": "问题",
    "answer": "答案",
    "correct": "正确！",
    "incorrect": "错误！",
    
    // Tutorial and rules
    "tutorial": "教程",
    "rules": "规则",
    "howToPlay": "游戏玩法",
    "instructions": "说明",
    "backToMenu": "返回菜单",
    "playAgain": "再玩一次",
    
    // Game results
    "gameOver": "游戏结束",
    "winner": "获胜者！",
    "loser": "游戏结束",
    "tie": "平局！",
    "finalScore": "最终分数",
    "highScore": "最高分",
    "newRecord": "新纪录！",
    
    // Tutorial specific
    "enterName": "输入您的姓名并选择头像。",
    "chooseAvatar": "选择您的头像",
    "gameCodeQR": "输入6位游戏代码或扫描二维码。",
    "waitForHost": "等待主持人开始问答。",
    "miniGameGuide": "小游戏指南",
    "afterCorrect": "每",
    "correctAnswers": "个正确答案后",
    "enterMiniGame": "您将进入小游戏！",
    "swipeRocket": "左右滑动移动火箭。",
    "avoidMeteors": "避开流星/暗色物体 — 碰到会减少分数。",
    "collectItems": "收集彩色物品来增加分数。",
    "reducePoints": "减少分数",
    "increasePoints": "增加分数",
    "skip": "跳过",
    "start": "开始"
  }
}

interface LanguageContextType {
  currentLanguage: string
  changeLanguage: (language: string) => void
  t: (key: TranslationKey, fallback?: string) => string
  isClient: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Get language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('i18nextLng') || 'en'
    if (translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage)
    }
  }, [])

  const changeLanguage = (language: string) => {
    if (translations[language]) {
      setCurrentLanguage(language)
      localStorage.setItem('i18nextLng', language)
    }
  }

  const t = (key: TranslationKey, fallback?: string) => {
    const translation = translations[currentLanguage]?.[key]
    return translation || fallback || key
  }

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    t,
    isClient
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
