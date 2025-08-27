# Multi-Language Support for Quiz Game

This project now supports multiple languages with **real-time language switching** using React Context. No page refresh required!

## ✨ **New Features**

- 🌍 **Real-Time Language Switching**: Change language instantly without page refresh
- 🚀 **React Context Architecture**: Modern state management for better performance
- 💫 **Live Updates**: All text updates immediately when language changes
- 🎯 **Demo Component**: See language changes in real-time at the bottom-left

## 🌟 **Core Features**

- 🌍 **Language Selector**: Located in the top-right corner of the main page
- 🇺🇸 **English**: Default language
- 🇮🇩 **Indonesian**: Bahasa Indonesia support
- 🇨🇳 **Chinese**: 中文 support
- 💾 **Persistent**: Language preference is saved in localStorage
- 🚀 **Next.js Compatible**: Works with React Server Components

## 🎮 **How to Use**

1. **Language Selection**: Click on the language selector in the top-right corner
2. **Choose Language**: Select from the dropdown menu
3. **Instant Translation**: All text updates immediately - no refresh needed!
4. **Persistent**: Your language choice is remembered for future visits
5. **Live Demo**: Watch the bottom-left demo component update in real-time

## 🏗️ **Technical Implementation**

### Architecture

- **React Context**: Centralized language state management
- **Client-side Only**: All internationalization logic runs in the browser
- **No Server Dependencies**: Compatible with React Server Components
- **Real-time Updates**: Context triggers immediate re-renders
- **TypeScript Support**: Fully typed with proper interfaces

### File Structure

```
contexts/
└── language-context.tsx      # Language context provider
components/
├── language-selector.tsx     # Language selector component
└── language-demo.tsx         # Real-time demo component
```

### How Real-Time Updates Work

1. **Context Provider**: Wraps the entire app in `LanguageProvider`
2. **State Management**: Uses React Context for global language state
3. **Immediate Updates**: When language changes, all components re-render
4. **No Refresh**: All updates happen instantly in the browser

## 🔧 **Adding New Languages**

1. Add the new language to the `translations` object in `contexts/language-context.tsx`
2. Update the `languages` array in `components/language-selector.tsx`
3. Add the language to the `TranslationKey` type

Example:

```typescript
// In language-context.tsx
fr: {
  "title": "JEU DE QUIZ",
  "subtitle": "Jouez à un jeu de quiz avec vos amis !",
  // ... other translations
}

// In language-selector.tsx
{ code: 'fr', name: t('french', 'French'), flag: '🇫🇷', nativeName: 'Français' }
```

### Adding New Translation Keys

1. Add the key to the `TranslationKey` type in `contexts/language-context.tsx`
2. Add the key to all language objects in the `translations` object
3. Use the key in your components with `t('keyName')`

## 📋 **Translation Keys**

| Key          | English                                 | Indonesian                                    | Chinese                    |
| ------------ | --------------------------------------- | --------------------------------------------- | -------------------------- |
| `title`      | QUIZ GAME                               | PERMAINAN KUIS                                | 问答游戏                   |
| `subtitle`   | Play a quiz game and with your friends! | Mainkan permainan kuis bersama teman-temanmu! | 和你的朋友一起玩问答游戏！ |
| `host`       | HOST                                    | HOST                                          | 主持                       |
| `join`       | JOIN                                    | GABUNG                                        | 加入                       |
| `language`   | Language                                | Bahasa                                        | 语言                       |
| `english`    | English                                 | Bahasa Inggris                                | 英语                       |
| `indonesian` | Indonesian                              | Bahasa Indonesia                              | 印尼语                     |
| `chinese`    | Chinese                                 | Bahasa Mandarin                               | 中文                       |

## 🌐 **Browser Support**

- Modern browsers with localStorage support
- Works with all Next.js versions (13+)
- Compatible with React Server Components
- No external dependencies for core functionality

## ✅ **Advantages of This Approach**

- ✅ **Real-Time Updates**: Language changes instantly without refresh
- ✅ **No Server-Side Issues**: Works perfectly with Next.js 13+ and RSC
- ✅ **Fast Performance**: React Context provides efficient updates
- ✅ **Easy Maintenance**: Simple, readable code structure
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Bundle Size**: Smaller bundle without heavy libraries
- ✅ **Reliability**: Centralized state management

## 🎯 **Real-Time Demo**

The `LanguageDemo` component at the bottom-left shows:

- Current selected language
- Live translation updates for all keys
- Instant feedback when switching languages

## 🚀 **Future Enhancements**

- Add more languages (French, Spanish, Japanese, etc.)
- RTL language support
- Dynamic language loading from API
- Translation management system
- Pluralization support
- Animated language transitions
