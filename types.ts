
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
  FACE_UPLOAD = 'FACE_UPLOAD', 
  LIFE_INPUT = 'LIFE_INPUT',
}

export type CategoryKey = 'FANDOM' | 'LOVE' | 'APPEARANCE' | 'CAREER' | 'WEALTH' | 'HEALTH' | 'STUDY' | 'RELATIONSHIP' | 'FACE' | 'LIFE';

export type Language = 'ko' | 'en';

export enum UserTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export interface QuestionCategory {
  id: CategoryKey;
  label: string; 
  icon: string;
  questions: string[]; 
  minTier?: UserTier; 
  cost?: number; 
}

export interface TarotCard {
  id: number;
  name: string;
  isReversed: boolean;
  imagePlaceholder: string; 
  generatedImage?: string; 
  backDesign: number; 
}

export interface ReadingResult {
  date: string; 
  question: string;
  cards: TarotCard[];
  interpretation: string; // Stores Analysis + Advice
  solution?: string; // Stores Practical Solution (Locked)
  secretContent?: string; // Stores 19+ or Life Path content
  type?: 'TAROT' | 'FACE' | 'LIFE'; 
}

export interface UserInfo {
  name: string;
  birthDate: string;
  birthTime?: string; 
  zodiacSign: string;
  country: string; 
  timezone: string;
  profileImage?: string; 
  bio?: string;
  lastNameChange?: string; 
  birthDateChanged?: boolean;
  countryChanged?: boolean;
}

export interface User {
  email: string;
  coins: number;
  totalSpent: number; 
  tier: UserTier;
  userInfo?: UserInfo;
  password?: string;
  history: ReadingResult[];
  
  // Daily Limit Tracking
  lastReadingDate?: string; // ISO Date YYYY-MM-DD
  readingsToday: number;

  // Login Tracking for Demotion Logic
  loginDates: string[]; // List of YYYY-MM-DD strings
  lastLoginDate?: string;

  attendanceDay: number; 
  lastAttendance?: string; 
  
  ownedSkins: string[]; 
  currentSkin: string; 
  
  lastMonthlyReward?: string; 
}

export interface Country {
  code: string;
  nameEn: string;
  nameKo: string;
  timezone: string; 
}

export interface Skin {
  id: string;
  name: string;
  cost: number;
  type: 'BASIC' | 'LUXURY' | 'IDOL';
  cssClass: string; 
}

export interface BGM {
  id: string;
  name: string;
  url: string;
  category: 'NATURE' | 'KPOP_M' | 'KPOP_F' | 'SPOOKY' | 'DEFAULT';
}
