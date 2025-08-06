import { ReactNode } from "react";

// lib/types.ts
export interface Choice {
    id: number;
    choice_text: string;
    is_correct: boolean;
  }
  
  export interface Question {
    question_text: ReactNode;
    id: number;
    question: string;
    choices: Choice[];
    image?: string;
    order_index?: number;
  }
  
  export interface Quiz {
    id: number;
    title: string;
    description: string;
    questions: Question[];
  }
  
  export interface AVATAR_OPTION {
    id: string;
    name: string;
    image: string;
  }
  
  // Avatar options untuk join game
  export const AVATAR_OPTIONS: AVATAR_OPTION[] = [
    { id: 'bear', name: 'Bear', image: '/avatars/bear.png' },
    { id: 'cat', name: 'Cat', image: '/avatars/cat.png' },
    { id: 'dog', name: 'Dog', image: '/avatars/dog.png' },
    { id: 'elephant', name: 'Elephant', image: '/avatars/elephant.png' },
    { id: 'lion', name: 'Lion', image: '/avatars/lion.png' },
    { id: 'panda', name: 'Panda', image: '/avatars/panda.png' },
    { id: 'rabbit', name: 'Rabbit', image: '/avatars/rabbit.png' },
    { id: 'tiger', name: 'Tiger', image: '/avatars/tiger.png' },
  ];