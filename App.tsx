import React, { useState, useEffect, useRef } from 'react';
import { AppState, CategoryKey, TarotCard, QuestionCategory, User, UserInfo, Language, ReadingResult } from './types';
import { CATEGORIES, TAROT_DECK } from './constants';
import Background from './components/Background';
import Logo from './components/Logo';
import AudioPlayer from './components/AudioPlayer';
import { getTarotReading, generateTarotImage } from './services/geminiService';
import { playSound, playShuffleLoop, stopShuffleLoop } from './services/soundService';

declare const html2canvas: any;

// ---------------------------------------------------------------------------
// CONFIG
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
    birth_ph: "YYYYMMDD (예: 19970327)",
    zodiac_ph: "별자리를 선택하세요",
    warning_change: "한 번 입력한 정보는 바꿀 수 없습니다. 계속하시겠습니까?",
    select_cat_title: "오늘의 타로를 선택하세요",
    shuffling: "운명을 섞는 중...",
    select_cards_title: "카드 세 장을 선택하세요",
    result_question: "Question",
    retry_paid: "타로 다시 보기 (-5 Black Coin)",
    retry_free: "운명을 다시 확인하시겠습니까?",
    login_btn: "로그인 하러 가기",
    login_btn_again: "타로 보러 가기",
    share: "결과 다운로드 하기", 
    settings_title: "Settings",
    bgm_control: "BGM Settings",
    language_control: "Language",
    history_btn: "나의 타로 기록 보기",
    shop_title: "Dark Treasury",
    guest: "Guest",
    auth_title_login: "Login",
    auth_title_signup: "Sign Up",
    continue_google: "Google 계정으로 계속하기",
    use_other: "다른 계정 사용",
    email_ph: "이메일 입력 (Google 등)",
    pw_ph: "비밀번호",
    create_pw_ph: "비밀번호 생성",
    next: "다음",
    complete: "완료",
    signup_success: "회원가입이 완료되었습니다!",
    login_success: "로그인이 완료되었습니다!",
    login_fail_match: "비밀번호와 이메일이 일치하지 않습니다",
    guest_exhausted: "Guest 운명 확인은 단 한 번뿐입니다. 더 깊은 답을 원하신다면 회원가입을 해주세요.",
    device_limit_msg: "이 기기에서는 이미 계정이 생성되었습니다.",
    coin_shortage: "Black Coin이 부족합니다.",
    input_placeholder: "구체적인 고민을 적어주세요.",
    confirm: "확인",
    shop_step1: "충전할 패키지를 선택하세요",
    shop_step2: "결제 수단을 선택하세요",
    payment_link_desc: "결제 페이지로 이동합니다...",
    reveal_hint: "카드를 터치하여 운명을 확인하세요",
    forgot_pw: "비밀번호를 잊어버렸습니까?",
    forgot_pw_alert: "비밀번호 찾기 기능은 아직 지원되지 않습니다.",
    guest_continue_prompt: "계속 운명을 확인하려면?",
    downloading: "저장 중..."
  },
  en: {
    welcome_sub: "Cards don't lie.",
    enter: "Enter the Void",
    info_title: "Prepare for Fate",
    info_desc: "Enter details for accuracy.",
    name_label: "Name",
    name_ph: "Name",
    birth_label: "Birthdate",
    birth_ph: "YYYYMMDD (e.g. 19970327)",
    zodiac_ph: "Select Zodiac Sign",
    warning_change: "Information cannot be changed once entered. Continue?",
    select_cat_title: "Select Theme",
    shuffling: "Shuffling...",
    select_cards_title: "Select 3 Cards",
    result_question: "Question",
    retry_paid: "Read Again (-5 Black Coin)",
    retry_free: "Retry?",
    login_btn: "Go to Login",
    login_btn_again: "Read Tarot",
    share: "Download Result", 
    settings_title: "Settings",
    bgm_control: "BGM",
    language_control: "Language",
    history_btn: "History",
    shop_title: "Treasury",
    guest: "Guest",
    auth_title_login: "Login",
    auth_title_signup: "Sign Up",
    continue_google: "Continue with Google",
    use_other: "Use another account",
    email_ph: "Enter Email",
    pw_ph: "Password",
    create_pw_ph: "Create Password",
    next: "Next",
    complete: "Complete",
    signup_success: "Sign up complete!",
    login_success: "Login complete!",
    login_fail_match: "Password and Email do not match",
    guest_exhausted: "Guest limit reached.",
    device_limit_msg: "Account already exists on this device.",
    coin_shortage: "Not enough Black Coins.",
    input_placeholder: "Describe your worry.",
    confirm: "Confirm",
    shop_step1: "Select Package",
    shop_step2: "Select Payment Method",
    payment_link_desc: "Redirecting to payment...",
    reveal_hint: "Touch cards to reveal your fate",
    forgot_pw: "Forgot Password?",
    forgot_pw_alert: "Password recovery not supported yet.",
    guest_continue_prompt: "To continue checking your fate?",
    downloading: "Saving..."
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

// Calculate Zodiac Sign from Date string (YYYYMMDD)
const getZodiacSign = (dateStr: string): string => {
    if (!dateStr || dateStr.length !== 8) return "Unknown";
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));

    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius (물병자리)";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces (물고기자리)";
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries (양자리)";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus (황소자리)";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return "Gemini (쌍둥이자리)";
    if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return "Cancer (게자리)";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo (사자자리)";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo (처녀자리)";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return "Libra (천칭자리)";
    if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return "Scorpio (전갈자리)";
    if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return "Sagittarius (사수자리)";
    return "Capricorn (염소자리)";
};

// Database simulation
const getDB = () => {
    const users = JSON.parse(localStorage.getItem('tarot_users') || '[]');
    const ipMap = JSON.parse(localStorage.getItem('device_ip_map') || '{}'); // DeviceID -> Email
    const guestUsage = JSON.parse(localStorage.getItem('guest_usage') || '{}'); // DeviceID -> boolean
    return { users, ipMap, guestUsage };
};

const saveDB = (users: any, ipMap: any, guestUsage: any) => {
    localStorage.setItem('tarot_users', JSON.stringify(users));
    localStorage.setItem('device_ip_map', JSON.stringify(ipMap));
    localStorage.setItem('guest_usage', JSON.stringify(guestUsage));
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
        const timer = setInterval(() => setVisibleCount(p => p < text.length ? p + 1 : p), 20);
        return () => clearInterval(timer);
    }, [text]);
    
    // Highlight headers logic for simple visual distinction
    const formattedText = text.substring(0, visibleCount);
    
    return (
        <div className="whitespace-pre-line leading-relaxed font-serif text-lg text-gray-200">
            {formattedText}
        </div>
    );
};

const Header: React.FC<{ 
    user: User; 
    lang: Language; 
    onOpenSettings: () => void;
    onOpenShop: () => void;
    onLogin: () => void;
}> = ({ user, lang, onOpenSettings, onOpenShop, onLogin }) => (
  <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/95 to-transparent pointer-events-none transition-all">
    <div className="flex items-center gap-2 pointer-events-auto">
      {/* Black Coin Icon - STRICTLY HIDDEN FOR GUESTS */}
      {user.email !== 'Guest' && (
          <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-full border border-yellow-600/30 backdrop-blur-md shadow-lg animate-fade-in">
              <span className="text-gray-300 font-bold font-serif text-sm hidden md:inline">Black Coin</span>
              <div className="flex items-center gap-2">
                 <GoldCoinIcon />
                 <span className="text-yellow-100 font-mono font-bold text-lg">{user.coins.toLocaleString()}</span>
              </div>
              {/* Charge Button */}
              <button 
                onClick={onOpenShop}
                className="w-6 h-6 flex items-center justify-center bg-yellow-700 hover:bg-yellow-500 rounded-full text-white text-xs font-extrabold border border-yellow-300 shadow-[0_0_8px_gold] transition-all hover:scale-110 active:scale-95"
                title="Charge Coins"
              >
                  +
              </button>
          </div>
      )}
    </div>
    <div className="flex items-center gap-4 pointer-events-auto">
      {/* Welcome Message - ONLY when logged in */}
      <div className="flex items-center gap-2 text-right">
         {user.email !== 'Guest' ? (
             <span className="text-gray-400 text-xs md:text-sm font-serif">Welcome, <span className="text-purple-300">{user.email}</span> 님!</span>
         ) : (
             <button 
                onClick={onLogin}
                className="text-gray-400 text-xs md:text-sm hover:text-white underline"
             >
                Login
             </button>
         )}
      </div>
      
      {/* Settings Gear Button */}
      <button 
        onClick={onOpenSettings}
        className="text-gray-400 hover:text-purple-400 transition-colors p-2"
        title={TRANSLATIONS[lang].settings_title}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </div>
);

// REAL-ISH GOOGLE LOGIN / AUTH SCREEN
const AuthScreen: React.FC<{ 
    initialMode: 'LOGIN' | 'SIGNUP'; 
    deviceId: string;
    onComplete: (user: User) => void; 
    onCancel: () => void;
    lang: Language;
}> = ({ initialMode, deviceId, onComplete, onCancel, lang }) => {
    const t = TRANSLATIONS[lang];
    const [viewMode, setViewMode] = useState<'LOGIN' | 'SIGNUP'>(initialMode);
    // Modes: SELECT (Google/Other), EMAIL_INPUT, PW_INPUT, SUCCESS
    const [step, setStep] = useState<'SELECT' | 'EMAIL_INPUT' | 'PW_INPUT' | 'CREATE_PW' | 'SUCCESS'>('SELECT');
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const { ipMap, users } = getDB();

    const resetState = (mode: 'LOGIN' | 'SIGNUP') => {
        setViewMode(mode);
        setStep('SELECT');
        setEmail('');
        setPassword('');
        setError('');
    };

    const handleGoogleStart = () => {
        // Simulating Google Login Flow - User enters their Google Email
        setStep('EMAIL_INPUT');
        setError("");
    };

    const handleEmailSubmit = () => {
        if (!email.includes('@')) {
            setError("유효하지 않은 이메일입니다.");
            return;
        }
        setError('');
        const exists = users.find((u: any) => u.email === email);

        if (viewMode === 'SIGNUP') {
            if (exists) {
                setError("이미 존재하는 계정입니다. 로그인을 시도해주세요.");
                return;
            }
            setStep('CREATE_PW');
        } else {
            // Login
            if (!exists) {
                 // For better UX, we might prompt to signup, but let's strict check
                 setError("존재하지 않는 계정입니다. 회원가입을 해주세요.");
                 return;
            }
            setStep('PW_INPUT');
        }
    };

    const handleFinalSubmit = () => {
        const { users, ipMap, guestUsage } = getDB();
        
        if (viewMode === 'SIGNUP') {
            const newUser: User = { 
                email, 
                coins: 100, // Bonus
                history: [], 
                password, 
                userInfo: { name: 'Unknown', birthDate: '', zodiacSign: '' }
            };
            users.push(newUser);
            ipMap[deviceId] = email;
            saveDB(users, ipMap, guestUsage);
            
            setStep('SUCCESS');
            setTimeout(() => onComplete(newUser), 1500);
        } else {
            const targetUser = users.find((u: any) => u.email === email);
            if (!targetUser || targetUser.password !== password) {
                setError(t.login_fail_match);
                return;
            }
            setStep('SUCCESS');
            setTimeout(() => onComplete(targetUser), 1500);
        }
    };

    if (step === 'SUCCESS') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black z-50">
                <div className="text-3xl text-gold-gradient font-bold mb-4 animate-bounce">
                    {viewMode === 'SIGNUP' ? t.signup_success : t.login_success}
                </div>
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-6 z-50 animate-fade-in relative">
            <button onClick={onCancel} className="absolute top-4 left-4 text-gray-500">✕</button>
            
            <div className="w-full max-w-sm border border-gray-300 rounded-lg p-8 shadow-xl bg-white relative">
                <div className="flex justify-center mb-6">
                    <span className="text-4xl font-bold text-blue-500">G</span>
                </div>

                {/* Tabs */}
                {step === 'SELECT' && (
                    <div className="flex mb-6 border-b">
                        <button 
                            className={`flex-1 pb-2 ${viewMode === 'LOGIN' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-400'}`}
                            onClick={() => resetState('LOGIN')}
                        >
                            {t.auth_title_login}
                        </button>
                        <button 
                            className={`flex-1 pb-2 ${viewMode === 'SIGNUP' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-400'}`}
                            onClick={() => resetState('SIGNUP')}
                        >
                            {t.auth_title_signup}
                        </button>
                    </div>
                )}
                
                {step === 'SELECT' && (
                    <div className="space-y-4">
                        <button onClick={handleGoogleStart} className="w-full flex items-center justify-center p-3 border hover:bg-gray-50 rounded text-gray-700 font-medium">
                           <span className="mr-2">🔵</span> {t.continue_google}
                        </button>
                        <button onClick={() => setStep('EMAIL_INPUT')} className="w-full p-3 border rounded text-sm font-medium hover:bg-gray-50 text-gray-700">
                            {t.use_other}
                        </button>
                        {viewMode === 'LOGIN' && (
                             <button onClick={() => alert(t.forgot_pw_alert)} className="text-xs text-blue-500 hover:underline w-full text-center mt-2">
                                 {t.forgot_pw}
                             </button>
                        )}
                    </div>
                )}

                {step === 'EMAIL_INPUT' && (
                    <div className="space-y-6 animate-fade-in">
                         <h3 className="text-center font-bold">{viewMode === 'LOGIN' ? t.auth_title_login : t.auth_title_signup}</h3>
                         <input 
                            className="w-full p-3 border rounded outline-blue-500"
                            placeholder={t.email_ph}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                         />
                         {error && <p className="text-red-500 text-sm">{error}</p>}
                         <div className="flex justify-between items-center">
                            <button onClick={() => setStep('SELECT')} className="text-gray-500 text-sm">Back</button>
                            <button onClick={handleEmailSubmit} className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
                                {t.next}
                            </button>
                         </div>
                    </div>
                )}

                {(step === 'PW_INPUT' || step === 'CREATE_PW') && (
                    <div className="space-y-6 animate-fade-in">
                         <div className="border p-2 rounded-full w-fit mb-2 text-xs bg-gray-100 flex items-center gap-2 px-4 mx-auto">
                            👤 {email}
                         </div>
                         <h3 className="text-center font-bold">{step === 'CREATE_PW' ? t.create_pw_ph : t.auth_title_login}</h3>
                         <input 
                            type="password"
                            className="w-full p-3 border rounded outline-blue-500"
                            placeholder={step === 'CREATE_PW' ? "새로운 비밀번호를 입력하세요" : t.pw_ph}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                         />
                         {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
                         <div className="flex justify-between items-center">
                            <button onClick={() => setStep('EMAIL_INPUT')} className="text-gray-500 text-sm">Cancel</button>
                            <button onClick={handleFinalSubmit} className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
                                {viewMode === 'SIGNUP' ? t.complete : t.auth_title_login}
                            </button>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// MAIN APP
// ---------------------------------------------------------------------------

const App: React.FC = () => {
  const deviceId = getDeviceId();
  // FORCE WELCOME SCREEN on load, check login in background
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [user, setUser] = useState<User>({ email: 'Guest', coins: 0, history: [] });
  const [authMode, setAuthMode] = useState<'LOGIN'|'SIGNUP'|null>(null);
  
  // Selection State
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [readingPromise, setReadingPromise] = useState<Promise<string> | null>(null);
  
  // Settings & Shop
  const [lang, setLang] = useState<Language>('ko'); 
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [bgmStopped, setBgmStopped] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  
  // Shop State
  const [shopStep, setShopStep] = useState<'AMOUNT' | 'METHOD'>('AMOUNT');
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [selectedCoins, setSelectedCoins] = useState<number>(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Initialization: Load User but stay on Welcome
  useEffect(() => {
     const { users, ipMap } = getDB();
     const registeredEmail = ipMap[deviceId];
     if (registeredEmail) {
         const found = users.find((u: any) => u.email === registeredEmail);
         if (found) {
             setUser(found);
         }
     }
  }, []);

  const handleStart = () => {
      const { guestUsage } = getDB();
      if (user.email === 'Guest') {
          if (guestUsage[deviceId]) {
              alert(TRANSLATIONS[lang].guest_exhausted);
              setAuthMode('SIGNUP'); // Force signup
          } else {
              setAppState(AppState.INPUT_INFO);
          }
      } else {
          // Check if logged in user has info. If not, go to INPUT_INFO
          if (!user.userInfo || !user.userInfo.name) {
              setAppState(AppState.INPUT_INFO);
          } else {
              setAppState(AppState.CATEGORY_SELECT);
          }
      }
  };

  const handleUserInfoSubmit = (info: UserInfo) => {
      // 1. Update State
      const newUser = { ...user, userInfo: info };
      setUser(newUser);
      
      // 2. PERSIST to DB immediately so it's not lost
      if (user.email !== 'Guest') {
          const { users, ipMap, guestUsage } = getDB();
          const idx = users.findIndex((u: any) => u.email === user.email);
          if (idx !== -1) {
              users[idx] = newUser;
              saveDB(users, ipMap, guestUsage);
          }
      }

      setAppState(AppState.CATEGORY_SELECT);
  };

  const checkEligibility = () => {
      if (user.email === 'Guest') {
          const { guestUsage } = getDB();
          if (guestUsage[deviceId]) {
              alert(TRANSLATIONS[lang].guest_exhausted);
              setAuthMode('LOGIN');
              return false;
          }
          return true;
      }
      if (user.coins < 5) {
          alert(TRANSLATIONS[lang].coin_shortage);
          return false;
      }
      return true;
  };

  const handleCardSelect = (indices: number[]) => {
      // Deduct coins / track usage
      if (user.email === 'Guest') {
          const { users, ipMap, guestUsage } = getDB();
          guestUsage[deviceId] = true;
          saveDB(users, ipMap, guestUsage);
      } else {
          const updatedUser = { ...user, coins: user.coins - 5 };
          setUser(updatedUser);
          const { users, ipMap, guestUsage } = getDB();
          const idx = users.findIndex((u: any) => u.email === user.email);
          if (idx !== -1) {
             users[idx] = updatedUser;
             saveDB(users, ipMap, guestUsage);
          }
      }

      const cards: TarotCard[] = indices.map(idx => ({
          id: idx,
          name: TAROT_DECK[idx],
          isReversed: Math.random() < 0.2,
          imagePlaceholder: '',
          backDesign: Math.floor(Math.random() * 3)
      }));
      setSelectedCards(cards);

      // Pass user info explicitly for personalization
      const promise = getTarotReading(selectedQuestion, cards, user.userInfo || undefined, lang);
      setReadingPromise(promise);
      setAppState(AppState.RESULT);
  };

  const handleAuthComplete = (loggedInUser: User) => {
      setUser(loggedInUser);
      setAuthMode(null);
      // If user has info, go to category, else input info
      if (loggedInUser.userInfo && loggedInUser.userInfo.name) {
          setAppState(AppState.CATEGORY_SELECT);
      } else {
          setAppState(AppState.INPUT_INFO);
      }
  };
  
  // REALISTIC PAYMENT SIMULATION
  const handlePayment = (method: string) => {
      setIsProcessingPayment(true);
      
      // Simulate Async Payment Gateway Delay
      setTimeout(() => {
          setIsProcessingPayment(false);
          setShowShop(false);
          setShopStep('AMOUNT');
          
          // Add Coins
          const updatedUser = { ...user, coins: user.coins + selectedCoins };
          setUser(updatedUser);
          
          if(user.email !== 'Guest') {
              const { users, ipMap, guestUsage } = getDB();
              const idx = users.findIndex((u: any) => u.email === user.email);
              if (idx !== -1) {
                  users[idx] = updatedUser;
                  saveDB(users, ipMap, guestUsage);
              }
          }
          
          alert(`Successfully charged ${selectedCoins} Coins via ${method}!`);
      }, 3000); // 3 seconds processing time
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  if (authMode) {
      return <AuthScreen 
          initialMode={authMode} 
          deviceId={deviceId} 
          onComplete={handleAuthComplete} 
          onCancel={() => setAuthMode(null)} 
          lang={lang} 
      />;
  }

  return (
      <div className="relative min-h-screen text-white font-sans overflow-hidden select-none">
          <Background />
          <AudioPlayer volume={bgmVolume} userStopped={bgmStopped} />
          
          {appState !== AppState.WELCOME && appState !== AppState.INPUT_INFO && (
              <Header 
                user={user} 
                lang={lang} 
                onOpenSettings={() => setShowSettings(true)}
                onOpenShop={() => { setShowShop(true); setShopStep('AMOUNT'); }}
                onLogin={() => {
                   const { ipMap } = getDB();
                   if(ipMap[deviceId]) setAuthMode('LOGIN'); else setAuthMode('SIGNUP');
                }}
              />
          )}

          {appState === AppState.WELCOME && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in relative z-10">
                <Header 
                    user={user} 
                    lang={lang} 
                    onOpenSettings={() => setShowSettings(true)}
                    onOpenShop={() => { setShowShop(true); setShopStep('AMOUNT'); }}
                    onLogin={() => {
                        const { ipMap } = getDB();
                        if(ipMap[deviceId]) setAuthMode('LOGIN'); else setAuthMode('SIGNUP');
                    }}
                />
                
                <Logo size="large" />
                <p className="font-serif-en text-xl italic mb-12 text-gold-gradient font-bold tracking-widest uppercase drop-shadow-md">
                  {TRANSLATIONS[lang].welcome_sub}
                </p>
                <button onClick={handleStart} className="btn-gold-3d mb-8">
                  {TRANSLATIONS[lang].enter}
                </button>
              </div>
          )}

          {appState === AppState.INPUT_INFO && (
              <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10 animate-fade-in">
                <Logo size="small" />
                <div className="w-full max-w-md bg-black/60 border border-purple-900/50 p-8 rounded-lg backdrop-blur-sm">
                    <h2 className="text-2xl font-occult text-purple-200 mb-2 text-center">{TRANSLATIONS[lang].info_title}</h2>
                    <p className="text-gray-400 text-sm mb-8 text-center">{TRANSLATIONS[lang].info_desc}</p>
                    <UserInfoForm onSubmit={handleUserInfoSubmit} lang={lang} />
                </div>
              </div>
          )}

          {appState === AppState.CATEGORY_SELECT && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in pt-20">
                 <h2 className="text-3xl font-occult text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-800 mb-8 text-center">
                   {TRANSLATIONS[lang].select_cat_title}
                 </h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full">
                   {CATEGORIES.map((cat) => (
                     <button
                       key={cat.id}
                       onClick={() => { if(checkEligibility()) { setSelectedCategory(cat); setAppState(AppState.QUESTION_SELECT); } }}
                       className="relative flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-200 bg-gradient-to-br from-[#1a103c] to-[#000000] border border-purple-500/50 shadow-[0_6px_0_#4c1d95] hover:-translate-y-1 hover:shadow-[0_8px_0_#4c1d95] hover:border-purple-400 active:translate-y-1 active:shadow-none backdrop-blur-sm group"
                     >
                       <span className="text-4xl mb-2 filter drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] transition-transform duration-300 group-hover:scale-110">{cat.icon}</span>
                       <span className="text-gray-200 font-serif font-bold tracking-wide group-hover:text-white transition-colors">{cat.label}</span>
                     </button>
                   ))}
                 </div>
              </div>
          )}

          {appState === AppState.QUESTION_SELECT && selectedCategory && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in">
                  <button onClick={() => setAppState(AppState.CATEGORY_SELECT)} className="absolute top-24 left-4 text-gray-400">Back</button>
                  <span className="text-6xl mb-4">{selectedCategory.icon}</span>
                  <div className="w-full max-w-xl space-y-3">
                      {selectedCategory.questions.map((q, idx) => (
                          <button 
                              key={idx}
                              onClick={() => { if(checkEligibility()) { setSelectedQuestion(q); setAppState(AppState.SHUFFLING); } }}
                              className="w-full text-left p-4 bg-gray-900/50 border border-gray-700 hover:border-purple-500 rounded text-gray-200 font-serif"
                          >
                              {q}
                          </button>
                      ))}
                      
                      {/* CUSTOM INPUT FIELD */}
                      <div className="mt-6 pt-4 border-t border-gray-700 flex flex-col gap-2">
                          <input 
                             type="text" 
                             className="w-full p-3 bg-black/50 border border-gray-600 rounded text-white focus:border-purple-500 outline-none"
                             placeholder={TRANSLATIONS[lang].input_placeholder}
                             id="custom-q-input"
                             onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                     const val = e.currentTarget.value;
                                     if(val && checkEligibility()) { setSelectedQuestion(val); setAppState(AppState.SHUFFLING); }
                                 }
                             }}
                          />
                          <button 
                             onClick={() => {
                                 const input = document.getElementById('custom-q-input') as HTMLInputElement;
                                 if(input && input.value && checkEligibility()) { setSelectedQuestion(input.value); setAppState(AppState.SHUFFLING); }
                             }}
                             className="w-full py-3 bg-purple-900/80 hover:bg-purple-800 text-white rounded font-bold"
                          >
                             {TRANSLATIONS[lang].confirm}
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {appState === AppState.SHUFFLING && (
              <ShufflingAnimation onComplete={() => setAppState(AppState.CARD_SELECT)} lang={lang} />
          )}

          {appState === AppState.CARD_SELECT && (
              <CardSelection onSelectCards={handleCardSelect} lang={lang} />
          )}

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
                        const { users, ipMap, guestUsage } = getDB();
                        const idx = users.findIndex((u: any) => u.email === user.email);
                        if(idx!==-1) users[idx] = newUser;
                        saveDB(users, ipMap, guestUsage);
                    }
                }}
                onLogin={() => {
                   const { ipMap } = getDB();
                   if(ipMap[deviceId]) setAuthMode('LOGIN'); else setAuthMode('SIGNUP');
                }}
              />
          )}

          {/* SHOP MODAL */}
          {showShop && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
                 <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-yellow-500/50 p-8 rounded-lg max-w-md w-full shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                     <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-700">
                         <h3 className="text-xl font-occult text-gold-gradient tracking-wider">{TRANSLATIONS[lang].shop_title}</h3>
                         {!isProcessingPayment && (
                            <button onClick={() => setShowShop(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
                         )}
                     </div>
                     
                     {isProcessingPayment ? (
                         <div className="flex flex-col items-center justify-center py-10 space-y-4">
                             <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                             <p className="text-yellow-100 font-serif animate-pulse">Processing Payment...</p>
                             <p className="text-gray-500 text-xs">Securely connecting to Payment Gateway</p>
                         </div>
                     ) : (
                         <>
                             {shopStep === 'AMOUNT' && (
                                 <div className="space-y-6">
                                     <p className="text-center text-gray-300 font-serif">{TRANSLATIONS[lang].shop_step1}</p>
                                     <div className="grid grid-cols-2 gap-4">
                                         <button 
                                             onClick={() => { setSelectedAmount(5000); setSelectedCoins(60); setShopStep('METHOD'); }}
                                             className="group relative p-6 bg-gray-800 border border-gray-600 rounded-xl hover:border-yellow-500 hover:bg-gray-800/80 transition-all active:scale-95 flex flex-col items-center gap-3 overflow-hidden"
                                         >
                                             <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
                                             <GoldCoinIcon sizeClass="w-16 h-16" />
                                             <div className="flex flex-col items-center">
                                                 <span className="text-lg font-bold text-white">60 Coins</span>
                                                 <span className="text-2xl font-serif text-yellow-100">₩5,000</span>
                                             </div>
                                             <span className="absolute top-2 right-2 text-[10px] bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">Recommended</span>
                                         </button>
                                         <button 
                                             onClick={() => { setSelectedAmount(10000); setSelectedCoins(150); setShopStep('METHOD'); }}
                                             className="group relative p-6 bg-gray-800 border border-gray-600 rounded-xl hover:border-yellow-500 hover:bg-gray-800/80 transition-all active:scale-95 flex flex-col items-center gap-3 overflow-hidden"
                                         >
                                             <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
                                             <div className="relative">
                                                <GoldCoinIcon sizeClass="w-16 h-16" />
                                                <span className="absolute -top-1 -right-2 text-xl">✨</span>
                                             </div>
                                             <div className="flex flex-col items-center">
                                                 <span className="text-lg font-bold text-white">150 Coins</span>
                                                 <span className="text-2xl font-serif text-yellow-100">₩10,000</span>
                                             </div>
                                             <span className="absolute top-2 right-2 text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">Best Value</span>
                                         </button>
                                     </div>
                                 </div>
                             )}

                             {shopStep === 'METHOD' && (
                                 <div className="space-y-6">
                                     <div className="flex items-center justify-between">
                                        <button onClick={() => setShopStep('AMOUNT')} className="text-sm text-gray-500 hover:text-white flex items-center gap-1">← Back</button>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400">Total Payment</div>
                                            <span className="text-xl text-yellow-100 font-bold font-serif">₩{selectedAmount.toLocaleString()}</span>
                                        </div>
                                     </div>
                                     
                                     <div className="bg-black/30 p-4 rounded-lg border border-white/10 text-center">
                                         <span className="text-gray-400 text-sm">Selected: </span>
                                         <span className="text-yellow-400 font-bold ml-1">{selectedCoins} Black Coins</span>
                                     </div>

                                     <p className="text-center text-gray-300 font-serif">{TRANSLATIONS[lang].shop_step2}</p>
                                     
                                     <div className="grid grid-cols-2 gap-3">
                                         {['PayPal', 'Toss', 'KakaoBank', 'KB', 'Shinhan', 'Apple Pay'].map(method => (
                                             <button 
                                                 key={method}
                                                 onClick={() => handlePayment(method)}
                                                 className="p-3 bg-gray-800 border border-gray-700 rounded hover:bg-indigo-900/40 hover:border-indigo-400 hover:text-white transition-all active:scale-95 text-sm font-medium text-gray-300"
                                             >
                                                 {method}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </>
                     )}
                 </div>
             </div>
          )}

          {/* SETTINGS MODAL */}
          {showSettings && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                 <div className="bg-gray-900 border border-purple-500/50 p-6 rounded-lg max-w-sm w-full mx-4 shadow-2xl">
                     <h3 className="text-xl font-occult text-purple-200 mb-6 border-b border-gray-700 pb-2">{TRANSLATIONS[lang].settings_title}</h3>
                     
                     <div className="mb-6">
                         <label className="block text-gray-400 mb-2">{TRANSLATIONS[lang].bgm_control}</label>
                         <div className="flex items-center gap-4">
                             <button onClick={() => setBgmStopped(!bgmStopped)} className="text-2xl p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                                 {bgmStopped ? '🔇' : '🔊'}
                             </button>
                             <input 
                                type="range" 
                                min="0" max="1" step="0.1" 
                                value={bgmVolume} 
                                onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                                className="w-full accent-purple-500 cursor-pointer"
                             />
                         </div>
                     </div>

                     {/* Language Control */}
                     <div className="mb-6">
                         <label className="block text-gray-400 mb-2">{TRANSLATIONS[lang].language_control}</label>
                         <div className="flex gap-2">
                             <button 
                                onClick={() => setLang('ko')}
                                className={`flex-1 py-2 rounded border transition-all ${lang === 'ko' ? 'bg-purple-900 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                             >
                                 Korean
                             </button>
                             <button 
                                onClick={() => setLang('en')}
                                className={`flex-1 py-2 rounded border transition-all ${lang === 'en' ? 'bg-purple-900 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                             >
                                 English
                             </button>
                         </div>
                     </div>

                     <div className="mb-8">
                         <label className="block text-gray-400 mb-2">My History</label>
                         {user.email !== 'Guest' ? (
                             <div className="max-h-40 overflow-y-auto bg-black/50 p-2 rounded text-xs text-gray-300">
                                 {user.history.length === 0 ? "No records." : user.history.map((h, i) => (
                                     <div key={i} className="mb-2 border-b border-gray-800 pb-1">
                                         <div className="text-purple-300">{h.date.split('T')[0]}</div>
                                         <div>{h.question}</div>
                                     </div>
                                 ))}
                             </div>
                         ) : (
                             <p className="text-sm text-gray-500">Login to view history.</p>
                         )}
                     </div>

                     <button 
                        onClick={() => setShowSettings(false)}
                        className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors border border-gray-600 font-bold"
                     >
                         Close
                     </button>
                 </div>
             </div>
          )}
      </div>
  );
};

// Sub-components for cleaner App.tsx

const UserInfoForm: React.FC<{ onSubmit: (info: UserInfo) => void; lang: Language }> = ({ onSubmit, lang }) => {
    const [name, setName] = useState('');
    const [birth, setBirth] = useState('');
    const [warn, setWarn] = useState(false);
    const t = TRANSLATIONS[lang];

    const handleClick = () => {
        if (!name || birth.length !== 8) return;
        if (!warn) { setWarn(true); return; }
        const zodiac = getZodiacSign(birth);
        onSubmit({ name, birthDate: birth, zodiacSign: zodiac });
    };

    return (
        <div className="space-y-4">
            <input 
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-purple-500 focus:outline-none" 
                placeholder={t.name_ph} 
                value={name} 
                onChange={e => setName(e.target.value)} 
            />
            {/* UPDATED: Tel input for numeric keypad + 8 digit limit */}
            <input 
                type="tel"
                maxLength={8}
                pattern="\d*"
                placeholder={t.birth_ph}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-purple-500 focus:outline-none font-mono tracking-wider" 
                value={birth} 
                onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if(val.length <= 8) setBirth(val);
                }}
            />
            {warn && <p className="text-red-500 text-sm text-center animate-pulse">{t.warning_change}</p>}
            <button 
                onClick={handleClick} 
                disabled={!name || birth.length !== 8}
                className="w-full py-3 bg-purple-900 hover:bg-purple-800 font-bold rounded mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {t.next}
            </button>
        </div>
    );
};

const ShufflingAnimation: React.FC<{ onComplete: () => void; lang: Language }> = ({ onComplete, lang }) => {
    useEffect(() => {
        playShuffleLoop();
        const t = setTimeout(() => { stopShuffleLoop(); onComplete(); }, 4000);
        return () => { clearTimeout(t); stopShuffleLoop(); };
    }, []);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center">
                {Array.from({length: 30}).map((_, i) => (
                    <div key={i} className="absolute card-back design-0 w-32 h-52" style={{
                        animation: `shuffleChaos${(i%4)+1} ${2+Math.random()}s infinite ease-in-out`,
                        animationDelay: `${i*0.05}s`
                    }} />
                ))}
            </div>
            <h2 className="absolute bottom-20 text-2xl font-occult text-gold-gradient animate-pulse z-50">{TRANSLATIONS[lang].shuffling}</h2>
        </div>
    );
};

const CardSelection: React.FC<{ onSelectCards: (indices: number[]) => void; lang: Language }> = ({ onSelectCards, lang }) => {
    const [selected, setSelected] = useState<number[]>([]);
    const [layoutFactor, setLayoutFactor] = useState(18); // Default spacing
    
    // Optimized: Increased card count for better visual "fan" appearance
    const total = 48; 
    
    // Responsive layout adjustment
    useEffect(() => {
        const updateLayout = () => {
            if (window.innerWidth < 640) {
                 // Adjusted for mobile: closer packing but wider fan arc if possible,
                 // or just simpler tight packing.
                 setLayoutFactor(8); 
            } else {
                 setLayoutFactor(18);
            }
        };
        updateLayout();
        window.addEventListener('resize', updateLayout);
        return () => window.removeEventListener('resize', updateLayout);
    }, []);

    const cards = React.useMemo(() => Array.from({length: total}, (_, i) => ({
        id: i, 
        iVal: i
    })), [total]);

    const click = (id: number) => {
        if(selected.includes(id)) return;
        
        // Haptic feedback for satisfaction on mobile
        if (navigator.vibrate) navigator.vibrate(10);
        
        playSound('SELECT');
        const newSel = [...selected, id];
        setSelected(newSel);
        if(newSel.length === 3) setTimeout(() => onSelectCards(newSel), 1000);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen overflow-hidden touch-none">
            <h2 className="text-2xl font-occult text-purple-200 mb-10">{TRANSLATIONS[lang].select_cards_title} ({selected.length}/3)</h2>
            <div className="relative h-64 w-full max-w-4xl flex justify-center items-center perspective-1000">
                {cards.map(c => {
                    const isSelected = selected.includes(c.id);
                    // Standard fan distribution calculation
                    const x = (c.iVal - total/2) * layoutFactor;
                    const y = Math.abs(c.iVal - total/2) * (window.innerWidth < 640 ? 3 : 4); // Flatter arc on mobile
                    const rot = (c.iVal - total/2) * (window.innerWidth < 640 ? 1.5 : 1.8);

                    return (
                        <div 
                            key={c.id}
                            className={`absolute w-32 h-52 transition-transform duration-300 will-change-transform
                                ${isSelected ? 'z-[100]' : 'hover:z-50'}
                            `}
                            style={{ 
                                transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
                            }}
                        >
                            <div 
                                onClick={() => click(c.id)} 
                                className={`w-full h-full card-back design-0 cursor-pointer transition-all duration-300 cubic-bezier(0.25, 0.46, 0.45, 0.94)
                                    ${isSelected 
                                        ? '-translate-y-16 scale-110 shadow-[0_0_50px_rgba(253,224,71,0.6)] ring-2 ring-yellow-200 brightness-110' 
                                        : 'hover:-translate-y-4 hover:scale-110 hover:brightness-125 hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]' 
                                    }
                                `}
                            />
                        </div>
                    );
                })}
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
    onLogin: () => void;
}> = ({ question, selectedCards, isLoggedIn, onRetry, userInfo, lang, readingPromise, onReadingComplete, onLogin }) => {
    const [text, setText] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [flipped, setFlipped] = useState([false, false, false]);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Ref for capturing the luxurious export image
    const captureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Image generation in background
        selectedCards.forEach((c, i) => {
            generateTarotImage(c.name).then(url => {
                setImages(prev => {
                    const next = [...prev];
                    next[i] = url;
                    return next;
                });
            }).catch(() => {}); 
        });

        if (readingPromise) {
            readingPromise.then(res => {
                setText(res);
                setLoading(false);
                setFlipped([true, true, true]); // Auto reveal
                onReadingComplete(res);
            }).catch(e => {
                // FAILURE: Show alert and exit
                alert("Network Error: Offline mode is not supported. Please check your connection.");
                onRetry(); // Immediately go back
            });
        }
    }, []);

    const toggle = (i: number) => {
        if (!flipped[i]) {
            playSound('REVEAL');
            const n = [...flipped]; n[i] = true; setFlipped(n);
        }
    };
    const allFlipped = flipped.every(Boolean);

    const handleDownload = async () => {
        if (!captureRef.current) return;
        setIsDownloading(true);

        try {
            // Optimization: Remove delay to force rapid capture, utilize requestAnimationFrame to ensure render
            await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
            
            const canvas = await html2canvas(captureRef.current, {
                useCORS: true,
                scale: 2, // High resolution
                backgroundColor: '#000000', // Ensure dark background
            });
            
            const link = document.createElement('a');
            link.download = `jennies-black-tarot-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error("Download failed", e);
            alert("이미지 저장에 실패했습니다.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen pt-24 pb-10 px-4 overflow-y-auto relative">
            
            {/* INVISIBLE EXPORT CONTAINER (ABSOLUTE POSITIONING OFFSCREEN) */}
            <div 
                ref={captureRef}
                style={{
                    position: 'fixed',
                    left: '-9999px', // Hide offscreen
                    top: 0,
                    width: '600px', // Fixed width for consistent export layout
                    minHeight: '1000px',
                    padding: '40px',
                    background: 'linear-gradient(to bottom, #1e1b4b, #000000)',
                    fontFamily: "'Noto Serif KR', serif",
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: -1, // Ensure it's behind everything
                }}
            >
                <div className="absolute inset-0 border-[10px] border-double border-yellow-700/50 pointer-events-none"></div>
                
                {/* Export Header */}
                <h1 className="text-4xl font-occult text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 font-bold mb-4 drop-shadow-md">
                    Jennie's Black Tarot
                </h1>
                <div className="w-32 h-1 bg-yellow-600 mb-8 opacity-70"></div>
                
                {/* Export Question */}
                <div className="mb-8 text-center px-4">
                    <p className="text-gray-400 text-sm mb-2 font-occult uppercase tracking-widest">Question</p>
                    <h2 className="text-2xl font-serif text-yellow-100 font-bold leading-relaxed">"{question}"</h2>
                </div>

                {/* Export Cards */}
                <div className="flex justify-center gap-4 mb-8 w-full px-4">
                    {selectedCards.map((c, i) => (
                        <div key={i} className="flex flex-col items-center w-1/3">
                            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border-2 border-yellow-600 shadow-2xl mb-2">
                                {/* Use Image or Placeholder for Export */}
                                {images[i] ? (
                                    <img 
                                        src={images[i]} 
                                        className="w-full h-full object-cover" 
                                        crossOrigin="anonymous" // Crucial for html2canvas
                                        alt={c.name}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-900"></div>
                                )}
                            </div>
                            <p className="text-xs text-yellow-500 font-occult text-center mt-1">{c.name}</p>
                            <p className="text-[10px] text-gray-500 text-center uppercase">{c.isReversed ? 'Reversed' : 'Upright'}</p>
                        </div>
                    ))}
                </div>

                {/* Export Text */}
                <div className="w-full bg-black/40 border border-yellow-900/30 p-6 rounded-lg mb-8 backdrop-blur-sm">
                    <div className="whitespace-pre-line text-sm leading-7 text-gray-200 text-justify">
                        {text}
                    </div>
                </div>

                {/* Export Footer */}
                <div className="mt-auto text-center opacity-60">
                    <p className="font-occult text-xs text-yellow-700 tracking-[0.3em] uppercase">Cards Don't Lie</p>
                    <p className="text-[10px] text-gray-600 mt-1">jennies-black-tarot.com</p>
                </div>
            </div>

            {/* NORMAL VIEW */}
            <h2 className="text-2xl font-serif text-purple-100 mb-8 text-center">"{question}"</h2>
            
            {!allFlipped && (
                <div className="text-yellow-400 font-serif animate-pulse mb-4 text-sm font-bold tracking-widest uppercase">
                    {TRANSLATIONS[lang].reveal_hint}
                </div>
            )}

            {/* Mobile: Horizontal Scale (All visible) | Desktop: Standard row */}
            <div className="flex flex-row justify-center gap-2 md:gap-4 mb-8 w-full transform scale-75 md:scale-100 origin-top">
                {selectedCards.map((c, i) => (
                    <div key={i} onClick={() => toggle(i)} className="relative w-32 md:w-48 h-52 md:h-80 perspective-1000 cursor-pointer group shrink-0">
                        {!flipped[i] && (
                             <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">Tap</div>
                         )}
                         
                        <div className={`w-full h-full transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] transform-style-3d ${flipped[i] ? 'rotate-y-180 scale-105 shadow-[0_0_30px_rgba(253,224,71,0.3)]' : ''} relative`}>
                            <div className="absolute inset-0 backface-hidden card-back design-0 rounded-lg shadow-xl" />
                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-black rounded-lg overflow-hidden border border-gold-500 shadow-gold">
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                    {images[i] ? <img src={images[i]} className="w-full h-full object-cover opacity-90" onError={(e) => e.currentTarget.style.display='none'} /> : null}
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-black/80 p-2 text-center">
                                    <p className="text-gold-gradient font-bold text-[10px] md:text-base">{c.name}</p>
                                    <p className="text-[8px] md:text-xs text-gray-400">{c.isReversed ? 'Reversed' : 'Upright'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* INTERPRETATION TEXT - Automatically revealed once fetched */}
            <div className="w-full max-w-2xl bg-black/70 border border-purple-900/50 p-6 rounded-lg min-h-[150px] mb-8 relative animate-fade-in">
                 <div className="absolute bottom-2 right-2 opacity-50 text-xs text-gray-500 font-occult">Jennie's Black Tarot</div>
                 {loading ? (
                    <div className="text-center animate-pulse text-purple-400">Reading the void...</div>
                 ) : (
                    <TypewriterText text={text} />
                 )}
            </div>

            {!loading && (
                <div className="flex flex-col gap-4 items-center animate-fade-in w-full max-w-md">
                    {/* NEW DOWNLOAD BUTTON */}
                    <button 
                        onClick={handleDownload} 
                        disabled={isDownloading}
                        className="w-full py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-yellow-600/50 rounded text-yellow-100 font-bold hover:from-gray-700 hover:to-gray-800 transition shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 group"
                    >
                        {isDownloading ? (
                            <span className="animate-pulse">{TRANSLATIONS[lang].downloading}</span>
                        ) : (
                            <>
                                <span>{TRANSLATIONS[lang].share}</span> 
                                <span className="text-xl group-hover:-translate-y-1 transition-transform">⬇</span>
                            </>
                        )}
                    </button>

                    {isLoggedIn ? (
                        <button onClick={onRetry} className="btn-gold-3d w-full">
                            {TRANSLATIONS[lang].retry_paid}
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-2 mt-4 w-full">
                             <p className="text-gray-400 text-sm font-serif animate-pulse">
                                 {TRANSLATIONS[lang].guest_continue_prompt}
                             </p>
                             <button onClick={onLogin} className="btn-gold-3d w-full">
                                 {TRANSLATIONS[lang].login_btn}
                             </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default App;