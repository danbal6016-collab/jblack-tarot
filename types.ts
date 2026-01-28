
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
  PARTNER_INPUT = 'PARTNER_INPUT',
  CHAT_ROOM = 'CHAT_ROOM',
}

export type CategoryKey = 'FANDOM' | 'LOVE' | 'APPEARANCE' | 'CAREER' | 'WEALTH' | 'HEALTH' | 'STUDY' | 'RELATIONSHIP' | 'FACE' | 'LIFE' | 'SECRET_COMPAT' | 'PARTNER_LIFE';

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
  
  // Edit Limits
  nameChangeCount: number; // Max 3
  birthDateChanged: boolean; // Max 1
  countryChanged: boolean; // Max 1
}

export interface CustomSkin {
  id: string;
  imageUrl: string;
  isPublic: boolean;
  shareCode?: string; // Only if Public
}

export interface CustomFrame {
  id: string;
  imageUrl: string;
  name: string;
}

// New Interface for session persistence
export interface CurrentSession {
  appState: AppState;
  selectedCategoryId?: CategoryKey; // Store ID to restore object
  selectedQuestion?: string;
  customQuestion?: string;
  selectedCards?: TarotCard[];
  readingResult?: string;
  faceImage?: string;
  birthTime?: { h: string, m: string };
  partnerBirth?: string;
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

  // Attendance
  attendanceDay: number; // 1 to 10
  lastAttendance?: string; // YYYY-MM-DD
  
  // Skins
  ownedSkins: string[]; 
  currentSkin: string; 
  rugColor?: string; // New: Rug Color for Gold+
  
  // Custom Skins (Silver+)
  customSkins?: CustomSkin[];
  activeCustomSkin?: CustomSkin | null;

  // Result Frames
  resultFrame?: string; // 'default', 'gold', 'ornate', or custom ID
  customFrames?: CustomFrame[];

  // Result Customization
  resultBackground?: string;
  customStickers?: string[];

  lastMonthlyReward?: string; 
  monthlyCoinsSpent?: number;
  
  // Persistence
  lastAppState?: AppState; // Saved state to resume
  
  // Active Session Restoration
  currentSession?: CurrentSession; 
}

export interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl?: string;
  text?: string;
  imageUrl?: string;
  timestamp: number;
  tier: UserTier;
  bio?: string; // Added bio field
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
