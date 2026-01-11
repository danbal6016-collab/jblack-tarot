export interface TarotCard {
  id: number;
  name: string;
  isReversed: boolean;
  imagePlaceholder: string;
  backDesign: number;
}

export interface ReadingResult {
  date: string;
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
  history: ReadingResult[];
  userInfo?: UserInfo;
  bio?: string;          
  profilePic?: string;   
}

export type QuestionCategory = {
  id: string;
  label: string;
  icon: string;
  questions: string[];
};

export enum AppState {
  WELCOME,
  INPUT_INFO,
  CATEGORY_SELECT,
  QUESTION_SELECT,
  SHUFFLING,
  CARD_SELECT,
  RESULT,
}

export type CategoryKey = 'love' | 'career' | 'money' | 'health' | 'human';
export type Language = 'ko' | 'en';
  email: string;
  coins: number;
  userInfo?: UserInfo;
  password?: string;
  history: ReadingResult[];
}
