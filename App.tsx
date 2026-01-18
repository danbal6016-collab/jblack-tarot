
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "./src/lib/supabase";
import { GoogleContinueButton } from "./components/AuthModal";
import { AppState, CategoryKey, TarotCard, QuestionCategory, User, UserInfo, Language, ReadingResult, UserTier, Country, BGM, Skin } from './types';
import { CATEGORIES, TAROT_DECK, COUNTRIES, BGMS, SKINS, TIER_THRESHOLDS, ATTENDANCE_REWARDS } from './constants';
import Background from './components/Background';
import Logo from './components/Logo';
import AudioPlayer from './components/AudioPlayer';
import { getTarotReading, generateTarotImage, getFallbackTarotImage, getFaceReading, getLifeReading, getCompatibilityReading, getPartnerLifeReading } from './services/geminiService';
import { playSound, playShuffleLoop, stopShuffleLoop, initSounds } from './services/soundService';
import html2canvas from 'html2canvas';

// ---------------------------------------------------------------------------
// CONFIG & TRANSLATIONS
// ---------------------------------------------------------------------------
const TRANSLATIONS = {
  ko: {
    welcome_sub: "Cards don't lie.",
    enter: "운명의 문 열기",
    info_title: "운명을 마주할 준비",
    info_desc: "정확한 타로 리딩을 위해 정보를 입력해주세요.",
    name_label: "이름 (Name)",
    name_ph: "이름",
    birth_label: "생년월일 (Birthdate)",
    birth_ph: "YYYYMMDD",
    country_ph: "국가 선택 (Country)",
    select_cat_title: "오늘의 타로를 선택하세요.",
    shuffling: "운명을 섞는 중...",
    select_cards_title: "당신의 운명을 선택하세요",
    result_question: "질문",
    share: "결과 저장 & 공유", 
    settings_title: "설정",
    bgm_control: "배경음악 설정",
    language_control: "언어 (Language)",
    tier_info: "나의 등급",
    attendance: "출석체크",
    skin_shop: "카드 스킨",
    profile_edit: "프로필 수정",
    logout: "로그아웃",
    delete_account: "계정 탈퇴",
    delete_confirm: "모든 데이터가 삭제됩니다. 진행하시겠습니까?",
    attendance_popup: "출석체크 완료!",
    reward_popup: "등급 보상 지급!",
    face_reading_title: "관상",
    face_reading_desc: "연락 할까 말까 고민하는 시간도 아까워요. 그 사람이 당신이 찾던 그 이인지, 지금 확인해 보세요.",
    face_upload_btn: "관상 보기 (-100 Coin)",
    face_guide: "인물의 얼굴이 잘 보이는 사진을 업로드 하세요.",
    life_reading_title: "인생",
    life_reading_desc: "당신이 언제, 무엇으로 떼돈을 벌까요? 당신의 숨겨진 재능과 황금기, 미래 배우자까지 확인하세요.",
    life_input_btn: "인생 치트키 확인 (-150 Coin)",
    life_guide: "당신의 생시를 알려주세요.",
    downloading: "초고속 저장 중...",
    time_label: "태어난 시간",
    tier_benefit_silver: "매달 1일 보유 코인 1.5배",
    tier_benefit_gold: "매달 1일 보유 코인 2.0배",
    tier_benefit_platinum: "매달 1일 보유 코인 3.0배",
    no_benefit: "혜택 없음",
    guest_exhausted: "게스트 횟수가 소진되었습니다.",
    coin_shortage: "코인이 부족합니다.",
    shop_title: "블랙코인 상점",
    shop_subtitle: "마음 속 고민의 운명적인 해답을 찾아 보세요.",
    shop_pkg_1: "4,900원 / 60 Coins",
    shop_pkg_2: "7,900원 / 110 Coins",
    shop_pkg_3: "15,500원 / 220 Coins",
    next: "다음",
    custom_q_ph: "구체적인 고민을 입력해 주세요.",
    history: "타로 히스토리",
    no_history: "기록이 없습니다.",
    limit_reached: "오늘의 리딩 횟수를 모두 소진했습니다.",
    solution_lock: "실질적인 해결책 보기 (Gold+)",
    secret_compat: "당신과 그 사람의 은밀한 궁합 (-150 Coin)",
    partner_life: "그 사람의 타고난 인생 팔자 (-120 Coin)",
    partner_birth_ph: "그 사람의 생년월일 (YYYYMMDD)",
    pay_title: "결제 수단 선택",
    pay_cancel: "취소",
    pay_confirm: "결제하기",
    guest_lock_msg: "계속하려면 로그인이 필요합니다.",
    guest_lock_btn: "로그인 하러 가기",
    secret_compat_title: "은밀한 궁합",
    secret_compat_desc: "당신과 그 사람의 속궁합, 그리고 숨겨진 욕망.",
    secret_compat_btn: "궁합 확인 (-150 Coin)",
    partner_life_title: "그 사람의 인생",
    partner_life_desc: "그 사람의 타고난 인생 팔자를 비밀리에 들춰 보세요.",
    partner_life_btn: "인생 훔쳐보기 (-120 Coin)",
    bronze_shop_lock: "브론즈 등급은 스킨을 구매할 수 없습니다."
  },
  en: {
    welcome_sub: "Cards don't lie.",
    enter: "Enter the Void",
    info_title: "Prepare for Fate",
    info_desc: "Enter details for accuracy.",
    name_label: "Name",
    name_ph: "Name",
    birth_label: "Birthdate",
    birth_ph: "YYYYMMDD",
    country_ph: "Select Country",
    select_cat_title: "Select Theme",
    shuffling: "Shuffling...",
    select_cards_title: "Select Your Fate",
    result_question: "Question",
    share: "Save & Share", 
    settings_title: "Settings",
    bgm_control: "BGM",
    language_control: "Language",
    tier_info: "My Tier",
    attendance: "Attendance",
    skin_shop: "Card Skins",
    profile_edit: "Edit Profile",
    logout: "Logout",
    delete_account: "Delete Account",
    delete_confirm: "All data will be wiped. Proceed?",
    attendance_popup: "Attendance Checked!",
    reward_popup: "Monthly Reward!",
    face_reading_title: "Physiognomy",
    face_reading_desc: "Stop wasting time guessing. Check if they are the one.",
    face_upload_btn: "Analyze Face (-100 Coin)",
    face_guide: "Upload a clear photo of the face.",
    life_reading_title: "Life Path",
    life_reading_desc: "When will you make a fortune? Hidden talents, golden age, future spouse.",
    life_input_btn: "Reveal Cheat Codes (-150 Coin)",
    life_guide: "Enter your birth time.",
    downloading: "Saving Fast...",
    time_label: "Birth Time",
    tier_benefit_silver: "1.5x Coins monthly",
    tier_benefit_gold: "2.0x Coins monthly",
    tier_benefit_platinum: "3.0x Coins monthly",
    no_benefit: "No benefits",
    guest_exhausted: "Guest limit reached.",
    coin_shortage: "Not enough coins.",
    shop_title: "Black Coin Shop",
    shop_subtitle: "Find the fateful answer to your heart's trouble.",
    shop_pkg_1: "₩4,900 / 60 Coins",
    shop_pkg_2: "₩7,900 / 110 Coins",
    shop_pkg_3: "₩15,500 / 220 Coins",
    next: "Next",
    custom_q_ph: "Enter your specific concern here.",
    history: "Reading History",
    no_history: "No records found.",
    limit_reached: "Daily reading limit reached.",
    solution_lock: "Unlock Practical Solution (Gold+)",
    secret_compat: "Secret Compatibility (-150 Coin)",
    partner_life: "Partner's Life Path (-120 Coin)",
    partner_birth_ph: "Partner Birthdate (YYYYMMDD)",
    pay_title: "Select Payment Method",
    pay_cancel: "Cancel",
    pay_confirm: "Pay Now",
    guest_lock_msg: "Login required to continue.",
    guest_lock_btn: "Go to Login",
    secret_compat_title: "Secret Compat",
    secret_compat_desc: "Inner desires and physical chemistry.",
    secret_compat_btn: "Check Compat (-150 Coin)",
    partner_life_title: "Their Life",
    partner_life_desc: "Secretly reveal their true destiny.",
    partner_life_btn: "Spy on Life (-120 Coin)",
    bronze_shop_lock: "Bronze tier cannot purchase skins."
  }
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const getDeviceId = () => {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('device_id', id);
  }
  return id;
};

const calculateTier = (spent: number): UserTier => {
  if (spent >= TIER_THRESHOLDS.PLATINUM) return UserTier.PLATINUM;
  if (spent >= TIER_THRESHOLDS.GOLD) return UserTier.GOLD;
  if (spent >= TIER_THRESHOLDS.SILVER) return UserTier.SILVER;
  return UserTier.BRONZE;
};

// ---------------------------------------------------------------------------
// COMPONENTS
// ---------------------------------------------------------------------------

const GoldCoinIcon: React.FC<{ sizeClass?: string }> = ({ sizeClass = "w-6 h-6" }) => (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_15px_rgba(234,179,8,0.8)] border border-yellow-100 flex items-center justify-center relative overflow-hidden shrink-0`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),transparent)] opacity-70"></div>
        <span className="text-yellow-900 font-bold text-[8px] md:text-[10px] z-10">$</span>
    </div>
);

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
    const [visibleCount, setVisibleCount] = useState(0);
    useEffect(() => {
        setVisibleCount(0);
        // Speed slowed down to 35ms per request
        const timer = setInterval(() => setVisibleCount(p => p < text.length ? p + 1 : p), 35); 
        return () => clearInterval(timer);
    }, [text]);
    return (
        <div className="whitespace-pre-line leading-relaxed font-sans text-gray-200">
            {text.substring(0, visibleCount)}
        </div>
    );
};

const Header: React.FC<{ 
    user: User; 
    lang: Language; 
    onOpenSettings: () => void; 
    onOpenShop: () => void;
    onLogin: () => void;
    openProfile: () => void;
}> = ({ user, lang, onOpenSettings, onOpenShop, onLogin, openProfile }) => (
  <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/95 to-transparent pointer-events-none transition-all">
    <div className="flex items-center gap-2 pointer-events-auto">
      {user.email !== 'Guest' && (
          <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-full border border-yellow-600/30 backdrop-blur-md shadow-lg animate-fade-in cursor-pointer hover:bg-black/80" onClick={openProfile}>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  user.tier === UserTier.PLATINUM ? 'bg-purple-500 text-white' :
                  user.tier === UserTier.GOLD ? 'bg-yellow-500 text-black' :
                  user.tier === UserTier.SILVER ? 'bg-gray-400 text-black' : 'bg-stone-700 text-gray-300'
              }`}>{user.tier}</span>
              <div className="flex items-center gap-2">
                 <GoldCoinIcon />
                 <span className="text-yellow-100 font-mono font-bold text-lg">{user.coins.toLocaleString()}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onOpenShop(); }}
                className="w-6 h-6 flex items-center justify-center bg-yellow-700 hover:bg-yellow-500 rounded-full text-white text-xs font-extrabold border border-yellow-300 shadow-[0_0_8px_gold] transition-all hover:scale-110 active:scale-95"
              >
                  +
              </button>
              <span className="text-gray-400 text-xs md:text-sm font-sans border-l border-gray-600 pl-3 ml-1 hidden sm:inline">{user.userInfo?.name || user.email}</span>
          </div>
      )}
    </div>
    <div className="flex items-center gap-4 pointer-events-auto">
      <button 
        onClick={onOpenSettings}
        className="text-gray-400 hover:text-purple-400 transition-colors p-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// VIEW COMPONENTS
// ---------------------------------------------------------------------------

const UserInfoForm: React.FC<{ onSubmit: (info: UserInfo) => void; lang: Language }> = ({ onSubmit, lang }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);

  const handleSubmit = () => {
    if (!name || birthDate.length < 8) return alert("Please check inputs");
    onSubmit({
      name,
      birthDate,
      country: country.nameEn,
      timezone: country.timezone,
      zodiacSign: 'Unknown',
      nameChangeCount: 0,
      birthDateChanged: false,
      countryChanged: false
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <input 
        value={name} onChange={e=>setName(e.target.value)} 
        placeholder={TRANSLATIONS[lang].name_ph}
        className="p-3 bg-gray-800 rounded text-white border border-gray-700 focus:border-purple-500 outline-none"
      />
      <input 
        value={birthDate} onChange={e=>setBirthDate(e.target.value)} 
        placeholder={TRANSLATIONS[lang].birth_ph}
        className="p-3 bg-gray-800 rounded text-white border border-gray-700 focus:border-purple-500 outline-none"
      />
      <select 
         value={country.code} onChange={e => setCountry(COUNTRIES.find(c=>c.code===e.target.value)||COUNTRIES[0])}
         className="p-3 bg-gray-800 rounded text-white border border-gray-700 focus:border-purple-500 outline-none"
      >
        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{lang==='ko'?c.nameKo:c.nameEn}</option>)}
      </select>
      <button onClick={handleSubmit} className="p-4 bg-[#3b0764] hover:bg-[#581c87] rounded font-bold text-white transition-all hover:scale-[1.02] shadow-[0_4px_10px_rgba(59,7,100,0.5)]">
        {TRANSLATIONS[lang].next}
      </button>
    </div>
  );
};

const ShufflingAnimation: React.FC<{ onComplete: () => void; lang: Language; skin: string }> = ({ onComplete, lang, skin }) => {
  useEffect(() => {
    playSound('SWOOSH');
    playShuffleLoop();
    const t = setTimeout(() => {
      stopShuffleLoop();
      onComplete();
    }, 5000); 
    return () => {
      stopShuffleLoop();
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md">
       <div className="absolute w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] bg-[#2e0b49] rounded-full border-4 border-yellow-600/50 shadow-[0_0_80px_rgba(76,29,149,0.5)] flex items-center justify-center overflow-hidden rug-texture">
          <div className="absolute w-[80%] h-[80%] border-2 border-dashed border-yellow-600/30 rounded-full animate-spin-slow"></div>
       </div>

      <div className={`relative w-40 h-64 ${SKINS.find(s=>s.id===skin)?.cssClass}`}>
        {Array.from({length: 60}).map((_, i) => {
            const isLeft = i % 2 === 0;
            return (
                 <div key={i} className={`absolute inset-0 rounded-xl bg-gradient-to-br from-[#2e1065] to-blackZQ border border-[#fbbf24]/30 shadow-2xl card-back ${isLeft ? 'shuffle-card-left' : 'shuffle-card-right'}`} 
                      style={{
                          zIndex: i,
                          animation: `wash${(i % 5) + 1} ${2 + (i % 4) * 0.4}s ease-in-out infinite ${i * 0.05}s alternate`,
                          transformOrigin: 'center center'
                      }}>
                 </div>
            )
        })}
      </div>
      <p className="mt-12 text-xl font-occult text-purple-200 animate-pulse tracking-[0.2em] z-[60] bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">{TRANSLATIONS[lang].shuffling}</p>
    </div>
  );
};

const CardSelection: React.FC<{ onSelectCards: (indices: number[]) => void; lang: Language; skin: string }> = ({ onSelectCards, lang, skin }) => {
  const [selected, setSelected] = useState<number[]>([]);
  
  const handleSelect = (i: number) => {
    if (selected.includes(i)) return;
    playSound('SELECT');
    const newSel = [...selected, i];
    setSelected(newSel);
    if (newSel.length === 3) {
      setTimeout(() => onSelectCards(newSel), 500);
    }
  };

  return (
    <div className={`min-h-screen pt-24 pb-12 px-2 flex flex-col items-center z-10 relative overflow-y-auto touch-manipulation ${SKINS.find(s=>s.id===skin)?.cssClass}`}>
      <h2 className="text-2xl text-purple-100 mb-8 font-occult drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] sticky top-0 bg-black/80 py-4 w-full text-center z-20 backdrop-blur-md">{TRANSLATIONS[lang].select_cards_title}</h2>
      <div className="flex flex-wrap justify-center gap-1.5 max-w-7xl px-2 pb-20 perspective-1000">
        {TAROT_DECK.map((_, i) => (
          <div 
            key={i} 
            onClick={() => handleSelect(i)}
            className={`
              w-14 h-24 sm:w-16 sm:h-28 md:w-20 md:h-32 rounded-lg transition-all duration-300 cursor-pointer shadow-lg transform-style-3d
              ${selected.includes(i) 
                ? 'ring-2 ring-purple-400 -translate-y-6 z-30 shadow-[0_0_20px_#a855f7] brightness-125' 
                : 'hover:-translate-y-2 hover:shadow-[0_0_15px_rgba(139,92,246,0.6)] brightness-75 hover:brightness-100 active:scale-95'}
            `}
          >
             <div className="w-full h-full rounded-lg card-back"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResultView: React.FC<{
  question: string;
  selectedCards: TarotCard[];
  isLoggedIn: boolean;
  onRetry: () => void;
  userInfo: UserInfo | null;
  lang: Language;
  readingPromise: Promise<string> | null;
  onReadingComplete: (text: string) => void;
  user: User;
  spendCoins: (amount: number) => boolean;
}> = ({ question, selectedCards, onRetry, lang, readingPromise, onReadingComplete, user, spendCoins }) => {
  const [fullText, setFullText] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  const [solutionText, setSolutionText] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<boolean[]>([false,false,false]);
  const [isSolutionUnlocked, setIsSolutionUnlocked] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(readingPromise) {
      readingPromise.then(t => {
        setFullText(t);
        
        // PARSE THE RESPONSE to separate Analysis and Solution
        const parts = t.split('[실질적인 해결책]');
        setAnalysisText(parts[0]);
        if(parts.length > 1) {
            setSolutionText('[실질적인 해결책]' + parts[1]);
        } else {
            setSolutionText(""); // Should typically allow retry if format failed, but keeping simple
        }

        setLoading(false);
        onReadingComplete(t);
      }).catch(e => {
        setAnalysisText("Error: " + e.message);
        setLoading(false);
      });
    }
  }, [readingPromise]);

  const toggleReveal = (i: number) => {
    if(!revealed[i]) {
        playSound('REVEAL');
        const newR = [...revealed];
        newR[i] = true;
        setRevealed(newR);
    }
  };
  
  const handleUnlockSolution = () => {
      if(spendCoins(10)) {
          setIsSolutionUnlocked(true);
      }
  };

  const handleCapture = async () => {
      if(captureRef.current) {
          captureRef.current.style.display = 'flex';
          const canvas = await html2canvas(captureRef.current, {
              backgroundColor: '#000000',
              scale: 2
          });
          captureRef.current.style.display = 'none';
          const link = document.createElement('a');
          link.download = `black_tarot_${Date.now()}.png`;
          link.href = canvas.toDataURL();
          link.click();
      }
  };

  return (
    <div className={`min-h-screen pt-28 pb-20 px-4 flex flex-col items-center z-10 relative overflow-y-auto overflow-x-hidden ${SKINS.find(s=>s.id===user.currentSkin)?.cssClass}`}>
       {/* CAPTURE VIEW */}
       <div ref={captureRef} style={{ display: 'none' }} className="w-[1080px] h-[1920px] bg-[#000] flex-col items-center p-16 border-[20px] border-[#3b0764] relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#2e1065_0%,#000_80%)]"></div>
          <h1 className="text-8xl font-occult text-gold-gradient mb-12 relative z-10">BLACK TAROT</h1>
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-yellow-600 to-transparent mb-20 relative z-10"></div>
          <div className="flex gap-8 mb-20 relative z-10">
              {selectedCards.map((c, i) => (
                  <div key={i} className="w-64 h-96 relative rounded-2xl border-2 border-yellow-500/50 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.4)]">
                       <img src={c.imagePlaceholder} className={`w-full h-full object-cover ${c.isReversed?'rotate-180':''}`} />
                       <div className="absolute bottom-0 w-full bg-black/70 text-center py-4 text-2xl font-bold text-yellow-500 uppercase">{c.name}</div>
                  </div>
              ))}
          </div>
          <h2 className="text-4xl text-white font-serif mb-12 text-center max-w-3xl relative z-10">"{question}"</h2>
          <div className="p-12 border border-purple-500/30 bg-black/60 rounded-xl relative z-10 max-w-4xl">
              <p className="text-3xl text-gray-300 leading-relaxed font-serif whitespace-pre-wrap text-center">
                  {fullText.substring(0, 300)}...
              </p>
          </div>
          <div className="absolute bottom-12 text-2xl text-purple-400 font-occult tracking-widest">blacktarot.com</div>
       </div>

       <div className="w-full max-w-4xl flex flex-col gap-8 animate-fade-in p-2">
         <div className="bg-gradient-to-r from-transparent via-purple-900/30 to-transparent border-y border-purple-500/30 py-6 text-center backdrop-blur-sm">
             <h3 className="text-gray-400 text-xs md:text-sm font-sans uppercase tracking-[0.2em] mb-2">{TRANSLATIONS[lang].result_question}</h3>
             <h2 className="text-xl md:text-3xl font-serif-en text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-200 drop-shadow-md px-4">"{question}"</h2>
         </div>

         {selectedCards.length > 0 && (
             <div className="flex flex-col items-center">
                 <div className="flex flex-wrap justify-center gap-4 md:gap-8 perspective-1000">
                   {selectedCards.map((c, i) => (
                     <div key={i} onClick={() => toggleReveal(i)} className="flex flex-col items-center gap-2 group cursor-pointer">
                        <div className={`w-24 h-40 md:w-32 md:h-52 relative transition-all duration-700 transform-style-3d ${revealed[i] ? 'rotate-y-180' : 'hover:-translate-y-2'}`}>
                           <div className="absolute inset-0 backface-hidden rounded-lg card-back shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-purple-500/20"></div>
                           <div className="absolute inset-0 backface-hidden rotate-y-180 bg-black rounded-lg overflow-hidden border border-yellow-600/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                              <img src={c.imagePlaceholder} className={`w-full h-full object-cover opacity-90 ${c.isReversed?'rotate-180':''}`} alt={c.name} />
                              <div className="absolute bottom-2 left-0 right-0 text-center">
                                  <span className="text-[10px] md:text-xs font-occult text-yellow-500 uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded">{c.name}</span>
                              </div>
                           </div>
                        </div>
                        <span className="text-xs text-gray-500 font-serif-en tracking-widest">{i + 1}</span>
                     </div>
                   ))}
                 </div>
             </div>
         )}

         <div className="relative">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-500/50"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-500/50"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-500/50"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-purple-500/50"></div>
            
            <div className="bg-black/60 backdrop-blur-md border border-purple-900/30 p-6 md:p-8 rounded-sm shadow-2xl min-h-[200px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-4">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-purple-300 font-occult animate-pulse text-sm tracking-widest">Reading Fate...</span>
                    </div>
                ) : (
                    <div className="text-gray-200 font-sans text-sm md:text-base leading-relaxed md:leading-loose whitespace-pre-wrap break-keep">
                        {/* 1. Analysis Part (Always Visible) */}
                        <TypewriterText text={analysisText} />
                        
                        {/* 2. Solution Part (Locked or Unlocked) */}
                        {solutionText && (
                            <div className="mt-8 pt-8 border-t border-purple-900/50 relative">
                                {isSolutionUnlocked ? (
                                    <div className="animate-fade-in">
                                        <TypewriterText text={solutionText} />
                                    </div>
                                ) : (
                                    <div className="relative rounded-lg overflow-hidden select-none">
                                        <div className="filter blur-[8px] opacity-60 text-gray-400 text-xs leading-relaxed select-none pointer-events-none" style={{ userSelect: 'none' }}>
                                            {/* Dummy text to simulate the hidden solution content */}
                                            {solutionText}
                                        </div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-black/60 to-black/80 z-10">
                                            <div className="text-3xl mb-2">🔒</div>
                                            <p className="text-gray-300 font-bold mb-4 text-center px-4">실질적인 해결책은<br/>블랙코인 10개로 확인할 수 있습니다.</p>
                                            <button 
                                                onClick={handleUnlockSolution}
                                                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all transform hover:scale-105"
                                            >
                                                Unlock (-10 Coins)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
         </div>
       </div>
       
       <div className="fixed bottom-6 z-40 flex gap-4 animate-fade-in-up">
         <button onClick={onRetry} className="px-8 py-3 bg-gray-900/80 border border-gray-600 rounded text-gray-300 font-bold hover:bg-gray-800 hover:text-white transition-all shadow-lg backdrop-blur-md uppercase text-sm tracking-wider">
             {TRANSLATIONS[lang].next}
         </button>
         <button onClick={handleCapture} className="px-8 py-3 bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-500 rounded text-white font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)] backdrop-blur-md uppercase text-sm tracking-wider flex items-center gap-2">
             <span>✨</span> {TRANSLATIONS[lang].share}
         </button>
       </div>
    </div>
  );
};

const AuthForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const handleAuth = async () => {
        if(!email || !password) return alert("Please fill in all fields.");
        setLoading(true);
        setMsg('');
        
        try {
            if (isSignup) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) {
                    if (error.message.includes('already registered') || error.message.includes('unique')) {
                        throw new Error("이미 이 메일로 존재하는 계정이 있습니다.");
                    }
                    throw error;
                }
                setMsg("Confirmation email sent! Please check your inbox.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onClose();
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
             <div className="flex w-full mb-4 bg-gray-800 rounded p-1">
                <button onClick={() => setIsSignup(false)} className={`flex-1 py-2 rounded text-sm font-bold transition-all ${!isSignup ? 'bg-purple-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>LOGIN</button>
                <button onClick={() => setIsSignup(true)} className={`flex-1 py-2 rounded text-sm font-bold transition-all ${isSignup ? 'bg-purple-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>SIGN UP</button>
            </div>
            
            <input className="p-3 bg-black border border-gray-700 rounded text-white focus:border-purple-500 outline-none transition-colors" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input className="p-3 bg-black border border-gray-700 rounded text-white focus:border-purple-500 outline-none transition-colors" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            
            {msg && <p className="text-green-400 text-xs text-center">{msg}</p>}

            <button onClick={handleAuth} disabled={loading} className="w-full py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors mt-2">
                {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Login')}
            </button>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
                <div className="relative flex justify-center"><span className="bg-gray-900 px-2 text-gray-500 text-xs uppercase">Or continue with</span></div>
            </div>

            <GoogleContinueButton />
        </div>
    );
};

// ---------------------------------------------------------------------------
// MAIN APP
// ---------------------------------------------------------------------------

const App: React.FC = () => {
  const [historyStack, setHistoryStack] = useState<AppState[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  
  const [user, setUser] = useState<User>({ 
      email: 'Guest', 
      coins: 0, 
      history: [], 
      totalSpent: 0, 
      tier: UserTier.BRONZE,
      attendanceDay: 0,
      ownedSkins: ['default'],
      currentSkin: 'default',
      readingsToday: 0,
      loginDates: []
  });
  
  const [authMode, setAuthMode] = useState<'LOGIN'|'SIGNUP'|null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGuestBlock, setShowGuestBlock] = useState(false);
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [attendanceReward, setAttendanceReward] = useState(0);

  // Core Data State
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState<string>(''); 
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [readingPromise, setReadingPromise] = useState<Promise<string> | null>(null);
  const [lang, setLang] = useState<Language>('ko'); 
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [bgmStopped, setBgmStopped] = useState(false);
  const [currentBgm, setCurrentBgm] = useState<BGM>(BGMS[0]);
  
  // Special Inputs
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [birthTime, setBirthTime] = useState({h: '12', m: '00'});
  const [partnerBirth, setPartnerBirth] = useState('');

  // Shop Flow
  const [shopStep, setShopStep] = useState<'AMOUNT' | 'METHOD'>('AMOUNT');
  const [pendingPackage, setPendingPackage] = useState<{amount: number, coins: number} | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'TOSS' | 'PAYPAL' | 'APPLE' | 'KAKAO'>('TOSS');

  const navigateTo = (newState: AppState) => {
    setHistoryStack(prev => [...prev, appState]);
    setAppState(newState);
  };

  const goBack = () => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack(prevStack => prevStack.slice(0, -1));
      setAppState(prev);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const today = new Date().toISOString().split('T')[0];
      const todayDate = new Date();
      const isFirstDay = todayDate.getDate() === 1;
      
      if (!data.session?.user) {
         setUser(prev => ({ ...prev, email: "Guest", lastLoginDate: today }));
         setAppState(AppState.WELCOME);
         return;
      }
      
      const u = data.session.user;
      
      setUser(prev => {
          let newLoginDates = [...(prev.loginDates || [])];
          if (!newLoginDates.includes(today)) newLoginDates.push(today);
          
          let newTier = calculateTier(prev.totalSpent);
          let newCoins = prev.coins;
          let currentMonthlyReward = prev.lastMonthlyReward;
          let newAttendanceDay = prev.attendanceDay;
          let newLastAttendance = prev.lastAttendance;

          // Demotion Logic
          if (isFirstDay && prev.lastLoginDate !== today) {
             const lastMonthLogins = newLoginDates.filter(d => {
                 const dDate = new Date(d);
                 return dDate.getMonth() === todayDate.getMonth() - 1;
             }).length;
             if (lastMonthLogins < 20 && (newTier === UserTier.GOLD || newTier === UserTier.PLATINUM)) {
                 newTier = UserTier.SILVER;
                 alert("출석 부족으로 등급이 SILVER로 조정되었습니다.");
             }
          }

          // Monthly Reward
          if (isFirstDay && currentMonthlyReward !== today.substring(0, 7)) {
              if (newTier === UserTier.GOLD) {
                  newCoins = Math.floor(newCoins * 1.5);
                  alert(TRANSLATIONS[lang].reward_popup + " (1.5x)");
              } else if (newTier === UserTier.PLATINUM) {
                  newCoins = Math.floor(newCoins * 2.0);
                  alert(TRANSLATIONS[lang].reward_popup + " (2.0x)");
              }
              currentMonthlyReward = today.substring(0, 7);
          }

          // Attendance Logic (New Users / Reset if break?)
          // Prompt implies strictly "New user gets 10 days check". Assuming it flows 1 to 10 then stops or resets.
          // Let's implement: If lastAttendance != today, increment day. 
          if (newLastAttendance !== today && newAttendanceDay < 10) {
              newAttendanceDay += 1;
              const reward = ATTENDANCE_REWARDS[newAttendanceDay - 1];
              newCoins += reward;
              newLastAttendance = today;
              setAttendanceReward(reward);
              setShowAttendancePopup(true);
          }
          
          return {
            ...prev,
            email: u.email || "User",
            tier: newTier,
            coins: newCoins,
            lastLoginDate: today,
            loginDates: newLoginDates,
            readingsToday: prev.lastReadingDate === today ? prev.readingsToday : 0,
            lastReadingDate: today,
            lastMonthlyReward: currentMonthlyReward,
            attendanceDay: newAttendanceDay,
            lastAttendance: newLastAttendance
        };
      });
      
      setAppState(AppState.INPUT_INFO);
    };
    checkUser();
  }, []);

  const handleStart = () => {
      initSounds(); 
      setBgmStopped(false);
      navigateTo(AppState.INPUT_INFO);
  };

  const handleUserInfoSubmit = (info: UserInfo) => {
    setUser((prev) => ({ ...prev, userInfo: info }));
    navigateTo(AppState.CATEGORY_SELECT);
  };
  
  const spendCoins = (amount: number): boolean => {
      if (user.email === 'Guest') return true; 
      if (user.coins < amount) {
          if (confirm(TRANSLATIONS[lang].coin_shortage)) {
              setShowShop(true);
              setShopStep('AMOUNT');
          }
          return false;
      }
      setUser(prev => ({ ...prev, coins: prev.coins - amount }));
      return true;
  };

  const buySkin = (skin: Skin) => {
      if (user.ownedSkins.includes(skin.id)) {
          setUser(prev => ({ ...prev, currentSkin: skin.id }));
          return;
      }
      if (spendCoins(skin.cost)) {
          setUser(prev => ({
              ...prev,
              ownedSkins: [...prev.ownedSkins, skin.id],
              currentSkin: skin.id
          }));
      }
  };

  const deleteAccount = () => {
      if (confirm(TRANSLATIONS[lang].delete_confirm)) {
          supabase.auth.signOut();
          setUser({ 
              email: 'Guest', 
              coins: 0, 
              history: [], 
              totalSpent: 0, 
              tier: UserTier.BRONZE,
              attendanceDay: 0,
              ownedSkins: ['default'],
              currentSkin: 'default',
              readingsToday: 0,
              loginDates: []
          });
          setAppState(AppState.WELCOME);
          setShowProfile(false);
      }
  };

  const initiatePayment = (amount: number, coins: number) => {
      if (user.email === 'Guest') {
          alert("Please login to purchase coins.");
          return;
      }
      setPendingPackage({ amount, coins });
      setShopStep('METHOD');
  };

  const processPayment = () => {
    if (!pendingPackage) return;
    setTimeout(() => {
        alert(`Payment Successful via ${selectedPaymentMethod}!`);
        setUser(prev => ({ 
            ...prev, 
            coins: prev.coins + pendingPackage.coins, 
            totalSpent: prev.totalSpent + pendingPackage.amount, 
            tier: calculateTier(prev.totalSpent + pendingPackage.amount) 
        }));
        setPendingPackage(null);
        setShopStep('AMOUNT');
        setShowShop(false);
    }, 1500);
  };
  
  // -------------------------------------------------------------------------
  // RESTORED HANDLERS FOR FLOW
  // -------------------------------------------------------------------------

  const handleCategorySelect = (category: QuestionCategory) => {
      if (category.minTier) {
          const tiers = [UserTier.BRONZE, UserTier.SILVER, UserTier.GOLD, UserTier.PLATINUM];
          if (tiers.indexOf(user.tier) < tiers.indexOf(category.minTier)) {
              alert(`This category requires ${category.minTier} tier or higher.`);
              return;
          }
      }
      setSelectedCategory(category);
      if (category.id === 'FACE') navigateTo(AppState.FACE_UPLOAD);
      else if (category.id === 'LIFE') navigateTo(AppState.LIFE_INPUT);
      else if (category.id === 'SECRET_COMPAT' || category.id === 'PARTNER_LIFE') navigateTo(AppState.PARTNER_INPUT);
      else navigateTo(AppState.QUESTION_SELECT);
  };

  const handleQuestionSelect = (q: string) => {
      setSelectedQuestion(q);
      navigateTo(AppState.SHUFFLING);
  };

  const handleCustomQuestionSubmit = () => {
      if(!customQuestion.trim()) return;
      setSelectedQuestion(customQuestion);
      navigateTo(AppState.SHUFFLING);
  };

  const startFaceReading = () => {
      if (!faceImage) return alert("Please upload a photo first.");
      if (!spendCoins(100)) return;

      navigateTo(AppState.RESULT);
      setSelectedQuestion(TRANSLATIONS[lang].face_reading_title);
      setSelectedCards([]);
      setReadingPromise(getFaceReading(faceImage, user.userInfo, lang));
  };

  const startLifeReading = () => {
      if (!spendCoins(150)) return;
      
      navigateTo(AppState.RESULT);
      setSelectedQuestion(TRANSLATIONS[lang].life_reading_title);
      setSelectedCards([]);
      setReadingPromise(getLifeReading({...user.userInfo!, birthTime: `${birthTime.h}:${birthTime.m}`}, lang));
  };

  const startPartnerReading = () => {
      if (!selectedCategory) return;
      const cost = selectedCategory.cost || 0;
      if (!spendCoins(cost)) return;
      if (!partnerBirth || partnerBirth.length < 8) return alert("Please enter a valid birthdate (YYYYMMDD).");

      navigateTo(AppState.RESULT);
      setSelectedQuestion(selectedCategory.label);
      setSelectedCards([]);

      if (selectedCategory.id === 'SECRET_COMPAT') {
          setReadingPromise(getCompatibilityReading(user.userInfo!, partnerBirth, lang));
      } else {
          setReadingPromise(getPartnerLifeReading(partnerBirth, lang));
      }
  };

  const handleCardSelect = (indices: number[]) => {
      // For standard readings, check daily limits if needed
      // Special categories don't use this flow
      const limit = user.tier === UserTier.BRONZE ? 5 : (user.tier === UserTier.SILVER ? 20 : 999);
      if (user.readingsToday >= limit) {
          alert(TRANSLATIONS[lang].limit_reached);
          return;
      }
      
      setUser(prev => ({...prev, readingsToday: prev.readingsToday + 1}));

      const selected = indices.map(i => ({
          id: i,
          name: TAROT_DECK[i],
          isReversed: Math.random() < 0.3,
          imagePlaceholder: getFallbackTarotImage(i),
          backDesign: 0
      }));

      setSelectedCards(selected);
      navigateTo(AppState.RESULT);
      setReadingPromise(getTarotReading(selectedQuestion, selected, user.userInfo, lang, user.history, user.tier));
  };

  return (
      <div className={`relative min-h-screen text-white font-sans overflow-hidden select-none ${SKINS.find(s=>s.id===user.currentSkin)?.cssClass}`}>
          <Background />
          <AudioPlayer volume={bgmVolume} userStopped={bgmStopped} currentTrack={currentBgm.url} />
          
          {appState !== AppState.WELCOME && appState !== AppState.INPUT_INFO && (
              <div className="z-50 pointer-events-auto">
                 <Header 
                    user={user} 
                    lang={lang} 
                    onOpenSettings={() => setShowSettings(true)}
                    onOpenShop={() => { setShowShop(true); setShopStep('AMOUNT'); }}
                    onLogin={() => setAuthMode("LOGIN")}
                    openProfile={() => setShowProfile(true)}
                 />
                 {historyStack.length > 1 && appState !== AppState.CATEGORY_SELECT && (
                     <button onClick={goBack} className="fixed top-24 left-4 z-40 p-2 bg-black/50 rounded-full border border-gray-600 text-gray-300 hover:bg-black hover:text-white">← Back</button>
                 )}
              </div>
          )}

          {/* GUEST BLOCK MODAL */}
          {showGuestBlock && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-6">
                  <div className="bg-gray-900 border border-purple-500 p-8 rounded text-center max-w-sm w-full shadow-[0_0_50px_rgba(168,85,247,0.5)]">
                      <h2 className="text-2xl font-bold text-white mb-4">STOP</h2>
                      <p className="text-gray-300 mb-8 leading-relaxed">{TRANSLATIONS[lang].guest_lock_msg}</p>
                      <button onClick={() => { setShowGuestBlock(false); setAuthMode('LOGIN'); }} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all hover:scale-105">{TRANSLATIONS[lang].guest_lock_btn}</button>
                  </div>
              </div>
          )}

          {/* ATTENDANCE POPUP */}
          {showAttendancePopup && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
                  <div className="bg-[#1a103c] border-2 border-yellow-500 p-8 rounded-lg text-center max-w-sm relative shadow-[0_0_50px_gold]">
                      <h2 className="text-2xl text-yellow-400 font-bold mb-4">Daily Attendance</h2>
                      <div className="text-6xl mb-4">🎁</div>
                      <p className="text-white text-xl mb-2">Day {user.attendanceDay}</p>
                      <p className="text-gray-300 mb-6">You received <span className="text-yellow-400 font-bold">{attendanceReward} Coins</span></p>
                      <button onClick={() => setShowAttendancePopup(false)} className="px-6 py-2 bg-yellow-600 text-black font-bold rounded hover:bg-yellow-500">Claim</button>
                  </div>
              </div>
          )}

          {/* PROFILE MODAL */}
          {showProfile && user.email !== 'Guest' && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
                  <div className="bg-gray-900 border border-purple-500 rounded-lg max-w-md w-full p-6 relative overflow-y-auto max-h-[90vh]">
                      <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
                      <h2 className="text-2xl font-occult text-purple-200 mb-6 text-center">{TRANSLATIONS[lang].profile_edit}</h2>
                      
                      {/* Profile Image */}
                      <div className="flex justify-center mb-6">
                          <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-purple-500 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                              {user.userInfo?.profileImage ? <img src={user.userInfo.profileImage} className="w-full h-full object-cover" /> : <span className="text-4xl">👤</span>}
                              <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-xs text-white">Change</div>
                              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>{
                                  const f = e.target.files?.[0];
                                  if(f) { const r = new FileReader(); r.onload=()=>setUser({...user, userInfo: {...user.userInfo!, profileImage: r.result as string}}); r.readAsDataURL(f); }
                              }}/>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="text-xs text-gray-500 block mb-1">Name ({3 - (user.userInfo?.nameChangeCount||0)} left)</label>
                              <input 
                                value={user.userInfo?.name} 
                                disabled={(user.userInfo?.nameChangeCount||0) >= 3}
                                onChange={(e) => setUser({...user, userInfo: {...user.userInfo!, name: e.target.value}})}
                                onBlur={() => {
                                    if((user.userInfo?.nameChangeCount||0) < 3) setUser(prev => ({...prev, userInfo: {...prev.userInfo!, nameChangeCount: (prev.userInfo?.nameChangeCount||0)+1}}));
                                }}
                                className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white disabled:opacity-50"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 block mb-1">Birthdate (Read Only / {user.userInfo?.birthDateChanged ? 'Locked' : '1 Edit'})</label>
                              <input 
                                  value={user.userInfo?.birthDate} 
                                  disabled={user.userInfo?.birthDateChanged}
                                  onChange={(e) => setUser({...user, userInfo: {...user.userInfo!, birthDate: e.target.value}})}
                                  onBlur={() => { if(!user.userInfo?.birthDateChanged) setUser(prev => ({...prev, userInfo: {...prev.userInfo!, birthDateChanged: true}})); }}
                                  className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white disabled:opacity-50"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 block mb-1">Country ({user.userInfo?.countryChanged ? 'Locked' : '1 Edit'})</label>
                              <select 
                                  value={COUNTRIES.find(c=>c.nameEn===user.userInfo?.country)?.code}
                                  disabled={user.userInfo?.countryChanged}
                                  onChange={(e) => {
                                      const c = COUNTRIES.find(ct => ct.code === e.target.value);
                                      if(c) setUser(prev => ({...prev, userInfo: {...prev.userInfo!, country: c.nameEn, countryChanged: true}}));
                                  }}
                                  className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white disabled:opacity-50"
                              >
                                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.nameEn}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 block mb-1">Bio</label>
                              <textarea 
                                  value={user.userInfo?.bio || ''} 
                                  onChange={(e) => setUser({...user, userInfo: {...user.userInfo!, bio: e.target.value}})}
                                  className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white h-20"
                              />
                          </div>
                          
                          <div className="bg-black/30 p-4 rounded mt-4">
                              <h4 className="text-sm font-bold text-yellow-500 mb-2">Attendance Status</h4>
                              <div className="flex gap-1 justify-between">
                                  {Array.from({length: 10}).map((_, i) => (
                                      <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${i < user.attendanceDay ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-500'}`}>
                                          {i+1}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-800">
                          <button onClick={deleteAccount} className="w-full py-3 bg-red-900/50 text-red-400 font-bold rounded border border-red-900 hover:bg-red-900 hover:text-white transition-colors">
                              {TRANSLATIONS[lang].delete_account}
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {appState === AppState.WELCOME && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in relative z-10">
                <Header user={user} lang={lang} onOpenSettings={() => setShowSettings(true)} onOpenShop={() => setShowShop(true)} onLogin={() => setAuthMode("LOGIN")} openProfile={() => setShowProfile(true)} />
                <Logo size="large" />
                <p className="font-serif-en text-sm md:text-base italic mb-12 text-gold-gradient font-bold tracking-widest uppercase drop-shadow-sm opacity-90">{TRANSLATIONS[lang].welcome_sub}</p>
                <button onClick={handleStart} className="btn-gold-3d mb-8">{TRANSLATIONS[lang].enter}</button>
              </div>
          )}

          {appState === AppState.INPUT_INFO && (
              <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10 animate-fade-in">
                <Logo size="small" />
                <div className="w-full max-w-md bg-black/60 border-wine-gradient p-8 rounded-lg backdrop-blur-sm">
                    <h2 className="text-2xl font-occult text-purple-200 mb-2 text-center">{TRANSLATIONS[lang].info_title}</h2>
                    <p className="text-gray-400 text-sm mb-8 text-center">{TRANSLATIONS[lang].info_desc}</p>
                    <UserInfoForm onSubmit={handleUserInfoSubmit} lang={lang} />
                </div>
              </div>
          )}

          {appState === AppState.CATEGORY_SELECT && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in pt-20 pb-10">
                 <h2 className="text-3xl font-occult text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-800 mb-8 text-center" style={{ fontFamily: "'Apple SD Gothic Neo', sans-serif" }}>{TRANSLATIONS[lang].select_cat_title}</h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full">
                   {CATEGORIES.map((cat) => {
                       const isVisible = (cat.id === 'FACE' || cat.id === 'LIFE') ? user.tier !== UserTier.BRONZE : (cat.id === 'SECRET_COMPAT') ? (user.tier === UserTier.GOLD || user.tier === UserTier.PLATINUM) : (cat.id === 'PARTNER_LIFE') ? (user.tier === UserTier.PLATINUM) : true;
                       if (!isVisible) return null;
                       return (
                         <button key={cat.id} onClick={() => handleCategorySelect(cat)} className={`relative flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-200 border-wine-gradient backdrop-blur-sm group bg-gradient-to-br from-[#1a103c] to-[#000000] hover:-translate-y-1 hover:shadow-[0_8px_15px_rgba(88,28,135,0.4)]`}>
                           <span className="text-4xl mb-2 filter drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] transition-transform duration-300 group-hover:scale-110">{cat.icon}</span>
                           <span className="text-gray-200 font-sans font-bold tracking-wide group-hover:text-white transition-colors">{lang === 'en' ? cat.id : cat.label}</span>
                           {cat.cost && <span className="absolute top-2 right-2 text-[10px] text-yellow-500 bg-black/80 px-1 rounded border border-yellow-700">-{cat.cost}</span>}
                         </button>
                       );
                   })}
                 </div>
              </div>
          )}

          {appState === AppState.FACE_UPLOAD && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in">
                  <div className="w-full max-w-md bg-black/60 border border-purple-500/50 p-6 rounded text-center">
                      <h2 className="text-xl font-bold text-white mb-2">{TRANSLATIONS[lang].face_reading_title}</h2>
                      <div className="mb-6 border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-purple-500 transition-colors cursor-pointer relative">
                          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend=()=>setFaceImage(r.result as string); r.readAsDataURL(f); } }} className="absolute inset-0 opacity-0 cursor-pointer" />
                          {faceImage ? <img src={faceImage} className="max-h-48 mx-auto rounded" /> : <span className="text-gray-500">{TRANSLATIONS[lang].face_guide}</span>}
                      </div>
                      <button onClick={startFaceReading} className="w-full py-3 bg-purple-700 hover:bg-purple-600 rounded font-bold">{TRANSLATIONS[lang].face_upload_btn}</button>
                  </div>
              </div>
          )}

          {appState === AppState.LIFE_INPUT && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in">
                  <div className="w-full max-w-md bg-black/60 border border-purple-500/50 p-6 rounded text-center">
                      <h2 className="text-xl font-bold text-white mb-2">{TRANSLATIONS[lang].life_reading_title}</h2>
                      <div className="flex gap-4 justify-center mb-6">
                          <select value={birthTime.h} onChange={e=>setBirthTime({...birthTime, h:e.target.value})} className="bg-gray-800 text-white p-2 rounded">{Array.from({length:24}).map((_,i) => <option key={i} value={i.toString()}>{i}시</option>)}</select>
                          <select value={birthTime.m} onChange={e=>setBirthTime({...birthTime, m:e.target.value})} className="bg-gray-800 text-white p-2 rounded">{Array.from({length:60}).map((_,i) => <option key={i} value={i.toString()}>{i}분</option>)}</select>
                      </div>
                      <button onClick={startLifeReading} className="w-full py-3 bg-purple-700 hover:bg-purple-600 rounded font-bold">{TRANSLATIONS[lang].life_input_btn}</button>
                  </div>
              </div>
          )}

          {appState === AppState.PARTNER_INPUT && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in">
                  <div className="w-full max-w-md bg-black/60 border border-purple-500/50 p-6 rounded text-center">
                      <h2 className="text-xl font-bold text-white mb-2">{selectedCategory?.label}</h2>
                      <p className="text-gray-400 mb-6">{selectedCategory?.id === 'SECRET_COMPAT' ? TRANSLATIONS[lang].secret_compat_desc : TRANSLATIONS[lang].partner_life_desc}</p>
                      
                      <input 
                        value={partnerBirth} onChange={e=>setPartnerBirth(e.target.value)} 
                        placeholder={TRANSLATIONS[lang].partner_birth_ph}
                        className="w-full p-3 bg-gray-800 rounded text-white border border-gray-700 focus:border-purple-500 mb-6 outline-none"
                      />

                      <button onClick={startPartnerReading} className="w-full py-3 bg-purple-700 hover:bg-purple-600 rounded font-bold">
                          {selectedCategory?.id === 'SECRET_COMPAT' ? TRANSLATIONS[lang].secret_compat_btn : TRANSLATIONS[lang].partner_life_btn}
                      </button>
                  </div>
              </div>
          )}

          {appState === AppState.QUESTION_SELECT && selectedCategory && (
             <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in pt-20">
                 <h2 className="text-2xl font-occult text-purple-200 mb-6 text-center">{selectedCategory.label}</h2>
                 <div className="w-full max-w-xl space-y-3">
                     {selectedCategory.questions.map((q, i) => (
                         <button key={i} onClick={() => handleQuestionSelect(q)} className="w-full p-4 text-left bg-black/60 border border-purple-900/50 rounded hover:bg-purple-900/30 hover:border-purple-500 transition-all text-gray-200 text-sm md:text-base">{q}</button>
                     ))}
                     <div className="relative mt-6 pt-4 border-t border-gray-800">
                         <input className="w-full p-4 bg-gray-900 border border-gray-700 rounded text-white focus:border-purple-500 focus:outline-none" placeholder={TRANSLATIONS[lang].custom_q_ph} value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} />
                         <button onClick={handleCustomQuestionSubmit} className="absolute right-2 top-6 bottom-2 px-4 bg-purple-900 rounded text-xs font-bold hover:bg-purple-700 mt-4 mb-2">OK</button>
                     </div>
                 </div>
                 <button onClick={() => navigateTo(AppState.CATEGORY_SELECT)} className="mt-8 text-gray-500 underline text-sm">Back</button>
             </div>
          )}

          {appState === AppState.SHUFFLING && (
              <ShufflingAnimation onComplete={() => navigateTo(AppState.CARD_SELECT)} lang={lang} skin={user.currentSkin} />
          )}

          {appState === AppState.CARD_SELECT && (
              <CardSelection onSelectCards={handleCardSelect} lang={lang} skin={user.currentSkin} />
          )}

          {appState === AppState.RESULT && (
            <ResultView question={selectedQuestion} selectedCards={selectedCards} isLoggedIn={user.email !== "Guest"} onRetry={() => navigateTo(AppState.CATEGORY_SELECT)} userInfo={user.userInfo || null} lang={lang} readingPromise={readingPromise} onReadingComplete={(text) => {
                const result: ReadingResult = { date: new Date().toISOString(), question: selectedQuestion, cards: selectedCards, interpretation: text };
                setUser((prev) => ({ ...prev, history: [result, ...(prev.history ?? [])] }));
              }} user={user} spendCoins={spendCoins} />
          )}

          {/* SHOP MODAL */}
          {showShop && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
                 <div className="bg-[#0f0826] border border-yellow-600/50 p-6 rounded-lg max-w-lg w-full relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                     <button onClick={() => { setShowShop(false); setShopStep('AMOUNT'); }} className="absolute top-4 right-4 text-white hover:text-gray-300">✕</button>
                     {shopStep === 'AMOUNT' ? (
                        <>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl text-gold-gradient font-bold mb-2 font-serif-en">{TRANSLATIONS[lang].shop_title}</h2>
                                <p className="text-sm text-gray-400 italic">"{TRANSLATIONS[lang].shop_subtitle}"</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <button onClick={() => initiatePayment(4900, 60)} className="flex justify-between items-center p-4 bg-gray-900 rounded hover:bg-gray-800 border border-gray-700 transition-colors"><span className="font-bold text-white">{TRANSLATIONS[lang].shop_pkg_1}</span><span className="text-yellow-400">Buy</span></button>
                                <button onClick={() => initiatePayment(7900, 110)} className="flex justify-between items-center p-4 bg-gray-900 rounded hover:bg-gray-800 border border-yellow-700 border-l-4 border-l-yellow-500 transition-colors shadow-[0_0_10px_rgba(234,179,8,0.2)]"><span className="font-bold text-white">{TRANSLATIONS[lang].shop_pkg_2}</span><span className="text-yellow-400 font-bold">Best</span></button>
                                <button onClick={() => initiatePayment(15500, 220)} className="flex justify-between items-center p-4 bg-gray-900 rounded hover:bg-gray-800 border border-gray-700 transition-colors"><span className="font-bold text-white">{TRANSLATIONS[lang].shop_pkg_3}</span><span className="text-yellow-400">Buy</span></button>
                            </div>
                        </>
                     ) : (
                         <>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl text-gold-gradient font-bold mb-2">{TRANSLATIONS[lang].pay_title}</h2>
                                <p className="text-sm text-gray-400">{pendingPackage?.coins} Coins / ₩{pendingPackage?.amount.toLocaleString()}</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => setSelectedPaymentMethod('KAKAO')} className={`p-4 rounded border flex items-center justify-center font-bold ${selectedPaymentMethod === 'KAKAO' ? 'bg-[#FEE500] text-black border-[#FEE500]' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>Kakao Bank</button>
                                <button onClick={() => setSelectedPaymentMethod('TOSS')} className={`p-4 rounded border flex items-center justify-center font-bold ${selectedPaymentMethod === 'TOSS' ? 'bg-blue-600/30 border-blue-500 text-blue-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>Toss Payments</button>
                                <button onClick={() => setSelectedPaymentMethod('PAYPAL')} className={`p-4 rounded border flex items-center justify-center font-bold ${selectedPaymentMethod === 'PAYPAL' ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>PayPal</button>
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => setShopStep('AMOUNT')} className="flex-1 py-3 bg-gray-700 text-gray-300 rounded font-bold hover:bg-gray-600">{TRANSLATIONS[lang].pay_cancel}</button>
                                    <button onClick={processPayment} className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded hover:from-yellow-500 hover:to-yellow-400">{TRANSLATIONS[lang].pay_confirm}</button>
                                </div>
                            </div>
                         </>
                     )}
                 </div>
             </div>
          )}

          {/* SETTINGS MODAL */}
          {showSettings && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                 <div className="bg-gray-900 border-wine-gradient p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl overflow-y-auto max-h-[80vh]">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-occult text-purple-200">{TRANSLATIONS[lang].settings_title}</h3>
                        <button onClick={() => setShowSettings(false)} className="text-gray-400">✕</button>
                     </div>
                     
                     {user.email !== 'Guest' && (
                         <div className="mb-6 bg-black/40 p-4 rounded border border-purple-900">
                             <h4 className="text-gold-gradient font-bold mb-2">{TRANSLATIONS[lang].tier_info}: {user.tier}</h4>
                             <div className="text-xs text-gray-400 space-y-1">
                                 <div className={`flex justify-between ${user.tier === UserTier.BRONZE ? 'text-white' : ''}`}><span>Bronze</span> <span>0 Spent (No Benefits, 5 daily)</span></div>
                                 <div className={`flex justify-between ${user.tier === UserTier.SILVER ? 'text-white' : ''}`}><span>Silver</span> <span>400+ Spent (20 daily, Special Categories)</span></div>
                                 <div className={`flex justify-between ${user.tier === UserTier.GOLD ? 'text-white' : ''}`}><span>Gold</span> <span>1000+ Spent (1.5x Mthly, 19+, Solutions)</span></div>
                                 <div className={`flex justify-between ${user.tier === UserTier.PLATINUM ? 'text-white' : ''}`}><span>Platinum</span> <span>3000+ Spent (2.0x Mthly, Secrets)</span></div>
                             </div>
                         </div>
                     )}

                     {/* CARD SKINS (Logged in only) */}
                     {user.email !== 'Guest' && (
                         <div className="mb-6">
                             <h4 className="text-white font-bold mb-3">{TRANSLATIONS[lang].skin_shop}</h4>
                             <div className="grid grid-cols-2 gap-2">
                                 {SKINS.map(s => {
                                     const owned = user.ownedSkins.includes(s.id);
                                     const active = user.currentSkin === s.id;
                                     return (
                                         <button 
                                            key={s.id} 
                                            onClick={() => buySkin(s)}
                                            className={`p-2 rounded border text-xs flex flex-col items-center gap-1 relative overflow-hidden ${active ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700 bg-gray-800'}`}
                                         >
                                             <div className={`w-full h-12 rounded ${s.cssClass} card-back mb-1`}></div>
                                             <span>{s.name}</span>
                                             {!owned && <span className="text-yellow-400 font-bold">-{s.cost}</span>}
                                             {active && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>}
                                         </button>
                                     )
                                 })}
                             </div>
                         </div>
                     )}

                     {/* ATTENDANCE (Logged in only) */}
                     {user.email !== 'Guest' && (
                         <div className="mb-6">
                             <h4 className="text-white font-bold mb-3">{TRANSLATIONS[lang].attendance} (Day {user.attendanceDay}/10)</h4>
                             <div className="flex gap-1 justify-between bg-black/40 p-2 rounded">
                                  {Array.from({length: 10}).map((_, i) => (
                                      <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${i < user.attendanceDay ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-500'}`}>
                                          {i+1}
                                      </div>
                                  ))}
                             </div>
                         </div>
                     )}

                     <div className="mb-6">
                         <label className="block text-gray-400 mb-2">{TRANSLATIONS[lang].language_control}</label>
                         <div className="flex gap-2 mb-4">
                             <button onClick={() => setLang('ko')} className={`flex-1 py-2 rounded border text-sm font-bold ${lang === 'ko' ? 'bg-purple-700 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>한국어</button>
                             <button onClick={() => setLang('en')} className={`flex-1 py-2 rounded border text-sm font-bold ${lang === 'en' ? 'bg-purple-700 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>English</button>
                         </div>

                         <label className="block text-gray-400 mb-2">{TRANSLATIONS[lang].bgm_control}</label>
                         <div className="flex items-center gap-4 mb-3">
                             <button onClick={() => setBgmStopped(!bgmStopped)} className="text-2xl p-2 bg-gray-800 rounded-full">{bgmStopped ? '🔇' : '🔊'}</button>
                             <input type="range" min="0" max="1" step="0.1" value={bgmVolume} onChange={(e) => setBgmVolume(parseFloat(e.target.value))} className="w-full accent-purple-500" />
                         </div>
                     </div>
                 </div>
             </div>
          )}

          {/* GLOBAL LOGIN MODAL */}
          {authMode === 'LOGIN' && (
             <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[300] animate-fade-in backdrop-blur-sm">
                 <div className="bg-gray-900 p-8 rounded-lg border border-purple-500 w-full max-w-md shadow-[0_0_30px_rgba(147,51,234,0.3)] relative">
                     <button onClick={() => setAuthMode(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                     <h2 className="text-2xl mb-6 text-center text-purple-200 font-occult">Connect with Fate</h2>
                     <AuthForm onClose={() => setAuthMode(null)} />
                 </div>
             </div>
          )}
      </div>
  );
};

export default App;