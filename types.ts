
export enum AppState {
  WELCOME = 'WELCOME',
  INPUT_INFO = 'INPUT_INFO',
  CATEGORY_SELECT = 'CATEGORY_SELECT',
  QUESTION_SELECT = 'QUESTION_SELECT',
  SHUFFLING = 'SHUFFLING',
  CARD_SELECT = 'CARD_SELECT',
  READING = 'READING',
  RESULT = 'RESULT',
  LOGIN = 'LOGIN',
}

export type CategoryKey = 'FANDOM' | 'LOVE' | 'APPEARANCE' | 'CAREER' | 'WEALTH' | 'HEALTH' | 'STUDY' | 'RELATIONSHIP';

export type Language = 'ko' | 'en';

export interface QuestionCategory {
  id: CategoryKey;
  label: string; 
  icon: string;
  questions: string[]; 
}

export interface TarotCard {
  id: number;
  name: string;
  isReversed: boolean;
  imagePlaceholder: string; 
  generatedImage?: string; 
  backDesign: number; // 0, 1, or 2
}

export interface ReadingResult {
  date: string; // ISO string
  question: string;
  cards: TarotCard[];
  interpretation: string;
}

export interface UserInfo {
  name: string;
  birthDate: string;
  zodiacSign: string;
}

export interface User {
  email: string;
  coins: number;
  userInfo?: UserInfo;
  password?: string;
  history: ReadingResult[];
}