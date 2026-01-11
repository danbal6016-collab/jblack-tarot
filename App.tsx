import React, { useState, useEffect } from 'react';
// 👇 질문하신 코드가 여기 들어갔습니다!
import { signInWithGoogle, logOut, db } from './firebase'; 
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
// 👆 
import { AppState, TarotCard, QuestionCategory, User, UserInfo, Language, ReadingResult } from './types';
import { CATEGORIES, TAROT_DECK } from './constants';
import Background from './components/Background';
import Logo from './components/Logo';
import AudioPlayer from './components/AudioPlayer';
import { getTarotReading, generateTarotImage } from './services/geminiService';
import { playShuffleLoop, stopShuffleLoop, playSound } from './services/soundService';

// ---------------------------------------------------------------------------
// CONFIG & CONSTANTS
// ---------------------------------------------------------------------------
// 최애 질문 추가 로직
const LOVE_CATEGORY_IDX = CATEGORIES.findIndex(c => c.id === 'love');
if (LOVE_CATEGORY_IDX !== -1) {
    const idolQuestion = "아무도 모르는 내 최애의 숨겨진 모습은 무엇인가?";
    if (!CATEGORIES[LOVE_CATEGORY_IDX].questions.includes(idolQuestion)) {
        CATEGORIES[LOVE_CATEGORY_IDX].questions.push(idolQuestion);
    }
}

const IDOL_BGM_LIST = [
    { title: "Dreamy Vibe", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
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
        retry_paid: "복채 내고 다시 보기 (-5 Coin)",
        retry_free: "운명을 다시 확인하시겠습니까?",
        login_btn: "로그인 하러 가기",
        auth_title: "로그인 / 회원가입",
        continue_google: "Google로 계속하기",
        coin_shortage: "Black Coin이 부족합니다.",
        input_placeholder: "구체적인 고민을 적어주세요.",
        confirm: "확인",
        shop_title: "Dark Treasury",
        shop_step1: "충전할 패키지 선택",
        reveal_hint: "카드를 터치하여 운명을 확인하세요",
        community_title: "Fate Community",
        write_post: "운명 공유하기",
        profile_title: "My Profile",
        bio_ph: "자신을 표현하는 한마디",
        save: "저장",
        share: "결과 공유하기"
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
        retry_paid: "Read Again (-5 Coin)",
        retry_free: "Retry?",
        login_btn: "Go to Login",
        auth_title: "Login / Sign Up",
        continue_google: "Continue with Google",
        coin_shortage: "Not enough Black Coins.",
        input_placeholder: "Describe your worry.",
        confirm: "Confirm",
        shop_title: "Treasury",
        shop_step1: "Select Package",
        reveal_hint: "Touch to reveal",
        community_title: "Fate Community",
        write_post: "Share Fate",
        profile_title: "My Profile",
        bio_ph: "Bio",
        save: "Save",
        share: "Share Result"
    }
};

const isValidBirthdate = (birth: string) => /^\d{8}$/.test(birth);
const getZodiacSign = (dateStr: string): string => {
    if (!dateStr || dateStr.length !== 8) return "Unknown";
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
    return "Capricorn"; // Simplified for brevity
};

// ---------------------------------------------------------------------------
// MAIN APP COMPONENT
// ---------------------------------------------------------------------------
const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [user, setUser] = useState<User>({ email: 'Guest', coins: 0, history: [], bio: '' });
  
  // Modals
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
  const bgmUrl = IDOL_BGM_LIST[0].url;

  // 1. 진짜 구글 로그인 핸들러 (Firebase)
  const handleGoogleLogin = async () => {
      try {
          const googleUser = await signInWithGoogle();
          if (!googleUser) return;

          // DB에서 유저 찾기
          const userRef = doc(db, "users", googleUser.email!);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
              setUser(userSnap.data() as User);
          } else {
              // 신규 가입
              const newUser: User = { 
                  email: googleUser.email!, 
                  coins: 100, 
                  history: [], 
                  profilePic: googleUser.photoURL || '', 
                  bio: '운명을 개척하는 자',
                  userInfo: { name: googleUser.displayName || 'Unknown', birthDate: '', zodiacSign: '' }
              };
              await setDoc(userRef, newUser);
              setUser(newUser);
          }
          setAuthMode(null);
      } catch (error) {
          console.error(error);
          alert("로그인 중 오류가 발생했습니다.");
      }
  };

  const handleStart = () => {
      if (user.email === 'Guest') setAppState(AppState.INPUT_INFO);
      else setAppState(AppState.CATEGORY_SELECT);
  };

  const handleUserInfoSubmit = async (info: UserInfo) => {
      const newUser = { ...user, userInfo: info };
      setUser(newUser);
      
      if (user.email !== 'Guest') {
         // DB 업데이트
         const userRef = doc(db, "users", user.email);
         await updateDoc(userRef, { userInfo: info });
      }
      setAppState(AppState.CATEGORY_SELECT);
  };

  const handleCardSelect = async (indices: number[]) => {
      // 코인 차감
      if (user.email !== 'Guest') {
          if (user.coins < 5) {
              alert(TRANSLATIONS[lang].coin_shortage);
              setShowShop(true);
              return;
          }
          const newCoins = user.coins - 5;
          const updatedUser = { ...user, coins: newCoins };
          setUser(updatedUser);
          
          // DB 업데이트
          const userRef = doc(db, "users", user.email);
          await updateDoc(userRef, { coins: newCoins });
      }

      const cards: TarotCard[] = indices.map(idx => ({
          id: idx,
          name: TAROT_DECK[idx],
          isReversed: Math.random() < 0.2,
          imagePlaceholder: '',
          backDesign: Math.floor(Math.random() * 3)
      }));
      setSelectedCards(cards);

      // 사주 정보 몰래 섞기
      let finalQuestion = selectedQuestion;
      if (user.userInfo && user.userInfo.birthDate) {
          finalQuestion = `${selectedQuestion} (Context: User born ${user.userInfo.birthDate}. Use this birth energy to add depth, but DO NOT mention 'Saju' or 'birthdate' explicitly.)`;
      }

      const promise = getTarotReading(finalQuestion, cards, user.userInfo || undefined, lang);
      setReadingPromise(promise);
      setAppState(AppState.RESULT);
  };

  const processPayment = async (amount: number, coins: number) => {
      if(user.email === 'Guest') { alert("로그인이 필요합니다."); setAuthMode('LOGIN'); return; }
      const confirmPayment = window.confirm(`${amount}원 결제하시겠습니까? (테스트)`);
      if (confirmPayment) {
          setTimeout(async () => {
              const newCoins = user.coins + coins;
              const updatedUser = { ...user, coins: newCoins };
              setUser(updatedUser);
              
              // DB 업데이트
              const userRef = doc(db, "users", user.email);
              await updateDoc(userRef, { coins: newCoins });
              
              alert(`결제 성공! ${coins} 코인 충전 완료.`);
              setShowShop(false);
          }, 1000);
      }
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
      <div className="relative min-h-screen text-white font-sans overflow-hidden select-none bg-black">
          <Background />
          <AudioPlayer volume={0.5} src={bgmUrl} />
          
          {/* Header */}
          {appState !== AppState.WELCOME && appState !== AppState.INPUT_INFO && (
              <Header 
                user={user} 
                onOpenSettings={() => setShowSettings(true)}
                onOpenShop={() => setShowShop(true)}
                onLogin={() => setAuthMode('LOGIN')}
                onOpenProfile={() => setShowProfile(true)}
                onOpenCommunity={() => setShowCommunity(true)}
              />
          )}

          {/* Screens */}
          {appState === AppState.WELCOME && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in relative z-10">
                <Logo size="large" />
                <p className="font-serif-en text-xl italic mb-12 text-gold-gradient font-bold tracking-widest uppercase drop-shadow-md">{TRANSLATIONS[lang].welcome_sub}</p>
                <button onClick={handleStart} className="btn-gold-3d mb-8 px-10 py-4 text-xl">{TRANSLATIONS[lang].enter}</button>
              </div>
          )}

          {appState === AppState.INPUT_INFO && (
              <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10 animate-fade-in">
                <Logo size="small" />
                <div className="w-full max-w-md bg-black/60 border border-purple-900/50 p-8 rounded-lg backdrop-blur-sm">
                    <h2 className="text-2xl font-occult text-purple-200 mb-8 text-center">{TRANSLATIONS[lang].info_title}</h2>
                    <UserInfoForm onSubmit={handleUserInfoSubmit} lang={lang} initialName={user.userInfo?.name || ''} />
                </div>
              </div>
          )}

          {appState === AppState.CATEGORY_SELECT && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in pt-20">
                 <h2 className="text-3xl font-occult text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-800 mb-8 text-center">{TRANSLATIONS[lang].select_cat_title}</h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full">
                   {CATEGORIES.map((cat) => (
                     <button key={cat.id} onClick={() => { setSelectedCategory(cat); setAppState(AppState.QUESTION_SELECT); }} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-[#1a103c] to-[#000000] border border-purple-500/50 hover:border-purple-400 transition-all">
                       <span className="text-4xl mb-2">{cat.icon}</span>
                       <span className="text-gray-200 font-serif font-bold">{cat.label}</span>
                     </button>
                   ))}
                 </div>
              </div>
          )}

          {appState === AppState.QUESTION_SELECT && selectedCategory && (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in pt-20">
                  <button onClick={() => setAppState(AppState.CATEGORY_SELECT)} className="absolute top-24 left-4 text-gray-400">Back</button>
                  <span className="text-6xl mb-6">{selectedCategory.icon}</span>
                  <div className="w-full max-w-xl space-y-3 h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedCategory.questions.map((q, idx) => (
                          <button key={idx} onClick={() => { setSelectedQuestion(q); setAppState(AppState.SHUFFLING); }} className="w-full text-left p-4 bg-gray-900/50 border border-gray-700 hover:border-purple-500 rounded text-gray-200 font-serif">{q}</button>
                      ))}
                  </div>
              </div>
          )}

          {appState === AppState.SHUFFLING && <ShufflingAnimation onComplete={() => setAppState(AppState.CARD_SELECT)} lang={lang} />}

          {appState === AppState.CARD_SELECT && <CardSelection onSelectCards={handleCardSelect} lang={lang} />}

          {appState === AppState.RESULT && (
              <ResultView 
                question={selectedQuestion} selectedCards={selectedCards} isLoggedIn={user.email !== 'Guest'}
                onRetry={() => setAppState(AppState.CATEGORY_SELECT)}
                lang={lang} readingPromise={readingPromise}
                onReadingComplete={async (text) => {
                    const result: ReadingResult = { date: new Date().toISOString(), question: selectedQuestion, cards: selectedCards, interpretation: text };
                    const newUser = { ...user, history: [result, ...user.history] };
                    setUser(newUser);
                    if(user.email !== 'Guest') {
                        const userRef = doc(db, "users", user.email);
                        await updateDoc(userRef, { history: arrayUnion(result) });
                    }
                }}
              />
          )}

          {/* MODALS */}
          {showCommunity && <CommunityModal user={user} onClose={() => setShowCommunity(false)} lang={lang} />}
          {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} onSave={async (u) => {
              setUser(u);
              if (user.email !== 'Guest') {
                  const userRef = doc(db, "users", user.email);
                  await updateDoc(userRef, { bio: u.bio, profilePic: u.profilePic });
              }
          }} lang={lang} />}
          
          {showShop && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                  <div className="bg-gray-900 border border-yellow-500/50 p-6 rounded-lg max-w-sm w-full">
                      <h3 className="text-xl font-occult text-gold-gradient mb-6">{TRANSLATIONS[lang].shop_title}</h3>
                      <div className="space-y-4">
                          <button onClick={() => processPayment(5000, 60)} className="w-full p-4 bg-gray-800 border hover:border-yellow-500 rounded flex justify-between items-center"><span className="text-white font-bold">60 Coins</span><span className="text-yellow-400">₩5,000</span></button>
                      </div>
                      <button onClick={() => setShowShop(false)} className="mt-6 w-full text-gray-500">닫기</button>
                  </div>
              </div>
          )}

          {authMode && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                  <div className="bg-white text-black p-8 rounded-lg max-w-sm w-full text-center">
                      <h3 className="text-2xl font-bold mb-6">{TRANSLATIONS[lang].auth_title}</h3>
                      <button onClick={handleGoogleLogin} className="w-full py-3 border border-gray-300 rounded flex items-center justify-center gap-3 hover:bg-gray-50 mb-4">
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

// Sub-components
const Header: React.FC<{ user: User; onOpenSettings: ()=>void; onOpenShop: ()=>void; onLogin: ()=>void; onOpenProfile: ()=>void; onOpenCommunity: ()=>void; }> = ({ user, onOpenSettings, onOpenShop, onLogin, onOpenProfile, onOpenCommunity }) => (
  <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/95 to-transparent pointer-events-none">
    <div className="flex items-center gap-2 pointer-events-auto">
      {user.email !== 'Guest' && (
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-yellow-600/30 backdrop-blur-md cursor-pointer" onClick={onOpenShop}>
             <div className="w-6 h-6 rounded-full bg-yellow-500"></div>
             <span className="text-yellow-100 font-bold">{user.coins}</span>
             <span className="text-xs text-yellow-500 bg-yellow-900/50 px-1 rounded">+</span>
          </div>
      )}
    </div>
    <div className="flex items-center gap-3 pointer-events-auto">
      <button onClick={onOpenCommunity} className="text-gray-400 hover:text-white transition p-2">👥</button>
      <div className="cursor-pointer" onClick={user.email !== 'Guest' ? onOpenProfile : onLogin}>
         {user.email !== 'Guest' ? (
             <div className="w-8 h-8 rounded-full bg-purple-900 border border-purple-500 overflow-hidden">
                {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-white">{user.email[0].toUpperCase()}</div>}
             </div>
         ) : <button className="text-gray-400 text-sm underline">Login</button>}
      </div>
      <button onClick={onOpenSettings} className="text-gray-400 hover:text-purple-400 p-2">⚙️</button>
    </div>
  </div>
);

const UserInfoForm: React.FC<{ onSubmit: (info: UserInfo) => void; lang: Language; initialName: string }> = ({ onSubmit, lang, initialName }) => {
    const [name, setName] = useState(initialName);
    const [birth, setBirth] = useState('');
    return (
        <div className="space-y-4">
            <input className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white" placeholder="이름" value={name} onChange={e => setName(e.target.value)} />
            <input type="tel" maxLength={8} className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white tracking-widest" placeholder="생년월일 (19970327)" value={birth} onChange={e => setBirth(e.target.value.replace(/[^0-9]/g, ''))} />
            <button onClick={() => { if(!name || !isValidBirthdate(birth)) return alert("정보를 정확히 입력하세요"); onSubmit({ name, birthDate: birth, zodiacSign: getZodiacSign(birth) }); }} className="w-full py-3 bg-purple-900 hover:bg-purple-800 font-bold rounded">확인</button>
        </div>
    );
};

// Community Modal (Real Firestore)
const CommunityModal: React.FC<{ user: User; onClose: () => void; lang: Language }> = ({ user, onClose, lang }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [content, setContent] = useState('');

    useEffect(() => {
        // 커뮤니티 글 불러오기 (간단하게 구현)
        const fetchPosts = async () => {
            const docRef = doc(db, "community", "general");
            const snap = await getDoc(docRef);
            if(snap.exists()) setPosts(snap.data().posts || []);
        };
        fetchPosts();
    }, []);

    const handleSubmit = async () => {
        if(!content) return;
        const newPost = { id: Date.now(), author: user.email==='Guest'?'Anonymous':user.userInfo?.name, content, date: new Date().toLocaleDateString(), profilePic: user.profilePic };
        const updated = [newPost, ...posts];
        setPosts(updated);
        setContent('');
        // DB 저장
        const docRef = doc(db, "community", "general");
        await setDoc(docRef, { posts: updated }, { merge: true });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto animate-fade-in p-4">
            <div className="max-w-md mx-auto pt-10">
                <div className="flex justify-between mb-4"><h2 className="text-xl font-bold text-white">Fate Community</h2><button onClick={onClose} className="text-gray-400">×</button></div>
                <div className="bg-gray-800 p-4 rounded mb-4">
                    <textarea className="w-full bg-gray-900 text-white p-3 rounded mb-2" rows={3} value={content} onChange={e=>setContent(e.target.value)} placeholder="운명 공유하기..." />
                    <button onClick={handleSubmit} className="w-full bg-purple-700 text-white py-2 rounded font-bold">Post</button>
                </div>
                <div className="space-y-4 pb-20">
                    {posts.map((p: any) => (
                        <div key={p.id} className="bg-black/50 border border-gray-800 p-4 rounded"><div className="font-bold text-sm text-gray-200 mb-1">{p.author}</div><div className="text-gray-300 text-sm">{p.content}</div></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ProfileModal: React.FC<{ user: User; onClose: () => void; onSave: (u: User) => void; lang: Language }> = ({ user, onClose, onSave }) => {
    const [bio, setBio] = useState(user.bio || '');
    const AVATARS = ["https://api.dicebear.com/7.x/lorelei/svg?seed=Jennie", "https://api.dicebear.com/7.x/lorelei/svg?seed=Rose"];
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4 text-center">My Profile</h3>
                <div className="flex justify-center gap-4 mb-4">{AVATARS.map((url, i) => <img key={i} src={url} className="w-10 h-10 rounded-full cursor-pointer border-2 border-transparent hover:border-purple-500" onClick={() => onSave({ ...user, profilePic: url })} />)}</div>
                <textarea className="w-full bg-black border border-gray-600 rounded p-3 text-white mb-4" value={bio} onChange={e => setBio(e.target.value)} />
                <button onClick={() => { onSave({ ...user, bio }); onClose(); }} className="w-full bg-white text-black font-bold py-3 rounded">저장</button>
            </div>
        </div>
    );
};

// Mock components for Result/Shuffling (Keep implementation simple for App.tsx size)
const ResultView: React.FC<any> = (props) => {
    const [text, setText] = useState('');
    useEffect(() => { 
        if(props.readingPromise) props.readingPromise.then((res:string) => { setText(res); props.onReadingComplete(res); }).catch(()=>setText("Error reading fate.")); 
    }, []);
    return <div className="pt-24 px-4 text-center"><h2 className="text-xl text-purple-200 mb-4">{props.question}</h2><div className="bg-black/70 p-6 rounded border border-purple-900">{text || "Reading..."}</div><button onClick={props.onRetry} className="mt-4 text-gray-400 underline">Retry</button></div>;
};
const ShufflingAnimation: React.FC<any> = ({ onComplete }) => { useEffect(()=>{ setTimeout(onComplete, 2000); },[]); return <div className="flex items-center justify-center h-screen">Shuffling...</div>; };
const CardSelection: React.FC<any> = ({ onSelectCards }) => { return <div className="flex items-center justify-center h-screen"><button onClick={()=>onSelectCards([0,1,2])} className="bg-purple-900 p-4 rounded">카드 3장 뽑기 (Click)</button></div>; };

export default App;
