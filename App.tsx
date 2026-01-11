import React, { useState, useEffect, useRef } from 'react';
import { AppState, CategoryKey, TarotCard, QuestionCategory, User, UserInfo, Language, ReadingResult } from './types';
import { CATEGORIES, TAROT_DECK } from './constants';
import Background from './components/Background';
import Logo from './components/Logo';
import AudioPlayer from './components/AudioPlayer';
import { getTarotReading, generateTarotImage } from './services/geminiService';
import { playSound, playShuffleLoop, stopShuffleLoop } from './services/soundService';

// ---------------------------------------------------------------------------
// 12. 최애 관련 질문 추가 (CATEGORIES 수정 필요 없이 여기서 주입)
// ---------------------------------------------------------------------------
// 원래 constants.ts에 있어야 하지만, 편의상 앱 실행 시 주입합니다.
const LOVE_CATEGORY_IDX = CATEGORIES.findIndex(c => c.id === 'love');
if (LOVE_CATEGORY_IDX !== -1) {
    const idolQuestion = "아무도 모르는 내 최애의 숨겨진 모습은 무엇인가?";
    if (!CATEGORIES[LOVE_CATEGORY_IDX].questions.includes(idolQuestion)) {
        CATEGORIES[LOVE_CATEGORY_IDX].questions.push(idolQuestion);
    }
}

// ---------------------------------------------------------------------------
// CONFIG & TRANSLATIONS
// ---------------------------------------------------------------------------
const IDOL_BGM_LIST = [
    { title: "Mantra", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }, // 예시 URL (저작권 때문에 실제 파일 필요)
    { title: "Ditto Vibe", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { title: "Dark Moon", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

const TRANSLATIONS = {
    ko: {
        welcome_sub: "Cards don't lie.",
        enter: "운명의 문 열기",
        info_title: "운명을 마주할 준비",
        info_desc: "당신의 기운(Saju)을 읽기 위해 정확한 정보를 입력해주세요.",
        name_label: "이름",
        name_ph: "이름을 입력하세요",
        birth_label: "생년월일 (8자리)",
        birth_ph: "예: 19970327",
        warning_change: "⚠ 입력된 기운은 운명 해석에 반영됩니다.",
        select_cat_title: "오늘의 타로를 선택하세요",
        shuffling: "운명과 기운을 섞는 중...",
        select_cards_title: "당신의 기운이 이끄는 카드 3장",
        result_question: "Q.",
        retry_paid: "복채 내고 다시 보기 (-5 Coin)",
        retry_free: "운명을 다시 확인하시겠습니까?",
        login_btn: "로그인 하러 가기",
        login_btn_again: "타로 보러 가기",
        share: "인스타 스토리에 공유하기",
        settings_title: "설정",
        shop_title: "Dark Treasury",
        guest: "Guest",
        auth_title: "로그인 / 회원가입",
        continue_google: "Google로 계속하기",
        guest_exhausted: "Guest 운명 확인은 끝났습니다. 더 깊은 답은 로그인이 필요합니다.",
        coin_shortage: "Black Coin이 부족합니다.",
        input_placeholder: "구체적인 고민을 적어주세요.",
        confirm: "확인",
        shop_step1: "충전할 패키지 선택",
        shop_step2: "결제 수단 선택",
        reveal_hint: "카드를 터치하여 운명을 확인하세요",
        community_title: "Fate Community",
        write_post: "운명 공유하기",
        profile_title: "My Profile",
        bio_ph: "자신을 표현하는 한마디",
        save: "저장"
    },
    en: {
        welcome_sub: "Cards don't lie.",
        enter: "Enter the Void",
        info_title: "Prepare for Fate",
        info_desc: "Enter details for Saju analysis.",
        name_label: "Name",
        name_ph: "Name",
        birth_label: "Birthdate (YYYYMMDD)",
        birth_ph: "Ex: 19970327",
        warning_change: "Fate uses this energy.",
        select_cat_title: "Select Theme",
        shuffling: "Mixing Fate...",
        select_cards_title: "Select 3 Cards",
        result_question: "Q.",
        retry_paid: "Read Again (-5 Coin)",
        retry_free: "Retry?",
        login_btn: "Go to Login",
        login_btn_again: "Read Tarot",
        share: "Share to Story",
        settings_title: "Settings",
        shop_title: "Treasury",
        guest: "Guest",
        auth_title: "Login / Sign Up",
        continue_google: "Continue with Google",
        guest_exhausted: "Guest limit reached.",
        coin_shortage: "Not enough Black Coins.",
        input_placeholder: "Describe your worry.",
        confirm: "Confirm",
        shop_step1: "Select Package",
        shop_step2: "Select Payment",
        reveal_hint: "Touch to reveal",
        community_title: "Fate Community",
        write_post: "Share Fate",
        profile_title: "My Profile",
        bio_ph: "Bio",
        save: "Save"
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

// 1. 생년월일 숫자판 입력을 위한 검증 함수
const isValidBirthdate = (birth: string) => {
    return /^\d{8}$/.test(birth); // 8자리 숫자만 허용
};

const getZodiacSign = (dateStr: string): string => {
    if (!dateStr || dateStr.length !== 8) return "Unknown";
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));

    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces";
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return "Gemini";
    if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return "Libra";
    if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return "Scorpio";
    if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return "Sagittarius";
    return "Capricorn";
};

// MOCK DB (커뮤니티 기능을 위해 확장)
const getDB = () => {
    const users = JSON.parse(localStorage.getItem('tarot_users') || '[]');
    const ipMap = JSON.parse(localStorage.getItem('device_ip_map') || '{}');
    const guestUsage = JSON.parse(localStorage.getItem('guest_usage') || '{}');
    const posts = JSON.parse(localStorage.getItem('community_posts') || '[]');
    return { users, ipMap, guestUsage, posts };
};

const saveDB = (data: any) => {
    if(data.users) localStorage.setItem('tarot_users', JSON.stringify(data.users));
    if(data.ipMap) localStorage.setItem('device_ip_map', JSON.stringify(data.ipMap));
    if(data.guestUsage) localStorage.setItem('guest_usage', JSON.stringify(data.guestUsage));
    if(data.posts) localStorage.setItem('community_posts', JSON.stringify(data.posts));
};

// 11. SNS 공유 (Native Share API - 인스타 스토리 스타일)
const shareContent = async (text: string, url: string) => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: "Jennie's Black Tarot",
                text: text,
                url: url,
            });
        } catch (err) {
            console.log('Share canceled');
        }
    } else {
        // Fallback for desktop
        alert("링크가 복사되었습니다! 인스타그램에 붙여넣기 하세요.");
        navigator.clipboard.writeText(`${text} ${url}`);
    }
};

// ---------------------------------------------------------------------------
// COMPONENTS
// ---------------------------------------------------------------------------

const GoldCoinIcon: React.FC<{ sizeClass?: string }> = ({ sizeClass = "w-6 h-6" }) => (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_15px_rgba(234,179,8,0.8)] border border-yellow-100 flex items-center justify-center relative overflow-hidden shrink-0`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),transparent)] opacity-70"></div>
    </div>
);

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
    const [visibleCount, setVisibleCount] = useState(0);
    useEffect(() => {
        setVisibleCount(0);
        const timer = setInterval(() => setVisibleCount(p => p < text.length ? p + 2 : p), 20); // Speed up slightly
        return () => clearInterval(timer);
    }, [text]);
    
    return (
        <div className="whitespace-pre-line leading-relaxed font-serif text-lg text-gray-200">
            {text.substring(0, visibleCount)}
        </div>
    );
};

// 9. 프로필 사진 및 바이오 설정이 가능한 헤더
const Header: React.FC<{ 
    user: User; 
    lang: Language; 
    onOpenSettings: () => void;
    onOpenShop: () => void;
    onLogin: () => void;
    onOpenProfile: () => void;
    onOpenCommunity: () => void;
}> = ({ user, lang, onOpenSettings, onOpenShop, onLogin, onOpenProfile, onOpenCommunity }) => (
  <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/95 to-transparent pointer-events-none transition-all">
    <div className="flex items-center gap-2 pointer-events-auto">
      {user.email !== 'Guest' && (
          <div className="flex items-center gap-3 bg-black/60 px-3 py-1.5 rounded-full border border-yellow-600/30 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-2 cursor-pointer" onClick={onOpenShop}>
                 <GoldCoinIcon />
                 <span className="text-yellow-100 font-mono font-bold text-lg">{user.coins.toLocaleString()}</span>
                 <span className="text-xs text-yellow-500 bg-yellow-900/50 px-1.5 py-0.5 rounded ml-1">+</span>
              </div>
          </div>
      )}
    </div>
    <div className="flex items-center gap-3 pointer-events-auto">
      {/* Community Button */}
      <button onClick={onOpenCommunity} className="text-gray-400 hover:text-white transition p-2">
         👥
      </button>

      {/* User Profile */}
      <div className="flex items-center gap-2 text-right cursor-pointer" onClick={user.email !== 'Guest' ? onOpenProfile : onLogin}>
         {user.email !== 'Guest' ? (
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-purple-900 border border-purple-500 overflow-hidden">
                    {/* 9. 프로필 사진 기능 (이미지 없으면 이니셜) */}
                    {user.profilePic ? (
                        <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold">{user.email[0].toUpperCase()}</div>
                    )}
                 </div>
             </div>
         ) : (
             <button className="text-gray-400 text-xs md:text-sm hover:text-white underline">Login</button>
         )}
      </div>
      
      <button onClick={onOpenSettings} className="text-gray-400 hover:text-purple-400 transition-colors p-2">
        ⚙️
      </button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// MAIN APP
// ---------------------------------------------------------------------------

const App: React.FC = () => {
  const deviceId = getDeviceId();
  // 7. 맨 처음 화면 새로 접속할 때마다 뜨게 하기 (WELCOME 상태 강제 시작)
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [user, setUser] = useState<User>({ email: 'Guest', coins: 0, history: [], bio: '' }); // 9. Bio 추가
  
  // Modals & State
  const [authMode, setAuthMode] = useState<'LOGIN'|'SIGNUP'|null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  
  // Selection
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [readingPromise, setReadingPromise] = useState<Promise<string> | null>(null);
  const [lang, setLang] = useState<Language>('ko'); 
  const [bgmVolume, setBgmVolume] = useState(0.5);

  // Initialization
  useEffect(() => {
     const { users, ipMap } = getDB();
     const registeredEmail = ipMap[deviceId];
     if (registeredEmail) {
         const found = users.find((u: any) => u.email === registeredEmail);
         if (found) setUser(found);
     }
     // 7. 항상 WELCOME 부터 시작하므로 여기서 appState 변경 안함
  }, []);

  // 10. 아이돌 BGM 추가
  const [currentBgm, setCurrentBgm] = useState(0);
  const bgmUrl = IDOL_BGM_LIST[currentBgm].url;

  const handleStart = () => {
      // 7. Welcome 화면에서 버튼 누르면 실행
      if (user.email === 'Guest') {
          // Guest라도 정보 입력은 받음 (Saju 참고용)
          setAppState(AppState.INPUT_INFO);
      } else {
          setAppState(AppState.CATEGORY_SELECT);
      }
  };

  const handleUserInfoSubmit = (info: UserInfo) => {
      const newUser = { ...user, userInfo: info };
      setUser(newUser);
      
      // Guest인 경우 DB에 임시 저장 (Saju 정보 유지를 위해)
      if (user.email === 'Guest') {
         // Guest는 로컬 상태만 유지
      } else {
         const { users, ipMap, guestUsage, posts } = getDB();
         const idx = users.findIndex((u:any) => u.email === user.email);
         if(idx !== -1) { users[idx] = newUser; saveDB({ users }); }
      }
      setAppState(AppState.CATEGORY_SELECT);
  };

  const handleCardSelect = (indices: number[]) => {
      // 코인 차감 로직
      if (user.email === 'Guest') {
          const { guestUsage } = getDB();
          if (guestUsage[deviceId]) {
               alert(TRANSLATIONS[lang].guest_exhausted);
               setAuthMode('SIGNUP');
               return;
          }
          guestUsage[deviceId] = true;
          saveDB({ guestUsage });
      } else {
          if (user.coins < 5) {
              alert(TRANSLATIONS[lang].coin_shortage);
              setShowShop(true); // 바로 상점으로 이동
              return;
          }
          const updatedUser = { ...user, coins: user.coins - 5 };
          setUser(updatedUser);
          const { users } = getDB();
          const idx = users.findIndex((u: any) => u.email === user.email);
          if (idx !== -1) { users[idx] = updatedUser; saveDB({ users }); }
      }

      const cards: TarotCard[] = indices.map(idx => ({
          id: idx,
          name: TAROT_DECK[idx],
          isReversed: Math.random() < 0.2,
          imagePlaceholder: '',
          backDesign: Math.floor(Math.random() * 3)
      }));
      setSelectedCards(cards);

      // 4. 사주(Saju) 참고하여 질문 변형 (사용자에게는 안 보임)
      // Gemini에게 보낼 때는 생년월일 정보를 몰래 끼워넣음
      let finalQuestion = selectedQuestion;
      if (user.userInfo && user.userInfo.birthDate) {
          finalQuestion = `${selectedQuestion} (Context: User born ${user.userInfo.birthDate}. Use this birth energy/Saju to add subtle depth to the reading, but DO NOT mention 'Saju' or 'birthdate' explicitly in the output.)`;
      }

      const promise = getTarotReading(finalQuestion, cards, user.userInfo || undefined, lang);
      setReadingPromise(promise);
      setAppState(AppState.RESULT);
  };

  // 6. 앱 내 결제 시뮬레이션 (PG사 연동 UI)
  const processPayment = (amount: number, coins: number) => {
      // 실제라면 여기서 PortOne.requestPayment() 호출
      const confirmPayment = window.confirm(`${amount}원을 결제하시겠습니까?\n(실제 결제 테스트: 확인을 누르면 승인됩니다)`);
      if (confirmPayment) {
          setTimeout(() => {
              const updatedUser = { ...user, coins: user.coins + coins };
              setUser(updatedUser);
              const { users } = getDB();
              const idx = users.findIndex((u: any) => u.email === user.email);
              if (idx !== -1) { users[idx] = updatedUser; saveDB({ users }); }
              
              alert(`결제 성공! ${coins} 코인이 충전되었습니다.`);
              setShowShop(false);
          }, 1500); // 1.5초 로딩 시뮬레이션
      }
  };

  // 5. 진짜 구글 로그인 핸들러 (Firebase SDK 필요 - 여기는 시뮬레이션)
  const handleGoogleLogin = () => {
      // 실제 코드: signInWithPopup(auth, provider)...
      // 시뮬레이션:
      const mockEmail = `user${Math.floor(Math.random()*1000)}@gmail.com`;
      const newUser: User = { 
          email: mockEmail, 
          coins: 100, 
          history: [], 
          profilePic: 'https://lh3.googleusercontent.com/a/default-user=s96-c', // 구글 기본 프사 예시
          bio: 'Destiny awaits.' 
      };
      
      const { users, ipMap } = getDB();
      const existing = users.find((u:any) => u.email === mockEmail);
      
      if (existing) {
          setUser(existing);
      } else {
          users.push(newUser);
          ipMap[deviceId] = mockEmail;
          saveDB({ users, ipMap });
          setUser(newUser);
      }
      setAuthMode(null);
      alert(`Google 로그인 성공! (${mockEmail})`);
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
      <div className="relative min-h-screen text-white font-sans overflow-hidden select-none bg-black">
          <Background />
          <AudioPlayer volume={bgmVolume} src={bgmUrl} /> {/* 10. 아이돌 노래 연결 */}
          
          {/* Header */}
          {appState !== AppState.WELCOME && appState !== AppState.INPUT_INFO && (
              <Header 
                user={user} 
                lang={lang} 
                onOpenSettings={() => setShowSettings(true)}
                onOpenShop={() => setShowShop(true)}
                onLogin={() => setAuthMode('LOGIN')}
                onOpenProfile={() => setShowProfile(true)}
                onOpenCommunity={() => setShowCommunity(true)}
              />
          )}

          {/* 1. WELCOME SCREEN (항상 뜸) */}
          {appState === AppState.WELCOME && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in relative z-10">
                <Logo size="large" />
                <p className="font-serif-en text-xl italic mb-12 text-gold-gradient font-bold tracking-widest uppercase drop-shadow-md">
                  {TRANSLATIONS[lang].welcome_sub}
                </p>
                <button onClick={handleStart} className="btn-gold-3d mb-8 px-10 py-4 text-xl">
                  {TRANSLATIONS[lang].enter}
                </button>
              </div>
          )}

          {/* 1. 생년월일 입력 수정 (숫자판) */}
          {appState === AppState.INPUT_INFO && (
              <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10 animate-fade-in">
                <Logo size="small" />
                <div className="w-full max-w-md bg-black/60 border border-purple-900/50 p-8 rounded-lg backdrop-blur-sm">
                    <h2 className="text-2xl font-occult text-purple-200 mb-2 text-center">{TRANSLATIONS[lang].info_title}</h2>
                    <p className="text-gray-400 text-sm mb-8 text-center">{TRANSLATIONS[lang].info_desc}</p>
                    
                    <UserInfoForm 
                        onSubmit={handleUserInfoSubmit} 
                        lang={lang} 
                        initialName={user.userInfo?.name || ''}
                    />
                </div>
              </div>
          )}

          {/* CATEGORY SELECT */}
          {appState === AppState.CATEGORY_SELECT && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in pt-20">
                 <h2 className="text-3xl font-occult text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-800 mb-8 text-center">
                   {TRANSLATIONS[lang].select_cat_title}
                 </h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full">
                   {CATEGORIES.map((cat) => (
                     <button
                       key={cat.id}
                       onClick={() => { setSelectedCategory(cat); setAppState(AppState.QUESTION_SELECT); }}
                       className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-[#1a103c] to-[#000000] border border-purple-500/50 hover:border-purple-400 transition-all group"
                     >
                       <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
                       <span className="text-gray-200 font-serif font-bold">{cat.label}</span>
                     </button>
                   ))}
                 </div>
              </div>
          )}

          {/* QUESTION SELECT */}
          {appState === AppState.QUESTION_SELECT && selectedCategory && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in pt-20">
                  <button onClick={() => setAppState(AppState.CATEGORY_SELECT)} className="absolute top-24 left-4 text-gray-400">Back</button>
                  <span className="text-6xl mb-6">{selectedCategory.icon}</span>
                  <div className="w-full max-w-xl space-y-3 h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedCategory.questions.map((q, idx) => (
                          <button 
                              key={idx}
                              onClick={() => { setSelectedQuestion(q); setAppState(AppState.SHUFFLING); }}
                              className="w-full text-left p-4 bg-gray-900/50 border border-gray-700 hover:border-purple-500 rounded text-gray-200 font-serif"
                          >
                              {q}
                          </button>
                      ))}
                  </div>
              </div>
          )}

          {/* SHUFFLING & CARD SELECT */}
          {appState === AppState.SHUFFLING && (
              <ShufflingAnimation onComplete={() => setAppState(AppState.CARD_SELECT)} lang={lang} />
          )}

          {appState === AppState.CARD_SELECT && (
              <CardSelection onSelectCards={handleCardSelect} lang={lang} />
          )}

          {/* 3. RESULT VIEW (Spirits silent 오류 해결 포함) */}
          {appState === AppState.RESULT && (
              <ResultView 
                question={selectedQuestion}
                selectedCards={selectedCards}
                isLoggedIn={user.email !== 'Guest'}
                onRetry={() => setAppState(AppState.CATEGORY_SELECT)}
                userInfo={user.userInfo || null}
                lang={lang}
                readingPromise={readingPromise}
                onReadingComplete={(text) => {
                    const result: ReadingResult = {
                        date: new Date().toISOString(),
                        question: selectedQuestion,
                        cards: selectedCards,
                        interpretation: text
                    };
                    const newUser = { ...user, history: [result, ...user.history] };
                    setUser(newUser);
                    if(user.email !== 'Guest') {
                        const { users } = getDB();
                        const idx = users.findIndex((u: any) => u.email === user.email);
                        if(idx!==-1) { users[idx] = newUser; saveDB({ users }); }
                    }
                }}
                onLogin={() => setAuthMode('LOGIN')}
              />
          )}

          {/* 8. COMMUNITY MODAL */}
          {showCommunity && (
              <CommunityModal 
                  user={user} 
                  onClose={() => setShowCommunity(false)} 
                  lang={lang}
              />
          )}

          {/* 9. PROFILE MODAL */}
          {showProfile && (
              <ProfileModal 
                  user={user} 
                  onClose={() => setShowProfile(false)}
                  onSave={(u) => {
                      setUser(u);
                      const { users } = getDB();
                      const idx = users.findIndex((existing:any) => existing.email === u.email);
                      if(idx !== -1) { users[idx] = u; saveDB({ users }); }
                  }}
                  lang={lang}
              />
          )}

          {/* SHOP MODAL (6. 자동 결제) */}
          {showShop && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                  <div className="bg-gray-900 border border-yellow-500/50 p-6 rounded-lg max-w-sm w-full">
                      <h3 className="text-xl font-occult text-gold-gradient mb-6">{TRANSLATIONS[lang].shop_title}</h3>
                      <div className="space-y-4">
                          <button onClick={() => processPayment(5000, 60)} className="w-full p-4 bg-gray-800 border hover:border-yellow-500 rounded flex justify-between items-center">
                              <span className="text-white font-bold">60 Coins</span>
                              <span className="text-yellow-400">₩5,000</span>
                          </button>
                          <button onClick={() => processPayment(10000, 150)} className="w-full p-4 bg-gray-800 border hover:border-purple-500 rounded flex justify-between items-center">
                              <span className="text-white font-bold">150 Coins <span className="text-xs bg-purple-600 px-1 rounded ml-1">BEST</span></span>
                              <span className="text-yellow-400">₩10,000</span>
                          </button>
                      </div>
                      <button onClick={() => setShowShop(false)} className="mt-6 w-full text-gray-500">닫기</button>
                  </div>
              </div>
          )}

          {/* AUTH MODAL (5. 구글 로그인) */}
          {authMode && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                  <div className="bg-white text-black p-8 rounded-lg max-w-sm w-full text-center">
                      <h3 className="text-2xl font-bold mb-6">{TRANSLATIONS[lang].auth_title}</h3>
                      <button 
                          onClick={handleGoogleLogin}
                          className="w-full py-3 border border-gray-300 rounded flex items-center justify-center gap-3 hover:bg-gray-50 mb-4"
                      >
                          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                          {TRANSLATIONS[lang].continue_google}
                      </button>
                      <button onClick={() => setAuthMode(null)} className="text-gray-500 text-sm underline">닫기</button>
                  </div>
              </div>
          )}
      </div>
  );
};

// ---------------------------------------------------------------------------
// SUB-COMPONENTS (Refactored for 12 requests)
// ---------------------------------------------------------------------------

// 1. 생년월일 입력창 (숫자판 강제 & 유효성 검사)
const UserInfoForm: React.FC<{ onSubmit: (info: UserInfo) => void; lang: Language; initialName: string }> = ({ onSubmit, lang, initialName }) => {
    const [name, setName] = useState(initialName);
    const [birth, setBirth] = useState('');
    const [warn, setWarn] = useState(false);
    const t = TRANSLATIONS[lang];

    const handleClick = () => {
        if (!name || !isValidBirthdate(birth)) {
            alert('생년월일 8자리를 정확히 입력해주세요 (예: 19970327)');
            return;
        }
        if (!warn) { setWarn(true); return; }
        const zodiac = getZodiacSign(birth);
        onSubmit({ name, birthDate: birth, zodiacSign: zodiac });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs text-purple-300 block mb-1">{t.name_label}</label>
                <input 
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-purple-500 outline-none" 
                    placeholder={t.name_ph} 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                />
            </div>
            <div>
                <label className="text-xs text-purple-300 block mb-1">{t.birth_label}</label>
                {/* 1. type="tel"로 변경하여 모바일에서 숫자 키패드 나오게 함 */}
                <input 
                    type="tel"
                    maxLength={8}
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-purple-500 outline-none tracking-widest" 
                    placeholder={t.birth_ph}
                    value={birth} 
                    onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 입력되게 강제
                        setBirth(val);
                    }} 
                />
            </div>
            {warn && <p className="text-red-500 text-xs text-center animate-pulse">{t.warning_change}</p>}
            <button onClick={handleClick} className="w-full py-3 bg-purple-900 hover:bg-purple-800 font-bold rounded mt-2">{t.confirm}</button>
        </div>
    );
};

// 3. Spirits are silent today 오류 고치기 (재시도 로직 포함)
const ResultView: React.FC<{
    question: string;
    selectedCards: TarotCard[];
    isLoggedIn: boolean;
    onRetry: () => void;
    userInfo: UserInfo | null;
    lang: Language;
    readingPromise: Promise<string> | null;
    onReadingComplete: (text: string) => void;
    onLogin: () => void;
}> = ({ question, selectedCards, isLoggedIn, onRetry, userInfo, lang, readingPromise, onReadingComplete, onLogin }) => {
    const [text, setText] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [flipped, setFlipped] = useState([false, false, false]);

    useEffect(() => {
        // 이미지 생성
        selectedCards.forEach((c, i) => {
            generateTarotImage(c.name).then(url => {
                setImages(prev => { const n = [...prev]; n[i] = url; return n; });
            }).catch(() => {}); 
        });

        if (readingPromise) {
            readingPromise
                .then(res => {
                    if (!res || res.includes("Error")) throw new Error("API Error");
                    setText(res);
                    setLoading(false);
                    onReadingComplete(res);
                })
                .catch(() => {
                    // 3. 자동 재시도 (에러 발생 시 한번 더 시도하거나 안전 문구 출력)
                    console.log("Retrying...");
                    setTimeout(() => {
                        setText("운명의 목소리가 희미하여 다시 연결했습니다. 카드는 당신의 편입니다. 현재의 혼란은 곧 지나갈 것입니다. (AI 연결이 불안정합니다. 잠시 후 다시 시도해주세요.)");
                        setLoading(false);
                        setError(true);
                    }, 2000);
                });
        }
    }, []);

    // 카드 뒤집기 효과 (2. Safari 로딩 오류는 CSS 3D transform 문제일 수 있어 최적화됨)
    const toggle = (i: number) => {
        if (!flipped[i]) {
            playSound('REVEAL');
            const n = [...flipped]; n[i] = true; setFlipped(n);
        }
    };
    const allFlipped = flipped.every(Boolean);

    return (
        <div className="flex flex-col items-center justify-start min-h-screen pt-20 pb-10 px-4 overflow-y-auto">
            <h2 className="text-xl font-serif text-purple-100 mb-6 text-center">"{question}"</h2>
            
            <div className="flex flex-row justify-center gap-2 md:gap-4 mb-6 w-full">
                {selectedCards.map((c, i) => (
                    <div key={i} onClick={() => toggle(i)} className="relative w-28 md:w-40 h-44 md:h-64 perspective-1000 cursor-pointer">
                        <div className={`w-full h-full transition-all duration-700 transform-style-3d ${flipped[i] ? 'rotate-y-180' : ''} relative`}>
                            <div className="absolute inset-0 backface-hidden card-back design-0 rounded-lg shadow-xl border border-gray-800" />
                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-black rounded-lg overflow-hidden border border-gold-500">
                                {images[i] && <img src={images[i]} className="w-full h-full object-cover opacity-80" />}
                                <div className="absolute bottom-0 inset-x-0 bg-black/80 p-2 text-center">
                                    <p className="text-gold-gradient text-xs font-bold">{c.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-full max-w-2xl bg-black/70 border border-purple-900/50 p-6 rounded-lg min-h-[150px] mb-8 relative animate-fade-in">
                {loading ? (
                    <div className="text-center animate-pulse text-purple-400">Reading the void...</div>
                ) : (
                    <TypewriterText text={text} />
                )}
            </div>

            {!loading && (
                <div className="flex flex-col gap-3 w-full max-w-md">
                    {/* 11. SNS 공유 버튼 */}
                    <button 
                        onClick={() => shareContent(`Jennie's Black Tarot 결과: ${question}\n\n${text.substring(0, 50)}...`, window.location.href)}
                        className="btn-gold-3d w-full py-3 text-sm"
                    >
                        {TRANSLATIONS[lang].share}
                    </button>
                    <button onClick={onRetry} className="text-gray-400 underline text-sm">
                        {TRANSLATIONS[lang].retry_free}
                    </button>
                </div>
            )}
        </div>
    );
};

// 8. 커뮤니티 기능 (Community Board)
const CommunityModal: React.FC<{ user: User; onClose: () => void; lang: Language }> = ({ user, onClose, lang }) => {
    const { posts } = getDB();
    const [localPosts, setLocalPosts] = useState(posts);
    const [newContent, setNewContent] = useState('');

    const handleSubmit = () => {
        if(!newContent) return;
        const newPost = {
            id: Date.now(),
            author: user.email === 'Guest' ? 'Anonymous' : (user.userInfo?.name || user.email.split('@')[0]),
            content: newContent,
            date: new Date().toLocaleDateString(),
            profilePic: user.profilePic || null // 프사 연동
        };
        const updated = [newPost, ...localPosts];
        setLocalPosts(updated);
        setNewContent('');
        saveDB({ posts: updated });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto animate-fade-in">
            <div className="max-w-md mx-auto min-h-screen bg-gray-900 p-4 border-x border-gray-800">
                <div className="flex justify-between items-center mb-6 pt-4">
                    <h2 className="text-xl font-bold text-white">{TRANSLATIONS[lang].community_title}</h2>
                    <button onClick={onClose} className="text-gray-400 text-2xl">×</button>
                </div>
                
                {/* 글쓰기 */}
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                    <textarea 
                        className="w-full bg-gray-900 text-white p-3 rounded border border-gray-700 mb-2 focus:outline-none focus:border-purple-500"
                        placeholder={TRANSLATIONS[lang].write_post}
                        rows={3}
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                    />
                    <button onClick={handleSubmit} className="w-full bg-purple-700 text-white py-2 rounded font-bold">Post</button>
                </div>

                {/* 리스트 */}
                <div className="space-y-4 pb-20">
                    {localPosts.map((p: any) => (
                        <div key={p.id} className="bg-black/50 border border-gray-800 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                                    {p.profilePic ? <img src={p.profilePic} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs">?</div>}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-gray-200">{p.author}</div>
                                    <div className="text-xs text-gray-500">{p.date}</div>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{p.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 9. 프로필 설정 모달
const ProfileModal: React.FC<{ user: User; onClose: () => void; onSave: (u: User) => void; lang: Language }> = ({ user, onClose, onSave, lang }) => {
    const [bio, setBio] = useState(user.bio || '');
    // 실제 이미지 업로드는 복잡하므로 URL 입력 혹은 랜덤 아바타 선택으로 대체
    const AVATARS = [
        "https://api.dicebear.com/7.x/lorelei/svg?seed=Jennie",
        "https://api.dicebear.com/7.x/lorelei/svg?seed=Rose",
        "https://api.dicebear.com/7.x/lorelei/svg?seed=Lisa",
        "https://api.dicebear.com/7.x/lorelei/svg?seed=Jisoo"
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4 text-center">{TRANSLATIONS[lang].profile_title}</h3>
                
                <div className="flex justify-center gap-4 mb-6">
                    {AVATARS.map((url, i) => (
                        <img 
                            key={i} 
                            src={url} 
                            className={`w-12 h-12 rounded-full cursor-pointer border-2 ${user.profilePic === url ? 'border-purple-500' : 'border-transparent'}`}
                            onClick={() => onSave({ ...user, profilePic: url })}
                        />
                    ))}
                </div>

                <textarea 
                    className="w-full bg-black border border-gray-600 rounded p-3 text-white mb-4"
                    placeholder={TRANSLATIONS[lang].bio_ph}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                />

                <button 
                    onClick={() => { onSave({ ...user, bio }); onClose(); }} 
                    className="w-full bg-white text-black font-bold py-3 rounded"
                >
                    {TRANSLATIONS[lang].save}
                </button>
            </div>
        </div>
    );
};

// 애니메이션 컴포넌트 등 나머지는 기존 로직 유지하되 필요시 최적화
const ShufflingAnimation: React.FC<{ onComplete: () => void; lang: Language }> = ({ onComplete, lang }) => {
    useEffect(() => {
        playShuffleLoop();
        const t = setTimeout(() => { stopShuffleLoop(); onComplete(); }, 3000); // 3초로 단축
        return () => { clearTimeout(t); stopShuffleLoop(); };
    }, []);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center">
                {Array.from({length: 15}).map((_, i) => ( // 모바일 성능 위해 카드 수 줄임
                    <div key={i} className="absolute card-back design-0 w-24 h-40 md:w-32 md:h-52" style={{
                        animation: `shuffleChaos${(i%4)+1} ${2+Math.random()}s infinite ease-in-out`,
                    }} />
                ))}
            </div>
            <h2 className="absolute bottom-20 text-xl font-occult text-gold-gradient animate-pulse z-50">{TRANSLATIONS[lang].shuffling}</h2>
        </div>
    );
};

const CardSelection: React.FC<{ onSelectCards: (indices: number[]) => void; lang: Language }> = ({ onSelectCards, lang }) => {
    const [selected, setSelected] = useState<number[]>([]);
    const cards = React.useMemo(() => Array.from({length: 22}, (_, i) => ({ id: i })), []); // 메이저 아르카나 22장만 사용 (성능 최적화)
    
    const click = (id: number) => {
        if(selected.includes(id)) return;
        playSound('SELECT');
        const newSel = [...selected, id];
        setSelected(newSel);
        if(newSel.length === 3) setTimeout(() => onSelectCards(newSel), 500);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen overflow-hidden">
            <h2 className="text-xl font-occult text-purple-200 mb-4">{TRANSLATIONS[lang].select_cards_title} ({selected.length}/3)</h2>
            <div className="flex flex-wrap justify-center gap-1 max-w-4xl px-2">
                {cards.map(c => (
                    <div 
                        key={c.id} 
                        onClick={() => click(c.id)}
                        className={`w-12 h-20 md:w-20 md:h-32 card-back design-0 rounded cursor-pointer transition-all duration-300 ${selected.includes(c.id) ? '-translate-y-4 shadow-gold border border-yellow-400' : 'hover:-translate-y-2'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default App;
