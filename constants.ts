import { CategoryKey, QuestionCategory, UserTier, Country, BGM, Skin } from './types';

// --- COUNTRIES (Top 50 Selection) ---
export const COUNTRIES: Country[] = [
  { code: 'KR', nameEn: 'South Korea', nameKo: '대한민국', timezone: 'Asia/Seoul' },
  { code: 'US', nameEn: 'United States', nameKo: '미국', timezone: 'America/New_York' },
  { code: 'JP', nameEn: 'Japan', nameKo: '일본', timezone: 'Asia/Tokyo' },
  { code: 'CN', nameEn: 'China', nameKo: '중국', timezone: 'Asia/Shanghai' },
  { code: 'GB', nameEn: 'United Kingdom', nameKo: '영국', timezone: 'Europe/London' },
  { code: 'FR', nameEn: 'France', nameKo: '프랑스', timezone: 'Europe/Paris' },
  { code: 'DE', nameEn: 'Germany', nameKo: '독일', timezone: 'Europe/Berlin' },
  { code: 'CA', nameEn: 'Canada', nameKo: '캐나다', timezone: 'America/Toronto' },
  { code: 'AU', nameEn: 'Australia', nameKo: '호주', timezone: 'Australia/Sydney' },
  { code: 'IT', nameEn: 'Italy', nameKo: '이탈리아', timezone: 'Europe/Rome' },
  { code: 'ES', nameEn: 'Spain', nameKo: '스페인', timezone: 'Europe/Madrid' },
  { code: 'CH', nameEn: 'Switzerland', nameKo: '스위스', timezone: 'Europe/Zurich' },
  { code: 'NL', nameEn: 'Netherlands', nameKo: '네덜란드', timezone: 'Europe/Amsterdam' },
  { code: 'SE', nameEn: 'Sweden', nameKo: '스웨덴', timezone: 'Europe/Stockholm' },
  { code: 'SG', nameEn: 'Singapore', nameKo: '싱가포르', timezone: 'Asia/Singapore' },
  { code: 'HK', nameEn: 'Hong Kong', nameKo: '홍콩', timezone: 'Asia/Hong_Kong' },
  { code: 'TW', nameEn: 'Taiwan', nameKo: '대만', timezone: 'Asia/Taipei' },
  { code: 'IN', nameEn: 'India', nameKo: '인도', timezone: 'Asia/Kolkata' },
  { code: 'BR', nameEn: 'Brazil', nameKo: '브라질', timezone: 'America/Sao_Paulo' },
  { code: 'RU', nameEn: 'Russia', nameKo: '러시아', timezone: 'Europe/Moscow' },
].sort((a, b) => a.nameEn.localeCompare(b.nameEn));

// --- BGM LIST (Reliable Sources) ---
export const BGMS: BGM[] = [
  {
    id: 'dreamy',
    name: 'Dreamy Void',
    category: 'DEFAULT',
    // "Fluidscape"
    url: "https://ia800301.us.archive.org/5/items/Fluidscape/Fluidscape.mp3"
  }
];

// --- SKINS ---
export const SKINS: Skin[] = [
  { id: 'default', name: 'Classic', cost: 0, type: 'BASIC', cssClass: 'design-0' },
  { id: 'lux_1', name: '1', cost: 50, type: 'LUXURY', cssClass: 'design-1' },
  { id: 'lux_2', name: '2', cost: 50, type: 'LUXURY', cssClass: 'design-2' },
  { id: 'lux_3', name: '3', cost: 50, type: 'LUXURY', cssClass: 'design-3' },
  { id: 'idol_1', name: 'K-Idol All Black 1', cost: 150, type: 'IDOL', cssClass: 'design-idol-1' },
  { id: 'idol_2', name: 'K-Idol All Black 2', cost: 150, type: 'IDOL', cssClass: 'design-idol-2' },
];

export const RESULT_FRAMES = [
    { id: 'default', name: 'Void (Default)', css: 'border: none;' },
    { id: 'simple_gold', name: 'Simple Gold', css: 'border: 2px solid #fbbf24; border-radius: 12px; box-shadow: 0 0 15px rgba(251, 191, 36, 0.3);' },
    { id: 'antique_double', name: 'Antique Double', css: 'border: 6px double #b8860b; border-radius: 4px;' },
    { id: 'gothic_frame', name: 'Gothic Ornament', css: 'border: 20px solid transparent; border-image: url("https://img.freepik.com/free-vector/vintage-ornamental-frame-design_53876-115822.jpg?w=740&t=st=1708840000~exp=1708840600~hmac=fake") 30 round;' },
    { id: 'neon_cyber', name: 'Neon Cyber', css: 'border: 2px solid #00f0ff; box-shadow: 0 0 10px #00f0ff, 0 0 20px #00f0ff, inset 0 0 10px #00f0ff; border-radius: 2px;' },
    { id: 'mystic_gradient', name: 'Mystic Gradient', css: 'border: 4px solid transparent; border-image: linear-gradient(45deg, #7c3aed, #db2777, #fbbf24) 1; box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);' },
    { id: 'ethereal_glow', name: 'Ethereal Glow', css: 'border: 1px solid rgba(255,255,255,0.6); box-shadow: 0 0 30px rgba(255,255,255,0.3), inset 0 0 30px rgba(255,255,255,0.1); border-radius: 20px; backdrop-filter: blur(5px);' },
    { id: 'blood_ruby', name: 'Blood Ruby', css: 'border: 4px ridge #7f1d1d; box-shadow: 0 0 15px #ef4444; border-radius: 2px; background: linear-gradient(to bottom, rgba(50,0,0,0.5), transparent);' },
    { id: 'starry_night', name: 'Starry Night', css: 'border: 3px dashed #fbbf24; border-radius: 15px; box-shadow: 0 0 10px #fbbf24; background-image: radial-gradient(white 1px, transparent 1px); background-size: 20px 20px;' }
];

export const RESULT_BACKGROUNDS = [
    { id: 'default', name: 'Mystic Void', css: 'radial-gradient(circle at center, #2e1065 0%, #000000 100%)' },
    { id: 'midnight_fog', name: 'Midnight Fog', css: 'linear-gradient(to bottom, #0f172a, #000000)' },
    { id: 'crimson_tide', name: 'Crimson Tide', css: 'linear-gradient(45deg, #450a0a, #000000)' },
    { id: 'emerald_abyss', name: 'Emerald Abyss', css: 'radial-gradient(circle at top right, #064e3b, #000000)' },
    { id: 'royal_gold', name: 'Royal Gold', css: 'linear-gradient(to bottom right, #422006, #000000)' },
];

export const DEFAULT_STICKERS = [
    "✨", "🌙", "🔮", "🦋", "🕯️", "🥀", "💀", "🗝️"
];

// Updated Thresholds (Coins Spent)
export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 400,
  GOLD: 1500,
  PLATINUM: 4000
};

// 10 Day Attendance: Day 1 & 10 = 50, others 20
export const ATTENDANCE_REWARDS = [50, 20, 20, 20, 20, 20, 20, 20, 20, 50];
export const CATEGORIES: QuestionCategory[] = [
  { id: 'FANDOM', label: '덕질', icon: '✨', questions: [] },
  { id: 'LOVE', label: '연애', icon: '🌹', questions: [] },
  { id: 'APPEARANCE', label: '외모', icon: '💄', questions: [] },
  { id: 'CAREER', label: '진로', icon: '🔮', questions: [] },
  { id: 'WEALTH', label: '금전', icon: '💰', questions: [] },
  { id: 'HEALTH', label: '건강', icon: '🌿', questions: [] },
  { id: 'STUDY', label: '학업', icon: '📚', questions: [] },
  { id: 'RELATIONSHIP', label: '대인관계', icon: '🤝', questions: [] },
  { id: 'FACE', label: '관상', icon: '👁️', questions: [], cost: 200 },
  { id: 'LIFE', label: '인생', icon: '🧬', questions: [], cost: 200 },
  { id: 'SECRET_COMPAT', label: '수위', icon: '🔞', questions: [], cost: 200 },
  { id: 'PARTNER_LIFE', label: '연예인', icon: '👥', questions: [], cost: 200 }
];
export const CATEGORY_TRANSLATIONS: any = {
  ko: {
    LOVE: { label: "연애운", questions: ["그 사람의 속마음은?", "우리는 사귈 수 있을까?", "재회 가능성이 있을까?"] },
    MONEY: { label: "재물운", questions: ["금전운이 좋아질까?", "투자해도 될까?", "언제 돈이 들어올까?"] },
    WORK: { label: "직업/사업", questions: ["이직해도 될까?", "승진할 수 있을까?", "사업이 번창할까?"] },
    DAILY: { label: "오늘의 운세", questions: ["오늘 하루는 어떨까?", "주의해야 할 점은?", "오늘의 행운은?"] },
    FACE: { label: "관상", questions: [] },
    LIFE: { label: "인생", questions: [] },
    SECRET_COMPAT: { label: "은밀한 궁합", questions: [] },
    PARTNER_LIFE: { label: "그 사람의 인생", questions: [] }
  },
  en: {
    LOVE: { label: "Love", questions: ["What are their thoughts?", "Will we date?", "Possible reunion?"] },
    MONEY: { label: "Wealth", questions: ["Will I get rich?", "Should I invest?", "When money comes?"] },
    WORK: { label: "Career", questions: ["Should I quit?", "Will I be promoted?", "Business luck?"] },
    DAILY: { label: "Today", questions: ["How is my day?", "What to avoid?", "Today's luck?"] },
    FACE: { label: "Physiognomy", questions: [] },
    LIFE: { label: "Life Path", questions: [] },
    SECRET_COMPAT: { label: "Secret Compat", questions: [] },
    PARTNER_LIFE: { label: "Their Life", questions: [] }
  },
  zh: {
    LOVE: { label: "爱情", questions: ["他的真心是什么？", "我们会交往吗？", "复合的可能性？"] },
    MONEY: { label: "财运", questions: ["财运会变好吗？", "可以投资吗？", "什么时候进财？"] },
    WORK: { label: "事业", questions: ["可以换工作吗？", "能升职吗？", "事业会繁荣吗？"] },
    DAILY: { label: "今日运势", questions: ["今天过得怎么样？", "需要注意什么？", "今日幸运？"] },
    FACE: { label: "面상", questions: [] },
    LIFE: { label: "人生", questions: [] },
    SECRET_COMPAT: { label: "隐秘契合度", questions: [] },
    PARTNER_LIFE: { label: "他的人生", questions: [] }
  }
};

export const TAROT_DECK = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", 
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit", 
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", 
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", 
  "Judgement", "The World",
  "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands", 
  "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands", 
  "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
  "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups", 
  "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups", 
  "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
  "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords", 
  "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords", 
  "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
  "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles", "Five of Pentacles", 
  "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles", "Nine of Pentacles", "Ten of Pentacles", 
  "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles"
];

export const TIER_POPUP_TEXT = {
  ko: {
    up_title: "등급 상승!",
    down_title: "등급 하락",
    up_msg: "축하합니다! 새로운 등급으로 승급하셨습니다.",
    down_msg: "아쉽게도 등급이 하락했습니다. 활동을 늘려 다시 도전하세요!",
    benefit_silver: "매달 1일 보유 코인 1.5배 지급",
    benefit_gold: "매달 1일 보유 코인 2.0배 지급",
    benefit_platinum: "매달 1일 보유 코인 3.0배 지급",
    confirm: "확인"
  },
  en: {
    up_title: "Tier Up!",
    down_title: "Tier Down",
    up_msg: "Congratulations! You have been promoted.",
    down_msg: "Unfortunately, your tier has dropped. Keep active to regain it!",
    benefit_silver: "1.5x Coins on 1st of every month",
    benefit_gold: "2.0x Coins on 1st of every month",
    benefit_platinum: "3.0x Coins on 1st of every month",
    confirm: "Confirm"
  },
  zh: {
    up_title: "等级提升！",
    down_title: "等级下降",
    up_msg: "恭喜！您已晋升到新等级。",
    down_msg: "很遗憾，您的等级下降了。增加活动量再次挑战吧！",
    benefit_silver: "每月1日发放1.5倍持有金币",
    benefit_gold: "每月1日发放2.0倍持有金币",
    benefit_platinum: "每月1日发放3.0倍持有金币",
    confirm: "确认"
  }
};

export const RK_COLORS = [
    { name: 'Void Purple', color: '#2e0b49' },
    { name: 'Crimson Red', color: '#450a0a' },
    { name: 'Midnight Blue', color: '#0f172a' },
    { name: 'Deep Forest', color: '#064e3b' },
    { name: 'Royal Gold', color: '#422006' },
    { name: 'Pitch Black', color: '#000000' }
];
