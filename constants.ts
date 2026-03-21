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

export const CATEGORY_TRANSLATIONS: Record<string, { [key in CategoryKey]?: { label: string, questions: string[] } }> = {
  ko: {
    FANDOM: { label: '덕질', questions: ['최애는 나를 어떻게 생각하는가?', '최애와 만날 확률이 가장 높은 장소는 어디인가?', '최애의 취향은 무엇인가?', '최애는 지금 누구와 교제 중인가?', '내가 탈덕을 한다면 이유가 무엇일까?', '최애와 나의 관계는 어떤가?', '최애와 나의 궁합은 어떤가?', '이 덕질은 언제까지 유지될까?', '내 최애의 병크는 무엇인가?', '최애와 진짜 사귈 수 있을까?', '아무도 모르는 내 최애의 숨겨진 모습은 무엇인가?'] },
    LOVE: { label: '연애', questions: ['나의 다음 연애는 언제쯤 시작되는가?', '나의 미래 배우자는 어떤 사람인가?', '그 새끼에게 가장 크게 복수하는 법은 무엇인가?', '지금 만나고 있는 이 사람과의 끝은 어떻게 될까?', '나를 짝사랑하고 있는 사람은 누구인가?', '그 사람은 나에게 먼저 연락을 하게 되는가?', '이성에게 가장 호감을 사는 나의 매력 포인트는 무엇인가?', '그 사람은 나를 어떻게 생각하는가?', '그 사람과 나의 연인 발전 가능성은 어느 정도인가?', '지금 관계를 발전시키기 위해 내가 해야 할 행동은 무엇인가?', '현재 그 관계의 가장 큰 문제점은 무엇인가?', '상대는 나에게 무엇을 숨기고 있는가?', '그 관계의 미래는 어떻게 되는가?', '미래에 내가 만나게 될 이성은 어떤 스타일인가?', '내 연애 흐름은 어떻게 되는가?'] },
    APPEARANCE: { label: '외모', questions: ['나에게 가장 효과 좋은 다이어트 방법은 무엇인가?', '성형을 한다면 어디를 하는 게 좋은가?', '나만의 독보적 분위기는 무엇인가?', '나에겐 어떤 스타일링이 가장 잘 어울리는가?', '나의 외모는 주로 사람들에게 어떤 인상을 주는가?'] },
    CAREER: { label: '진로', questions: ['내가 미래에서 가장 성공하는 법은 무엇인가?', '내 업계 사람들은 나에 대해 뭐라고 생각하는가?', '나에게 숨겨진 잠재력은 무엇일까?', '어떤 종류의 길을 택해야 내 삶의 만족도가 높아지는가?', '내가 내 커리어에서 겪을 수 있는 큰 어려움은?', '내가 내 커리어 성취를 위해 지금 당장 시작해야 할 일은 무엇인가?'] },
    WEALTH: { label: '금전', questions: ['나의 금전복을 확 향상시키는 방법은 무엇인가?', '나의 금전운이 특별히 높아지는 시기는 언제인가?', '현재 재정 상태를 개선하려면 어떻게 해야 하는가?', '내가 새로 시작하려는 일은 금전적으로 어떤 영향을 불러일으킬까?', '어떤 방식이 나에게 가장 큰 돈이 되는가?', '1년 후 나의 재정 상황은 어떻게 되는가?', '나의 타고난 금전복은 어느 정도인가?'] },
    HEALTH: { label: '건강', questions: ['나를 죽게 할 병은 무엇인가?', '나의 건강을 개선하기 위해서 무엇을 해야 하는가?', '내가 가질 수 있는 잠재적 질병은 무엇인가?', '어떤 식의 건강 관리가 나에게 필요한가?'] },
    STUDY: { label: '학업', questions: ['나는 어떤 종류의 대학에 가게 되는가?', '지금 공부 방식이 나에게 가장 효율적인가?', '현재 나의 학업 상태는 어떠한가?', '앞으로 나의 학업적 성취의 흐름은 어떻게 흘러갈까?', '내 학업에 가장 크게 방해가 되는 요소는 무엇인가?'] },
    RELATIONSHIP: { label: '대인관계', questions: ['이 관계에서 내가 무의식적으로 원하는 것은 무엇인가?', '상대는 지금 이 관계를 어떻게 느끼는가?', '상대가 나에게 숨기고 있는 것은 무엇인까?', '상대방이 이 관계에서 바라고 있는 것은 무엇인가?', '이 관계가 발전하려면 무엇이 필요한가?', '이 관계는 나에게 어떤 영향을 끼칠까?'] },
    FACE: { label: '관상', questions: [] }, LIFE: { label: '인생', questions: [] }, SECRET_COMPAT: { label: '수위', questions: [] }, PARTNER_LIFE: { label: '연예인', questions: [] }
  },
  en: {
    FANDOM: { label: 'Fandom', questions: ['What does my favorite think of me, realistically speaking?', 'Where am I statistically most likely to run into my favorite?', 'What kind of person is my favorite into, hypothetically speaking?', 'Is my favorite currently seeing someone, or is the situation… open?', 'If I were to lose interest, what would be the most likely reason?', 'What exactly is the nature of the relationship between my favorite and me?', 'How compatible are my favorite and I, in theory?', 'How long is this level of dedication likely to last?', 'What is the most questionable or controversial aspect of my favorite?', 'Is there any realistic scenario where I could actually date my favorite?', 'What is a hidden side of my favorite that most people don’t notice?'] },
    LOVE: { label: 'Love', questions: ['When is my next relationship likely to begin, approximately?', 'What kind of person is my future partner, theoretically speaking?', 'What would be the most effective way to get back at that person, in a composed manner?', 'How is my current relationship most likely to turn out?', 'Is there someone who secretly has feelings for me, and if so, who might it be?', 'Is that person likely to reach out to me first?', 'What is my most appealing trait to potential romantic interests?', 'How does that person perceive me, objectively speaking?', 'What are the chances of this developing into a relationship?', 'What actions should I take to move this relationship forward?', 'What is the biggest issue in this relationship right now?', 'Is there anything that person might be keeping from me?', 'What does the future of this relationship look like?', 'What kind of person am I likely to meet in the future?', 'How is my overall romantic trajectory likely to unfold?'] },
    APPEARANCE: { label: 'Appearance', questions: ['What diet method would be most effective for me, realistically?', 'If I were to consider cosmetic procedures, which areas would be most suitable to focus on?', 'What is the unique vibe or presence that sets me apart?', 'What kind of styling suits me best?', 'What kind of impression does my appearance usually give to others?'] },
    CAREER: { label: 'Career', questions: ['What is the most effective path for me to succeed in the future?', 'How am I generally perceived by people in my field?', 'What hidden potential do I have that I may not fully realize yet?', 'What kind of path would lead to the highest level of satisfaction in my life?', 'What major challenges am I likely to face in my career?', 'What should I start doing right now to move toward my career goals?'] },
    WEALTH: { label: 'Wealth', questions: ['What is the most effective way for me to significantly improve my financial luck?', 'When is my financial luck likely to peak?', 'What steps should I take to improve my current financial situation?', 'What kind of financial impact will my new venture likely bring?', 'What approach is most likely to generate the highest income for me?', 'What is my financial situation likely to look like in a year?', 'To what extent do I naturally have financial luck?'] },
    HEALTH: { label: 'Health', questions: ['What are the major health risks I should be mindful of?', 'What should I do to improve my overall health?', 'What potential health conditions should I be aware of?', 'What kind of health management approach would suit me best?'] },
    STUDY: { label: 'Study', questions: ['What type of university am I most likely to attend?', 'Is my current study method the most effective for me?', 'How would my current academic standing be assessed?', 'How is my academic progress likely to develop moving forward?', 'What is the biggest factor currently hindering my academic performance?'] },
    RELATIONSHIP: { label: 'Relationship', questions: ['What might I be subconsciously seeking in this relationship?', 'How does the other person currently feel about this relationship?', 'Is there anything the other person may be keeping from me?', 'What is the other person hoping for in this relationship?', 'What is needed for this relationship to move forward?', 'What kind of impact is this relationship likely to have on me?'] },
    FACE: { label: 'Face', questions: [] }, LIFE: { label: 'Life', questions: [] }, SECRET_COMPAT: { label: '19+', questions: [] }, PARTNER_LIFE: { label: 'Celeb', questions: [] }
  },
  zh: {
    FANDOM: { label: '粉丝', questions: ['我喜欢的人对我到底是怎么想的，现实一点来说？', '从概率来看，我最有可能在哪里遇见我喜欢的人？', '从客观角度来看，我喜欢的人偏好的类型是什么？', '我喜欢的人现在是在和谁交往，还是处于“开放状态”？', '如果我有一天不再喜欢了，最可能的原因是什么？', '我喜欢的人和我之间的关系，本质上算是什么？', '从理论上来看，我和我喜欢的人契合度如何？', '这种投入程度大概还能持续多久？', '我喜欢的人有没有什么比较“微妙”或争议的地方？', '从现实角度来看，我有可能真的和我喜欢的人交往吗？', '我喜欢的人有没有什么大多数人没注意到的隐藏一面？'] },
    LOVE: { label: '爱', questions: ['我的下一段恋情大概会在什么时候开始？', '从理论上来说，我未来的伴侣会是什么样的人？', '用比较体面的方式来说，如何才能最有效地“反击”那个人？', '我现在这段关系最有可能会以什么样的方式结束？', '是否有人在暗恋我？如果有，大概会是谁？', '那个人会不会主动联系我？', '在异性眼中，我最有吸引力的点是什么？', '从客观角度来看，那个人是如何看待我的？', '我们发展成恋人的可能性大概有多大？', '为了让这段关系更进一步，我应该采取什么行动？', '目前这段关系中最大的问题是什么？', '那个人有没有什么在对我隐瞒？', '这段关系的未来会如何发展？', '未来我可能会遇到什么类型的人？', '我的整体感情发展趋势会是怎样的？'] },
    APPEARANCE: { label: '长相', questions: ['从现实角度来看，最适合我的减肥方法是什么？', '如果考虑进行外貌调整，哪些部位更适合优化？', '我独特的气质或氛围是什么？', '什么样的风格最适合我？', '我的外表通常会给别人留下什么样的印象？'] },
    CAREER: { label: '事业', questions: ['从长远来看，我最有可能成功的路径是什么？', '我在行业内通常是被如何评价的？', '我有哪些自己还未完全意识到的潜在能力？', '选择哪种方向会让我获得更高的人生满足感？', '在职业发展中，我可能会遇到的主要困难是什么？', '为了实现职业目标，我现在最应该开始做的事情是什么？'] },
    WEALTH: { label: '财运', questions: ['对我来说，提升财运最有效的方法是什么？', '我的财运在哪个时期最容易达到高点？', '我该如何改善目前的财务状况？', '我即将开始的新事情，在财务上可能会带来怎样的影响？', '对我来说，哪种方式最有可能带来最大收益？', '一年之后，我的财务状况可能会如何？', '从天赋角度来看，我的财运大概处于什么水平？'] },
    HEALTH: { label: '健康', questions: ['我需要特别注意的主要健康风险有哪些？', '我应该做些什么来改善整体健康状况？', '我可能需要关注的潜在健康问题有哪些？', '什么样的健康管理方式最适合我？'] },
    STUDY: { label: '学习', questions: ['我最有可能进入哪一类型的大学？', '我现在的学习方式对我来说是最有效的吗？', '我目前的学业状态大致如何？', '未来我的学业发展趋势会如何？', '目前最影响我学业表现的主要因素是什么？'] },
    RELATIONSHIP: { label: '关系', questions: ['在这段关系中，我潜意识里真正想要的是什么？', '对方现在是如何看待这段关系的？', '对方是否对我有所隐瞒？', '对方在这段关系中期待的是什么？', '这段关系要进一步发展，需要什么？', '这段关系可能会对我产生什么影响？'] },
    FACE: { label: '面相', questions: [] }, LIFE: { label: '人生', questions: [] }, SECRET_COMPAT: { label: '隐秘契合度', questions: [] }, PARTNER_LIFE: { label: '八字', questions: [] }
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
