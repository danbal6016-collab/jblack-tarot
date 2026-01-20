import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from "./src/lib/supabase";
import { GoogleContinueButton } from "./components/AuthModal";
import { AppState, CategoryKey, TarotCard, QuestionCategory, User, UserInfo, Language, ReadingResult, UserTier, Country, BGM, Skin, ChatMessage, CustomSkin } from './types';
import { CATEGORIES, TAROT_DECK, COUNTRIES, BGMS, SKINS, TIER_THRESHOLDS, ATTENDANCE_REWARDS } from './constants';
import Background from './components/Background';
import Logo from './components/Logo';
import AudioPlayer from './components/AudioPlayer';
import { getTarotReading, getFallbackTarotImage, getFaceReading, getLifeReading, getCompatibilityReading, getPartnerLifeReading } from './services/geminiService';
import { playSound, playShuffleLoop, stopShuffleLoop, initSounds } from './services/soundService';
import html2canvas from 'html2canvas';
import { RealtimeChannel } from '@supabase/supabase-js';

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
    life_input_btn: "인생 치트키 확인 (-200 Coin)",
    life_guide: "당신의 생시를 알려주세요.",
    downloading: "초고속 저장 중...",
    time_label: "태어난 시간",
    tier_benefit_silver: "매달 1일 보유 코인 1.5배",
    tier_benefit_gold: "매달 1일 보유 코인 2.0배",
    tier_benefit_platinum: "매달 1일 보유 코인 3.0배",
    no_benefit: "혜택 없음",
    guest_exhausted: "게스트 무료 횟수(1회)를 소진했습니다.",
    coin_shortage: "코인이 부족합니다.",
    shop_title: "VIP 블랙코인 라운지",
    shop_subtitle: "운명을 바꾸는 가장 확실한 투자",
    shop_pkg_1: "4,900원 / 60 Coins",
    shop_pkg_2: "7,900원 / 110 Coins",
    shop_pkg_3: "15,500원 / 220 Coins",
    next: "다음",
    custom_q_ph: "구체적인 고민을 입력해 주세요.",
    history: "타로 히스토리",
    no_history: "기록이 없습니다.",
    limit_reached: "오늘의 리딩 횟수를 모두 소진했습니다.",
    solution_lock: "실질적인 해결책 보기 (Gold+)",
    secret_compat: "당신과 그 사람의 은밀한 궁합 (-250 Coin)",
    partner_life: "그 사람의 타고난 인생 팔자 (-250 Coin)",
    partner_birth_ph: "그 사람의 생년월일 (YYYYMMDD)",
    pay_title: "결제 수단 선택",
    pay_cancel: "취소",
    pay_confirm: "결제하기",
    guest_lock_msg: "계속하려면 로그인이 필요합니다.",
    guest_lock_btn: "로그인 / 회원가입",
    secret_compat_title: "은밀한 궁합",
    secret_compat_desc: "당신과 그 사람의 속궁합, 그리고 숨겨진 욕망.",
    secret_compat_btn: "궁합 확인 (-250 Coin)",
    partner_life_title: "그 사람의 인생",
    partner_life_desc: "그 사람의 타고난 인생 팔자를 비밀리에 들춰 보세요.",
    partner_life_btn: "인생 훔쳐보기 (-250 Coin)",
    bronze_shop_lock: "브론즈 등급은 스킨을 구매할 수 없습니다.",
    chat_room_title: "운명의 수다방",
    chat_input_ph: "고민을 나누어 보세요...",
    chat_entry_fee: "입장료 20 코인",
    chat_full: "방이 가득 찼습니다. (최대 50명)",
    chat_leave: "나가기",
    custom_skin_title: "커스텀 스킨 스튜디오 (Silver+)",
    upload_skin: "디자인 업로드",
    public_option: "공개 (코드 발급)",
    private_option: "비공개 (나만 사용)",
    skin_code_label: "스킨 코드 입력",
    skin_code_btn: "적용",
    skin_code_placeholder: "숫자 코드 6자리",
    skin_saved: "스킨이 저장되었습니다.",
    skin_applied: "스킨이 적용되었습니다!",
    rug_shop: "타로 러그 색상 (Gold+)",
    bgm_upload: "BGM 업로드 (Gold+)",
    back: "뒤로 가기"
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
    life_input_btn: "Reveal Cheat Codes (-200 Coin)",
    life_guide: "Enter your birth time.",
    downloading: "Saving Fast...",
    time_label: "Birth Time",
    tier_benefit_silver: "1.5x Coins monthly",
    tier_benefit_gold: "2.0x Coins monthly",
    tier_benefit_platinum: "3.0x Coins monthly",
    no_benefit: "No benefits",
    guest_exhausted: "Guest trial (1 reading) used.",
    coin_shortage: "Not enough coins.",
    shop_title: "VIP Black Coin Lounge",
    shop_subtitle: "Investment for your destiny",
    shop_pkg_1: "₩4,900 / 60 Coins",
    shop_pkg_2: "₩7,900 / 110 Coins",
    shop_pkg_3: "₩15,500 / 220 Coins",
    next: "Next",
    custom_q_ph: "Enter your specific concern here.",
    history: "Reading History",
    no_history: "No records found.",
    limit_reached: "Daily reading limit reached.",
    solution_lock: "Unlock Practical Solution (Gold+)",
    secret_compat: "Secret Compatibility (-250 Coin)",
    partner_life: "Partner's Life Path (-250 Coin)",
    partner_birth_ph: "Partner Birthdate (YYYYMMDD)",
    pay_title: "Select Payment Method",
    pay_cancel: "Cancel",
    pay_confirm: "Pay Now",
    guest_lock_msg: "Login required to continue.",
    guest_lock_btn: "Login / Sign Up",
    secret_compat_title: "Secret Compat",
    secret_compat_desc: "Inner desires and physical chemistry.",
    secret_compat_btn: "Check Compat (-250 Coin)",
    partner_life_title: "Their Life",
    partner_life_desc: "Secretly reveal their true destiny.",
    partner_life_btn: "Spy on Life (-250 Coin)",
    bronze_shop_lock: "Bronze tier cannot purchase skins.",
    chat_room_title: "Fate Chat Room",
    chat_input_ph: "Share your worries...",
    chat_entry_fee: "Entry Fee 20 Coins",
    chat_full: "Room is full (Max 50)",
    chat_leave: "Leave",
    custom_skin_title: "Custom Skin Studio (Silver+)",
    upload_skin: "Upload Design",
    public_option: "Public (Get Code)",
    private_option: "Private (Only Me)",
    skin_code_label: "Enter Skin Code",
    skin_code_btn: "Apply",
    skin_code_placeholder: "6-Digit Code",
    skin_saved: "Skin saved successfully.",
    skin_applied: "Skin applied successfully!",
    rug_shop: "Tarot Rug Color (Gold+)",
    bgm_upload: "BGM Upload (Gold+)",
    back: "Back"
  }
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const calculateTier = (coinsSpent: number): UserTier => {
  if (coinsSpent >= TIER_THRESHOLDS.PLATINUM) return UserTier.PLATINUM;
  if (coinsSpent >= TIER_THRESHOLDS.GOLD) return UserTier.GOLD;
  if (coinsSpent >= TIER_THRESHOLDS.SILVER) return UserTier.SILVER;
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
        // Faster text speed for responsiveness - Increased from 5 to 25 to prevent stopping sensation
        const timer = setInterval(() => {
            setVisibleCount(p => {
                if (p >= text.length) {
                    clearInterval(timer);
                    return p;
                }
                return p + 25;
            });
        }, 20); 
        return () => clearInterval(timer);
    }, [text]);
    return (
        <div className="whitespace-pre-line leading-relaxed font-sans text-gray-200">
            {text.substring(0, visibleCount)}
        </div>
    );
};

const ChatView: React.FC<{
    user: User;
    lang: Language;
    onLeave: () => void;
}> = ({ user, lang, onLeave }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [presenceCount, setPresenceCount] = useState(0);
    const [viewingUser, setViewingUser] = useState<ChatMessage | null>(null); // State for profile popup
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        const channel = supabase.channel('black-tarot-global', {
            config: {
                presence: {
                    key: user.email 
                }
            }
        });

        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'chat' }, ({ payload }) => {
                setMessages(prev => [...prev, payload]);
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                setPresenceCount(Object.keys(state).length);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user: user.userInfo?.name || 'Anonymous',
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const msg: ChatMessage = {
            id: Math.random().toString(36).substring(2),
            userId: user.email,
            nickname: user.userInfo?.name || 'Anonymous',
            avatarUrl: user.userInfo?.profileImage,
            bio: user.userInfo?.bio || '', // Send Bio with message for visibility
            text: inputText,
            timestamp: Date.now(),
            tier: user.tier
        };

        // Optimistic UI update
        setMessages(prev => [...prev, msg]); 

        await channelRef.current?.send({
            type: 'broadcast',
            event: 'chat',
            payload: msg
        });

        setInputText('');
    };

    return (
        <div className="flex flex-col h-screen bg-black/90 relative pt-16">
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-purple-900/80 to-transparent flex items-center justify-between px-4 z-20 border-b border-purple-500/30">
                <div className="flex items-center gap-2">
                    <span className="text-xl">💬</span>
                    <div>
                        <h2 className="text-white font-bold text-sm">{TRANSLATIONS[lang].chat_room_title}</h2>
                        <span className="text-xs text-green-400">● {presenceCount} / 50</span>
                    </div>
                </div>
                <button onClick={onLeave} className="text-gray-400 text-xs hover:text-white border border-gray-600 px-3 py-1 rounded">
                    {TRANSLATIONS[lang].chat_leave}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 scrollbar-thin scrollbar-thumb-purple-700">
                {messages.map((msg, i) => {
                    const isMe = msg.userId === user.email;
                    return (
                        <div key={i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isMe && (
                                <div className="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform" onClick={() => setViewingUser(msg)}>
                                    <div className={`w-8 h-8 rounded-full overflow-hidden border ${msg.tier === UserTier.PLATINUM ? 'border-purple-400' : msg.tier === UserTier.GOLD ? 'border-yellow-400' : 'border-gray-500'}`}>
                                        {msg.avatarUrl ? (
                                            <img src={msg.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs bg-gray-700">?</div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                {!isMe && <span className="text-[10px] text-gray-400 mb-1 ml-1">{msg.nickname}</span>}
                                <div className={`px-4 py-2 rounded-2xl text-sm break-words shadow-lg ${
                                    isMe 
                                        ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-tr-none' 
                                        : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                                }`}>
                                    {msg.text && <p>{msg.text}</p>}
                                </div>
                                <span className="text-[9px] text-gray-600 mt-1 mx-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-purple-900/50 p-4 flex gap-2 items-center z-20">
                <input 
                    type="text" 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={TRANSLATIONS[lang].chat_input_ph}
                    className="flex-1 bg-black/50 border border-gray-700 rounded-full px-4 py-2 text-white focus:border-purple-500 outline-none text-sm"
                />
                <button 
                    onClick={handleSendMessage}
                    className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                >
                    ➤
                </button>
            </div>

            {/* Profile Popup Overlay */}
            {viewingUser && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in" onClick={() => setViewingUser(null)}>
                    <div className="bg-[#1a103c] border-2 border-purple-500 p-6 rounded-xl max-w-xs w-full text-center relative shadow-[0_0_50px_rgba(147,51,234,0.5)]" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setViewingUser(null)}>✕</button>
                        <div className="w-24 h-24 rounded-full border-2 border-yellow-500 mx-auto mb-4 overflow-hidden shadow-lg">
                             {viewingUser.avatarUrl ? <img src={viewingUser.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-700 flex items-center justify-center text-2xl">?</div>}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{viewingUser.nickname}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-4 ${viewingUser.tier === UserTier.PLATINUM ? 'bg-cyan-900 text-cyan-200' : viewingUser.tier === UserTier.GOLD ? 'bg-yellow-900 text-yellow-200' : 'bg-gray-700 text-gray-300'}`}>
                            {viewingUser.tier}
                        </span>
                        <div className="bg-black/40 p-3 rounded border border-purple-900/50 min-h-[80px]">
                            <p className="text-sm text-gray-300 italic">"{viewingUser.bio || 'No bio available.'}"</p>
                        </div>
                    </div>
                </div>
            )}
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
              <button onClick={(e) => { e.stopPropagation(); onOpenShop(); }} className="w-6 h-6 flex items-center justify-center bg-yellow-700 hover:bg-yellow-500 rounded-full text-white text-xs font-extrabold border border-yellow-300 shadow-[0_0_8px_gold] transition-all hover:scale-110 active:scale-95">+</button>
              <span className="text-gray-400 text-xs md:text-sm font-sans border-l border-gray-600 pl-3 ml-1 hidden sm:inline">{user.userInfo?.name || user.email}</span>
          </div>
      )}
    </div>
    <div className="flex items-center gap-4 pointer-events-auto">
      {user.email === 'Guest' && localStorage.getItem('tarot_device_id') && (
          <button onClick={onLogin} className="text-xs bg-purple-900 border border-purple-500 px-3 py-1 rounded text-white animate-pulse">Login / Join</button>
      )}
      {user.email !== 'Guest' && (
          <button onClick={openProfile} className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 overflow-hidden hover:border-purple-500 transition-all">
              {user.userInfo?.profileImage ? (
                  <img src={user.userInfo.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">👤</div>
              )}
          </button>
      )}
      <button onClick={onOpenSettings} className="text-gray-400 hover:text-purple-400 transition-colors p-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
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
    onSubmit({ name, birthDate, country: country.nameEn, timezone: country.timezone, zodiacSign: 'Unknown', nameChangeCount: 0, birthDateChanged: false, countryChanged: false });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <input value={name} onChange={e=>setName(e.target.value)} placeholder={TRANSLATIONS[lang].name_ph} className="p-3 bg-gray-800 rounded text-white border border-gray-700 focus:border-purple-500 outline-none"/>
      <input value={birthDate} onChange={e=>setBirthDate(e.target.value)} placeholder={TRANSLATIONS[lang].birth_ph} className="p-3 bg-gray-800 rounded text-white border border-gray-700 focus:border-purple-500 outline-none"/>
      <select value={country.code} onChange={e => setCountry(COUNTRIES.find(c=>c.code===e.target.value)||COUNTRIES[0])} className="p-3 bg-gray-800 rounded text-white border border-gray-700 focus:border-purple-500 outline-none">
        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{lang==='ko'?c.nameKo:c.nameEn}</option>)}
      </select>
      <button onClick={handleSubmit} className="p-4 bg-[#3b0764] hover:bg-[#581c87] rounded font-bold text-white transition-all hover:scale-[1.02] shadow-[0_4px_10px_rgba(59,7,100,0.5)]">{TRANSLATIONS[lang].next}</button>
    </div>
  );
};

const ShufflingAnimation: React.FC<{ onComplete: () => void; lang: Language; skin: string; activeCustomSkin?: CustomSkin | null; rugColor?: string }> = ({ onComplete, lang, skin, activeCustomSkin, rugColor }) => {
  useEffect(() => {
    playSound('SWOOSH');
    const t = setTimeout(() => { stopShuffleLoop(); onComplete(); }, 4500); 
    return () => { stopShuffleLoop(); clearTimeout(t); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md">
       <div className="absolute w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] bg-[#2e0b49] rounded-full border-4 border-yellow-600/50 shadow-[0_0_80px_rgba(76,29,149,0.5)] flex items-center justify-center overflow-hidden rug-texture" style={rugColor ? { backgroundColor: rugColor, backgroundImage: 'none', boxShadow: `0 0 80px ${rugColor}80` } : {}}>
          <div className="absolute w-[80%] h-[80%] border-2 border-dashed border-yellow-600/30 rounded-full animate-spin-slow"></div>
       </div>
      <div className={`relative w-40 h-64 ${!activeCustomSkin ? SKINS.find(s=>s.id===skin)?.cssClass : ''}`}>
        {Array.from({length: 60}).map((_, i) => (
             <div key={i} className={`absolute inset-0 rounded-xl bg-gradient-to-br from-[#2e1065] to-black border border-[#fbbf24]/30 shadow-2xl card-back`} style={{ zIndex: i, animation: `acrobat${(i % 5) + 1} ${1.0 + (i % 3) * 0.2}s cubic-bezier(0.3, 1, 0.3, 1) infinite ${i * 0.02}s alternate`, transformOrigin: 'center center', backgroundImage: activeCustomSkin ? `url(${activeCustomSkin.imageUrl})` : undefined, backgroundSize: activeCustomSkin ? 'cover' : undefined }}></div>
        ))}
      </div>
      <p className="mt-12 text-xl font-occult text-purple-200 animate-pulse tracking-[0.2em] z-[60] bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">{TRANSLATIONS[lang].shuffling}</p>
    </div>
  );
};

const CardSelection: React.FC<{ onSelectCards: (indices: number[]) => void; lang: Language; skin: string; activeCustomSkin?: CustomSkin | null }> = ({ onSelectCards, lang, skin, activeCustomSkin }) => {
  const [selected, setSelected] = useState<number[]>([]);
  const handleSelect = (i: number) => {
    if (selected.includes(i)) return;
    playSound('SELECT');
    const newSel = [...selected, i];
    setSelected(newSel);
    if (newSel.length === 3) setTimeout(() => onSelectCards(newSel), 500);
  };
  return (
    <div className={`min-h-screen pt-24 pb-12 px-2 flex flex-col items-center z-10 relative overflow-y-auto touch-manipulation ${!activeCustomSkin ? SKINS.find(s=>s.id===skin)?.cssClass : ''}`}>
      <h2 className="text-2xl text-purple-100 mb-8 font-occult drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] sticky top-0 bg-black/80 py-4 w-full text-center z-20 backdrop-blur-md">{TRANSLATIONS[lang].select_cards_title}</h2>
      <div className="flex flex-wrap justify-center gap-1.5 max-w-7xl px-2 pb-20 perspective-1000">
        {TAROT_DECK.map((_, i) => (
          <div key={i} onClick={() => handleSelect(i)} className={`w-14 h-24 sm:w-16 sm:h-28 md:w-20 md:h-32 rounded-lg transition-all duration-300 cursor-pointer shadow-lg transform-style-3d ${selected.includes(i) ? 'ring-2 ring-purple-400 -translate-y-6 z-30 shadow-[0_0_20px_#a855f7] brightness-125' : 'hover:-translate-y-2 hover:shadow-[0_0_15px_rgba(139,92,246,0.6)] brightness-75 hover:brightness-100 active:scale-95'}`}>
             <div className="w-full h-full rounded-lg card-back" style={activeCustomSkin ? { backgroundImage: `url(${activeCustomSkin.imageUrl})`, backgroundSize: 'cover' } : {}}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResultView: React.FC<{
  question: string;
  selectedCards: TarotCard[];
  onRetry: () => void;
  lang: Language;
  readingPromise: Promise<string> | null;
  onReadingComplete: (text: string) => void;
  user: User;
  spendCoins: (amount: number) => boolean;
  onLogin: () => void;
}> = ({ question, selectedCards, onRetry, lang, readingPromise, onReadingComplete, user, spendCoins, onLogin }) => {
  const [fullText, setFullText] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<boolean[]>([false,false,false]);
  const [isSolutionUnlocked, setIsSolutionUnlocked] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const cardImages = selectedCards.map(c => c.generatedImage || c.imagePlaceholder);

  useEffect(() => {
    if(readingPromise) {
      readingPromise.then(t => {
        setFullText(t);
        const parts = t.split('[실질적인 해결책]');
        setAnalysisText(parts[0]);
        if(parts.length > 1) setSolutionText('[실질적인 해결책]' + parts[1]);
        else setSolutionText(""); 
        setLoading(false);
        onReadingComplete(t);
      }).catch(e => {
        setAnalysisText("Error: " + (e.message || "Failed to fetch response"));
        setLoading(false);
      });
    }
  }, [readingPromise]);

  const toggleReveal = (i: number) => { if(!revealed[i]) { playSound('REVEAL'); const newR = [...revealed]; newR[i] = true; setRevealed(newR); } };
  const handleUnlockSolution = () => { if (user.email === 'Guest') { if (confirm("로그인을 진행하시겠습니까?")) onLogin(); return; } if(spendCoins(10)) setIsSolutionUnlocked(true); };
  const handleCapture = async () => {
      if(captureRef.current) {
          const canvas = await html2canvas(captureRef.current, { backgroundColor: '#050505', scale: 1.5, useCORS: true, logging: false, allowTaint: true });
          const link = document.createElement('a'); link.download = `black_tarot_result_${Date.now()}.png`; link.href = canvas.toDataURL('image/png'); link.click();
      }
  };

  return (
    <div className={`min-h-screen pt-28 pb-20 px-4 flex flex-col items-center z-10 relative overflow-y-auto overflow-x-hidden ${!user.activeCustomSkin ? SKINS.find(s=>s.id===user.currentSkin)?.cssClass : ''}`}>
       <div ref={captureRef} style={{ position: 'fixed', left: '-9999px', top: 0, width: '1080px', height: '1920px', zIndex: -10 }} className="bg-[#050505] flex flex-col items-center font-serif overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")` }}></div>
          <div className="absolute inset-8 border-4 border-double border-[#b8860b] pointer-events-none z-20"></div>
          <div className="z-30 flex flex-col items-center w-full h-full pt-24 px-16 pb-16 relative">
              <div className="text-center mb-12"><h1 className="text-8xl font-occult text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] via-[#fcf6ba] to-[#b8860b] drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)] tracking-[0.2em] mb-4">BLACK TAROT</h1></div>
              <div className="w-full text-center mb-12 relative"><h2 className="relative text-4xl text-white font-serif italic opacity-90 px-8 leading-normal">"{question}"</h2></div>
              <div className="flex gap-8 justify-center items-center mb-12 w-full">{selectedCards.map((c, i) => (<div key={i} className="flex flex-col items-center gap-4 relative group"><div className="w-[260px] h-[420px] relative rounded-lg border-2 border-[#b8860b] shadow-[0_0_50px_rgba(184,134,11,0.2)] overflow-hidden bg-black"><img src={cardImages[i]} className={`w-full h-full object-cover ${c.isReversed?'rotate-180':''}`} crossOrigin="anonymous" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div><div className="absolute bottom-6 left-0 right-0 text-center"><span className="text-xl font-bold text-[#ffd700] uppercase tracking-widest font-occult">{c.name}</span></div></div></div>))}</div>
              <div className="w-full flex-1 bg-black/60 border border-[#b8860b]/30 rounded-lg p-10 relative overflow-hidden backdrop-blur-md"><div className="relative z-10 h-full flex items-center justify-center"><p className="text-3xl text-[#e0e0e0] leading-[1.8] text-center font-serif whitespace-pre-wrap break-keep drop-shadow-md line-clamp-[12]">{fullText.split('[실질적인 해결책]')[0].substring(0, 450)}...</p></div></div>
              <div className="text-center mt-12 opacity-70"><p className="text-2xl text-[#ffd700] font-occult tracking-[0.5em] uppercase">Fate Revealed</p></div>
          </div>
       </div>
       <div className="w-full max-w-4xl flex flex-col gap-8 animate-fade-in p-2">
         <div className="bg-gradient-to-r from-transparent via-purple-900/30 to-transparent border-y border-purple-500/30 py-6 text-center backdrop-blur-sm relative">
             <h3 className="text-gray-400 text-xs md:text-sm font-sans uppercase tracking-[0.2em] mb-2">{TRANSLATIONS[lang].result_question}</h3>
             <h2 className="text-xl md:text-3xl font-serif-en text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-200 drop-shadow-md px-4">"{question}"</h2>
         </div>
         {selectedCards.length > 0 && (
             <div className="flex flex-col items-center">
                 <div className="flex flex-wrap justify-center gap-4 md:gap-8 perspective-1000">
                   {selectedCards.map((c, i) => (
                     <div key={i} onClick={() => toggleReveal(i)} className="flex flex-col items-center gap-2 group cursor-pointer">
                        <div className={`w-24 h-40 md:w-32 md:h-52 relative transition-all duration-700 transform-style-3d ${revealed[i] ? 'rotate-y-180' : 'hover:-translate-y-2'}`}>
                           <div className="absolute inset-0 backface-hidden rounded-lg card-back shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-purple-500/20" style={user.activeCustomSkin ? { backgroundImage: `url(${user.activeCustomSkin.imageUrl})`, backgroundSize: 'cover' } : {}}></div>
                           <div className="absolute inset-0 backface-hidden rotate-y-180 bg-black rounded-lg overflow-hidden border border-yellow-600/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                              <img src={cardImages[i]} className={`w-full h-full object-cover opacity-90 ${c.isReversed?'rotate-180':''}`} alt={c.name} />
                              <div className="absolute bottom-2 left-0 right-0 text-center"><span className="text-[10px] md:text-xs font-occult text-yellow-500 uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded">{c.name}</span></div>
                           </div>
                        </div>
                        <span className="text-xs text-gray-500 font-serif-en tracking-widest">{i + 1}</span>
                     </div>
                   ))}
                 </div>
             </div>
         )}
         <div className="relative">
            <div className="bg-black/60 backdrop-blur-md border border-purple-900/30 p-6 md:p-8 rounded-sm shadow-2xl min-h-[200px]">
                {loading ? <div className="flex flex-col items-center justify-center h-40 gap-4"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div><span className="text-purple-300 font-occult animate-pulse text-sm tracking-widest">Reading Fate...</span></div> : (
                    <div className="text-gray-200 font-sans text-sm md:text-base leading-relaxed md:leading-loose whitespace-pre-wrap break-keep">
                        <TypewriterText text={analysisText} />
                        {solutionText && (
                            <div className="mt-8 pt-8 border-t border-purple-900/50 relative">
                                {isSolutionUnlocked ? <div className="animate-fade-in"><TypewriterText text={solutionText} /></div> : (
                                    <div className="relative rounded-lg overflow-hidden select-none min-h-[200px]">
                                        <div className="filter blur-[8px] opacity-60 text-gray-400 text-xs leading-relaxed select-none pointer-events-none" style={{ userSelect: 'none' }}>{solutionText}</div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-black/60 to-black/80 z-10 p-4">
                                            <div className="text-3xl mb-2">🔒</div><p className="text-gray-300 font-bold mb-4 text-center px-4">실질적인 해결책은<br/>블랙코인 10개로 확인할 수 있습니다.</p>
                                            <button onClick={handleUnlockSolution} className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all transform hover:scale-105">Unlock (-10 Coins)</button>
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
         <button onClick={onRetry} className="px-8 py-3 bg-gray-900/80 border border-gray-600 rounded text-gray-300 font-bold hover:bg-gray-800 hover:text-white transition-all shadow-lg backdrop-blur-md uppercase text-sm tracking-wider">{TRANSLATIONS[lang].next}</button>
         <button onClick={handleCapture} className="px-8 py-3 bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-500 rounded text-white font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)] backdrop-blur-md uppercase text-sm tracking-wider flex items-center gap-2"><span>✨</span> {TRANSLATIONS[lang].share}</button>
       </div>
    </div>
  );
};

const AuthForm: React.FC<{ onClose: () => void; onLoginSuccess: () => void }> = ({ onClose, onLoginSuccess }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [showResetLink, setShowResetLink] = useState(false);

    const handleAuth = async () => {
        if(!email || !password) return alert("Please fill in all fields.");
        setLoading(true); setMsg(''); setShowResetLink(false);
        try {
            if (isSignup) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMsg("Confirmation email sent! Please check your inbox.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onLoginSuccess();
            }
        } catch (e: any) {
            console.error("Auth Error:", e);
            let displayMsg = e.message || e.toString();
            const lowerMsg = displayMsg.toLowerCase();
            if (lowerMsg.includes("failed to fetch") || lowerMsg.includes("network request failed")) {
                displayMsg = "서버 연결 실패: 인터넷 연결 또는 서버 구성을 확인해주세요. (Backend Config Issue)";
            } else if (lowerMsg.includes("invalid login") || lowerMsg.includes("invalid_grant")) {
                displayMsg = "아이디 또는 비밀번호가 잘못되었습니다.";
                setShowResetLink(true);
            } else if (lowerMsg.includes("rate limit")) {
                displayMsg = "너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.";
            } else if (lowerMsg.includes("user already registered") || lowerMsg.includes("already registered")) {
                displayMsg = "이미 등록된 이메일입니다.";
            }
            setMsg(displayMsg);
        } finally { setLoading(false); }
    };

    return (
        <div className="flex flex-col gap-4">
             <div className="flex w-full mb-4 bg-gray-800 rounded p-1">
                <button onClick={() => { setIsSignup(false); setMsg(''); setShowResetLink(false); }} className={`flex-1 py-2 rounded text-sm font-bold transition-all ${!isSignup ? 'bg-purple-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>LOGIN</button>
                <button onClick={() => { setIsSignup(true); setMsg(''); setShowResetLink(false); }} className={`flex-1 py-2 rounded text-sm font-bold transition-all ${isSignup ? 'bg-purple-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>SIGN UP</button>
            </div>
            <input className="p-3 bg-black border border-gray-700 rounded text-white focus:border-purple-500 outline-none transition-colors" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input className="p-3 bg-black border border-gray-700 rounded text-white focus:border-purple-500 outline-none transition-colors" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            {msg && <p className="text-red-400 text-xs text-center">{msg}</p>}
            <button onClick={handleAuth} disabled={loading} className="w-full py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors mt-2">{loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Login')}</button>
            {!isSignup && showResetLink && <button onClick={() => alert("Check email for reset link")} className="text-xs text-gray-400 underline hover:text-white mt-2 self-center">비밀번호를 잊으셨나요?</button>}
            <GoogleContinueButton />
        </div>
    );
};

// ---------------------------------------------------------------------------
// MAIN APP
// ---------------------------------------------------------------------------

const RK_COLORS = [
    { name: 'Default Purple', color: '#2e0b49' },
    { name: 'Crimson Blood', color: '#450a0a' },
    { name: 'Midnight Blue', color: '#0f172a' },
    { name: 'Emerald Forest', color: '#064e3b' },
    { name: 'Void Black', color: '#000000' },
    { name: 'Royal Gold', color: '#422006' }
];

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [user, setUser] = useState<User>({ email: 'Guest', coins: 0, history: [], totalSpent: 0, tier: UserTier.BRONZE, attendanceDay: 0, ownedSkins: ['default'], currentSkin: 'default', readingsToday: 0, loginDates: [], customSkins: [], activeCustomSkin: null, monthlyCoinsSpent: 0 });
  const [authMode, setAuthMode] = useState<'LOGIN'|'SIGNUP'|null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMode, setSettingsMode] = useState<'MAIN' | 'RUG' | 'BGM' | 'SKIN' | 'HISTORY'>('MAIN');
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGuestBlock, setShowGuestBlock] = useState(false);
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [attendanceReward, setAttendanceReward] = useState(0);
  const [editProfileData, setEditProfileData] = useState<UserInfo>({ name: '', birthDate: '', country: '', timezone: '', zodiacSign: '', nameChangeCount: 0, birthDateChanged: false, countryChanged: false });
  const [customSkinImage, setCustomSkinImage] = useState<string | null>(null);
  const [isSkinPublic, setIsSkinPublic] = useState(false);
  const [inputSkinCode, setInputSkinCode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState<string>(''); 
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [readingPromise, setReadingPromise] = useState<Promise<string> | null>(null);
  const [lang, setLang] = useState<Language>('ko'); 
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [bgmStopped, setBgmStopped] = useState(false);
  const [currentBgm, setCurrentBgm] = useState<BGM>(BGMS[0]);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [birthTime, setBirthTime] = useState({h: '12', m: '00'});
  const [partnerBirth, setPartnerBirth] = useState('');
  const [shopStep, setShopStep] = useState<'AMOUNT' | 'METHOD'>('AMOUNT');
  const [pendingPackage, setPendingPackage] = useState<{amount: number, coins: number} | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'TOSS' | 'PAYPAL' | 'APPLE' | 'KAKAO'>('TOSS');

  const saveUserState = useCallback((u: User, state: AppState) => {
      localStorage.setItem('black_tarot_user', JSON.stringify({ ...u, lastAppState: state }));
      if (u.email !== 'Guest') {
          supabase.from('profiles').upsert({ email: u.email, data: { ...u, lastAppState: state }, updated_at: new Date().toISOString() }, { onConflict: 'email' }).then(({ error }) => { if (error) console.warn("Cloud save failed:", error.message); });
      }
  }, []);

  const navigateTo = (newState: AppState) => { setAppState(newState); saveUserState(user, newState); };
  const updateUser = (updater: (prev: User) => User) => { setUser(prev => { const newUser = updater(prev); saveUserState(newUser, appState); return newUser; }); };

  const checkUser = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    let localUser: User | null = null;
    try { const stored = localStorage.getItem('black_tarot_user'); if (stored) { localUser = JSON.parse(stored); if (localUser) setUser(localUser); } } catch (e) {}
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session?.user) {
           if (localUser && localUser.email === 'Guest') {} else { const newGuest: User = { ...user, email: "Guest", lastLoginDate: today }; setUser(newGuest); setAppState(AppState.WELCOME); }
           localStorage.setItem('tarot_device_id', 'true'); return;
        }
        const u = data.session.user; const email = u.email || "User";
        let cloudUser: User | null = null;
        try { const { data: profileData } = await supabase.from('profiles').select('data').eq('email', email).single(); if (profileData && profileData.data) cloudUser = profileData.data; } catch(e) { console.warn("Failed to fetch cloud data", e); }
        let currentUser = cloudUser || (localUser && localUser.email === email ? localUser : { ...user, email });

        // Tier Demotion Logic (15 days)
        const lastLoginDate = new Date(currentUser.lastLoginDate || today);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate.getTime() - lastLoginDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        let newTier = currentUser.tier;
        if (diffDays >= 15) {
            const tiers = [UserTier.BRONZE, UserTier.SILVER, UserTier.GOLD, UserTier.PLATINUM];
            const currentIdx = tiers.indexOf(newTier);
            const drops = Math.floor(diffDays / 15);
            const newIdx = Math.max(0, currentIdx - drops);
            newTier = tiers[newIdx];
            if (newTier !== currentUser.tier) alert(`오랜 기간 접속하지 않아 등급이 ${newTier}로 하향 조정되었습니다.`);
        }

        let newLoginDates = [...(currentUser.loginDates || [])]; if (!newLoginDates.includes(today)) newLoginDates.push(today);
        let newCoins = currentUser.coins; let currentMonthlyReward = currentUser.lastMonthlyReward; let newAttendanceDay = currentUser.attendanceDay; let newLastAttendance = currentUser.lastAttendance;
        let newMonthlyCoinsSpent = currentUser.monthlyCoinsSpent || 0;
        const currentMonth = today.substring(0, 7);

        if (currentMonthlyReward !== currentMonth) {
            if (newTier !== UserTier.BRONZE) {
                if (newTier === UserTier.GOLD) { newCoins = Math.floor(newCoins * 1.5); alert(TRANSLATIONS[lang].reward_popup + " (1.5x)"); }
                else if (newTier === UserTier.PLATINUM) { newCoins = Math.floor(newCoins * 2.0); alert(TRANSLATIONS[lang].reward_popup + " (2.0x)"); }
            }
            newMonthlyCoinsSpent = 0; newTier = UserTier.BRONZE; currentMonthlyReward = currentMonth;
        } else {
            // Re-calculate upgrade only if not demoted recently? Simplified: just calc based on spend
            newTier = calculateTier(newMonthlyCoinsSpent);
        }

        if (newLastAttendance !== today) {
            if (newAttendanceDay < 10) newAttendanceDay += 1; else newAttendanceDay = 1; 
            const reward = ATTENDANCE_REWARDS[Math.min(newAttendanceDay, 10) - 1] || 20;
            newCoins += reward; newLastAttendance = today; setAttendanceReward(reward); setShowAttendancePopup(true);
        }
        
        const updatedUser = { ...currentUser, email: email, tier: newTier, coins: newCoins, lastLoginDate: today, loginDates: newLoginDates, readingsToday: currentUser.lastReadingDate === today ? currentUser.readingsToday : 0, lastReadingDate: today, lastMonthlyReward: currentMonthlyReward, attendanceDay: newAttendanceDay, lastAttendance: newLastAttendance, monthlyCoinsSpent: newMonthlyCoinsSpent };
        setUser(updatedUser); saveUserState(updatedUser, updatedUser.lastAppState || AppState.WELCOME);
        if (updatedUser.lastAppState && updatedUser.lastAppState !== AppState.WELCOME) setAppState(updatedUser.lastAppState);
        else { if (updatedUser.userInfo?.name && updatedUser.userInfo?.birthDate) { setAppState(AppState.CATEGORY_SELECT); saveUserState(updatedUser, AppState.CATEGORY_SELECT); } else setAppState(AppState.INPUT_INFO); }
    } catch (err: any) { if (err.message && !err.message.includes("Failed to fetch")) console.warn("Session check failed:", err); }
  }, [lang]); 

  useEffect(() => { checkUser(); }, [checkUser]);

  const handleStart = () => { initSounds(); setBgmStopped(false); if (user.userInfo?.name && user.userInfo?.birthDate) navigateTo(AppState.CATEGORY_SELECT); else navigateTo(AppState.INPUT_INFO); };
  const handleUserInfoSubmit = (info: UserInfo) => { updateUser((prev) => ({ ...prev, userInfo: info })); navigateTo(AppState.CATEGORY_SELECT); };
  const spendCoins = (amount: number): boolean => { if (user.email === 'Guest') return true; if (user.coins < amount) { if (confirm(TRANSLATIONS[lang].coin_shortage)) { setShowShop(true); setShopStep('AMOUNT'); } return false; } updateUser(prev => { const newSpent = (prev.monthlyCoinsSpent || 0) + amount; return { ...prev, coins: prev.coins - amount, monthlyCoinsSpent: newSpent, tier: calculateTier(newSpent) }; }); return true; };
  
  const buySkin = (skin: Skin) => {
      if (user.ownedSkins.includes(skin.id)) { updateUser(prev => ({ ...prev, currentSkin: skin.id, activeCustomSkin: null })); return; }
      if (spendCoins(skin.cost)) { updateUser(prev => ({ ...prev, ownedSkins: [...prev.ownedSkins, skin.id], currentSkin: skin.id, activeCustomSkin: null })); }
  };
  const handleCustomSkinUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => setCustomSkinImage(e.target?.result as string); reader.readAsDataURL(file); };
  const handleSaveCustomSkin = () => { if (!customSkinImage) return; const newSkin: CustomSkin = { id: Math.random().toString(36).substring(2), imageUrl: customSkinImage, isPublic: isSkinPublic, shareCode: isSkinPublic ? Math.floor(100000 + Math.random() * 900000).toString() : undefined }; updateUser(prev => ({ ...prev, customSkins: [...(prev.customSkins || []), newSkin], activeCustomSkin: newSkin })); setCustomSkinImage(null); alert(`${TRANSLATIONS[lang].skin_saved} ${newSkin.shareCode ? `Code: ${newSkin.shareCode}` : ''}`); };
  const handleApplySkinCode = () => { const found = user.customSkins?.find(s => s.shareCode === inputSkinCode); if (found) { updateUser(prev => ({ ...prev, activeCustomSkin: found })); alert(TRANSLATIONS[lang].skin_applied); } else alert("Invalid Code (Simulation: Only local codes work in demo)"); };
  const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const url = URL.createObjectURL(file); const newBgm: BGM = { id: 'custom-' + Date.now(), name: file.name, url: url, category: 'DEFAULT' }; setCurrentBgm(newBgm); alert("BGM Applied!"); };
  const handleRugChange = (color: string) => { updateUser(prev => ({ ...prev, rugColor: color })); };
  const handleOpenProfile = () => { if (user.userInfo) setEditProfileData({ ...user.userInfo }); setShowProfile(true); };
  const handleSaveProfile = () => { if (!user.userInfo) return; const newInfo = { ...editProfileData }; let changed = false; if (newInfo.name !== user.userInfo.name) { if ((user.userInfo.nameChangeCount || 0) >= 3) { alert("이름은 최대 3회까지만 변경 가능합니다."); return; } newInfo.nameChangeCount = (user.userInfo.nameChangeCount || 0) + 1; changed = true; } if (newInfo.birthDate !== user.userInfo.birthDate) { if (user.userInfo.birthDateChanged) { alert("생년월일은 1회만 변경 가능합니다."); return; } newInfo.birthDateChanged = true; changed = true; } if (newInfo.country !== user.userInfo.country) { if (user.userInfo.countryChanged) { alert("국가는 1회만 변경 가능합니다."); return; } newInfo.countryChanged = true; changed = true; } if (newInfo.bio !== user.userInfo.bio || newInfo.profileImage !== user.userInfo.profileImage) { changed = true; } if (changed) { updateUser(prev => ({ ...prev, userInfo: newInfo })); alert("프로필이 업데이트 되었습니다."); } setShowProfile(false); };
  const handleDeleteAccount = async () => { if (confirm(TRANSLATIONS[lang].delete_confirm)) { await supabase.auth.signOut(); localStorage.removeItem('black_tarot_user'); localStorage.removeItem('tarot_device_id'); const cleanUser = { email: 'Guest', coins: 0, history: [], totalSpent: 0, tier: UserTier.BRONZE, attendanceDay: 0, ownedSkins: ['default'], currentSkin: 'default', readingsToday: 0, loginDates: [], monthlyCoinsSpent: 0, lastAppState: AppState.WELCOME }; setUser(cleanUser); setAppState(AppState.WELCOME); setShowProfile(false); } };
  const initiatePayment = (amount: number, coins: number) => { if (user.email === 'Guest') { alert("Please login to purchase coins."); return; } setPendingPackage({ amount, coins }); setShopStep('METHOD'); };
  const processPayment = () => { if (!pendingPackage) return; setTimeout(() => { alert(`Payment Successful via ${selectedPaymentMethod}!`); updateUser(prev => ({ ...prev, coins: prev.coins + pendingPackage.coins, totalSpent: prev.totalSpent + pendingPackage.amount, })); setPendingPackage(null); setShopStep('AMOUNT'); setShowShop(false); }, 1500); };
  const handleCategorySelect = (category: QuestionCategory) => { if (category.minTier) { const tiers = [UserTier.BRONZE, UserTier.SILVER, UserTier.GOLD, UserTier.PLATINUM]; if (tiers.indexOf(user.tier) < tiers.indexOf(category.minTier)) { alert(`This category requires ${category.minTier} tier or higher.`); return; } } setSelectedCategory(category); if (category.id === 'FACE') navigateTo(AppState.FACE_UPLOAD); else if (category.id === 'LIFE') navigateTo(AppState.LIFE_INPUT); else if (category.id === 'SECRET_COMPAT' || category.id === 'PARTNER_LIFE') navigateTo(AppState.PARTNER_INPUT); else navigateTo(AppState.QUESTION_SELECT); };
  const handleEnterChat = async () => { if (user.tier === UserTier.BRONZE) return alert("Silver+ only."); if (!spendCoins(20)) return; navigateTo(AppState.CHAT_ROOM); };
  const handleQuestionSelect = (q: string) => { setSelectedQuestion(q); navigateTo(AppState.SHUFFLING); };
  const startFaceReading = () => { if (user.email === 'Guest' && parseInt(localStorage.getItem('guest_readings') || '0') >= 1) { setShowGuestBlock(true); return; } if (!faceImage) return alert("Please upload a photo first."); if (!spendCoins(100)) return; navigateTo(AppState.RESULT); setSelectedQuestion(TRANSLATIONS[lang].face_reading_title); setSelectedCards([]); setReadingPromise(getFaceReading(faceImage, user.userInfo, lang)); };
  const startLifeReading = () => { if (user.email === 'Guest' && parseInt(localStorage.getItem('guest_readings') || '0') >= 1) { setShowGuestBlock(true); return; } if (!spendCoins(200)) return; navigateTo(AppState.RESULT); setSelectedQuestion(TRANSLATIONS[lang].life_reading_title); setSelectedCards([]); setReadingPromise(getLifeReading({...user.userInfo!, birthTime: `${birthTime.h}:${birthTime.m}`}, lang)); };
  const startPartnerReading = () => { if (user.email === 'Guest' && parseInt(localStorage.getItem('guest_readings') || '0') >= 1) { setShowGuestBlock(true); return; } if (!selectedCategory) return; const cost = selectedCategory.cost || 0; if (!spendCoins(cost)) return; if (!partnerBirth || partnerBirth.length < 8) return alert("Please enter a valid birthdate (YYYYMMDD)."); navigateTo(AppState.RESULT); setSelectedQuestion(selectedCategory.label); setSelectedCards([]); if (selectedCategory.id === 'SECRET_COMPAT') setReadingPromise(getCompatibilityReading(user.userInfo!, partnerBirth, lang)); else setReadingPromise(getPartnerLifeReading(partnerBirth, lang)); };
  const handleCardSelect = (indices: number[]) => { if (user.email === 'Guest') { const guestReadings = parseInt(localStorage.getItem('guest_readings') || '0'); if (guestReadings >= 1) { setShowGuestBlock(true); return; } localStorage.setItem('guest_readings', (guestReadings + 1).toString()); } else { const limit = user.tier === UserTier.BRONZE ? 5 : (user.tier === UserTier.SILVER ? 20 : 999); if (user.readingsToday >= limit) { alert(TRANSLATIONS[lang].limit_reached); return; } if (!spendCoins(5)) return; updateUser(prev => ({...prev, readingsToday: prev.readingsToday + 1})); } const selected = indices.map(i => { const cardName = TAROT_DECK[i]; const seed = Math.floor(Math.random() * 1000000); const genUrl = `https://image.pollinations.ai/prompt/tarot%20card%20${encodeURIComponent(cardName)}%20mystical%20dark%20fantasy%20style%20deep%20purple%20and%20gold%20smoke%20effect%20detailed%204k%20no%20text?width=400&height=600&nologo=true&seed=${seed}&model=flux`; const img = new Image(); img.src = genUrl; return { id: i, name: cardName, isReversed: Math.random() < 0.3, imagePlaceholder: getFallbackTarotImage(i), generatedImage: genUrl, backDesign: 0 }; }); setSelectedCards(selected); navigateTo(AppState.RESULT); setReadingPromise(getTarotReading(selectedQuestion, selected, user.userInfo, lang, user.history, user.tier)); };

  return (
      <div className={`relative min-h-screen text-white font-sans overflow-hidden select-none ${SKINS.find(s=>s.id===user.currentSkin)?.cssClass}`}>
          <Background />
          <AudioPlayer volume={bgmVolume} userStopped={bgmStopped} currentTrack={currentBgm.url} />
          {appState !== AppState.WELCOME && appState !== AppState.INPUT_INFO && appState !== AppState.CHAT_ROOM && (
              <div className="z-50 pointer-events-auto"><Header user={user} lang={lang} onOpenSettings={() => { setShowSettings(true); setSettingsMode('MAIN'); }} onOpenShop={() => { setShowShop(true); setShopStep('AMOUNT'); }} onLogin={() => setAuthMode("LOGIN")} openProfile={handleOpenProfile} /></div>
          )}
          {showGuestBlock && ( <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-6"><div className="bg-gray-900 border border-purple-500 p-8 rounded text-center max-w-sm w-full shadow-[0_0_50px_rgba(168,85,247,0.5)]"><h2 className="text-2xl font-bold text-white mb-4">STOP</h2><p className="text-gray-300 mb-8 leading-relaxed">{TRANSLATIONS[lang].guest_lock_msg}</p><button onClick={() => { setShowGuestBlock(false); setAuthMode('LOGIN'); }} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all hover:scale-105">{TRANSLATIONS[lang].guest_lock_btn}</button></div></div> )}
          {showAttendancePopup && ( <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-lg animate-fade-in p-4"><div className="relative bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#2e1065] p-1 rounded-2xl shadow-[0_0_80px_rgba(250,204,21,0.4)] max-w-sm w-full scale-100 animate-[bounce_1s_infinite]"><div className="relative bg-[#1a103c] rounded-xl p-8 text-center border border-yellow-500/50 overflow-hidden"><h2 className="text-3xl font-occult text-shine mb-4 relative z-10 font-bold uppercase tracking-widest">{TRANSLATIONS[lang].attendance_popup}</h2><div className="text-7xl mb-6 relative z-10 animate-bounce">🎁</div><p className="text-yellow-200 text-lg mb-2 font-bold relative z-10">Day {user.attendanceDay} Reached!</p><p className="text-gray-300 mb-8 relative z-10">You received <span className="text-yellow-400 font-bold text-xl">{attendanceReward} Coins</span></p><button onClick={() => setShowAttendancePopup(false)} className="relative z-10 w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-extrabold rounded-lg shadow-lg">Claim Reward</button></div></div></div> )}
          {showProfile && user.email !== 'Guest' && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
                  <div className="bg-gray-900 border border-purple-500 rounded-lg max-w-md w-full p-6 relative overflow-y-auto max-h-[90vh]">
                      <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
                      <h2 className="text-2xl font-occult text-purple-200 mb-6 text-center">{TRANSLATIONS[lang].profile_edit}</h2>
                      <div className="flex justify-center mb-6"><div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-purple-500 flex items-center justify-center overflow-hidden relative group cursor-pointer">{editProfileData.profileImage ? <img src={editProfileData.profileImage} className="w-full h-full object-cover" /> : <span className="text-4xl">👤</span>}<div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-xs text-white">Change</div><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>{ const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onload=()=>setEditProfileData(prev => ({...prev, profileImage: r.result as string})); r.readAsDataURL(f); } }}/></div></div>
                      <div className="space-y-4">
                          <div><label className="text-xs text-gray-500 block mb-1">Name (Changed: {user.userInfo?.nameChangeCount || 0}/3)</label><input value={editProfileData.name} onChange={(e) => setEditProfileData(prev => ({...prev, name: e.target.value}))} className={`w-full p-2 bg-gray-800 rounded border border-gray-700 text-white ${user.userInfo?.nameChangeCount && user.userInfo.nameChangeCount >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!!(user.userInfo?.nameChangeCount && user.userInfo.nameChangeCount >= 3)} /></div>
                          <div><label className="text-xs text-gray-500 block mb-1">Birthdate (Changeable Once)</label><input value={editProfileData.birthDate} onChange={(e) => setEditProfileData(prev => ({...prev, birthDate: e.target.value}))} placeholder="YYYYMMDD" className={`w-full p-2 bg-gray-800 rounded border border-gray-700 text-white ${user.userInfo?.birthDateChanged ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={user.userInfo?.birthDateChanged} /></div>
                          <div><label className="text-xs text-gray-500 block mb-1">Country (Changeable Once)</label><select value={COUNTRIES.find(c => c.nameEn === editProfileData.country)?.code || ''} onChange={(e) => { const c = COUNTRIES.find(cnt => cnt.code === e.target.value); if(c) setEditProfileData(prev => ({...prev, country: c.nameEn})); }} className={`w-full p-2 bg-gray-800 rounded border border-gray-700 text-white ${user.userInfo?.countryChanged ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={user.userInfo?.countryChanged} >{COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.nameKo}</option>)}</select></div>
                          <div><label className="text-xs text-gray-500 block mb-1">Bio (Public Description)</label><textarea value={editProfileData.bio || ''} onChange={(e) => setEditProfileData(prev => ({...prev, bio: e.target.value}))} className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white h-20 resize-none" placeholder="Introduce yourself..." /></div>
                      </div>
                      <div className="mt-6 flex gap-2"><button onClick={() => setShowProfile(false)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 font-bold">Cancel</button><button onClick={handleSaveProfile} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 rounded text-white font-bold">Save Changes</button></div>
                      <div className="mt-8 pt-6 border-t border-gray-800"><button onClick={handleDeleteAccount} className="w-full py-3 bg-red-900/50 text-red-400 font-bold rounded border border-red-900 hover:bg-red-900 hover:text-white transition-colors">{TRANSLATIONS[lang].delete_account}</button></div>
                  </div>
              </div>
          )}
          {appState === AppState.WELCOME && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in relative z-10"><Header user={user} lang={lang} onOpenSettings={() => { setShowSettings(true); setSettingsMode('MAIN'); }} onOpenShop={() => setShowShop(true)} onLogin={() => setAuthMode("LOGIN")} openProfile={handleOpenProfile} /><Logo size="large" /><p className="font-serif-en text-sm md:text-base italic mb-12 text-gold-gradient font-bold tracking-widest uppercase drop-shadow-sm opacity-90">{TRANSLATIONS[lang].welcome_sub}</p><button onClick={handleStart} className="btn-gold-3d mb-8">{TRANSLATIONS[lang].enter}</button></div> )}
          {appState === AppState.INPUT_INFO && ( <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10 animate-fade-in"><Logo size="small" /><div className="w-full max-w-md bg-black/60 border-wine-gradient p-8 rounded-lg backdrop-blur-sm"><h2 className="text-2xl font-occult text-purple-200 mb-2 text-center">{TRANSLATIONS[lang].info_title}</h2><p className="text-gray-400 text-sm mb-8 text-center">{TRANSLATIONS[lang].info_desc}</p><UserInfoForm onSubmit={handleUserInfoSubmit} lang={lang} /></div></div> )}
          {appState === AppState.CATEGORY_SELECT && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in pt-20 pb-10"><h2 className="text-3xl font-occult text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-800 mb-8 text-center">{TRANSLATIONS[lang].select_cat_title}</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full relative">{(user.tier !== UserTier.BRONZE) && (<button onClick={handleEnterChat} className="absolute -right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-purple-900/80 border border-purple-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.6)] hover:bg-purple-800 hover:scale-110 transition-all z-20 group"><span className="text-2xl mb-1 group-hover:animate-bounce">💬</span><span className="text-[8px] text-white font-bold">{TRANSLATIONS[lang].chat_entry_fee}</span></button>)}{CATEGORIES.map((cat) => { const isVisible = (cat.id === 'FACE' || cat.id === 'LIFE') ? user.tier !== UserTier.BRONZE : (cat.id === 'SECRET_COMPAT') ? (user.tier === UserTier.GOLD || user.tier === UserTier.PLATINUM) : (cat.id === 'PARTNER_LIFE') ? (user.tier === UserTier.PLATINUM) : true; if (!isVisible) return null; return (<button key={cat.id} onClick={() => handleCategorySelect(cat)} className={`relative flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-200 border-wine-gradient backdrop-blur-sm group bg-gradient-to-br from-[#1a103c] to-[#000000] hover:-translate-y-1 hover:shadow-[0_8px_15px_rgba(88,28,135,0.4)]`}><span className="text-4xl mb-2 filter drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] transition-transform duration-300 group-hover:scale-110">{cat.icon}</span><span className="text-gray-200 font-sans font-bold tracking-wide group-hover:text-white transition-colors">{lang === 'en' ? cat.id : cat.label}</span>{cat.cost && <span className="absolute top-2 right-2 text-[10px] text-yellow-500 bg-black/80 px-1 rounded border border-yellow-700">-{cat.cost}</span>}</button>); })}</div></div> )}
          {appState === AppState.CHAT_ROOM && ( <ChatView user={user} lang={lang} onLeave={() => navigateTo(AppState.CATEGORY_SELECT)} /> )}
          {appState === AppState.FACE_UPLOAD && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in"><div className="w-full max-w-md bg-black/60 border border-purple-500/50 p-6 rounded text-center"><h2 className="text-xl font-bold text-white mb-4">{TRANSLATIONS[lang].face_reading_title}</h2><p className="text-gray-300 mb-6 text-sm md:text-base leading-relaxed break-keep">{TRANSLATIONS[lang].face_reading_desc}</p><div className="mb-6 border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-purple-500 transition-colors cursor-pointer relative"><input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend=()=>setFaceImage(r.result as string); r.readAsDataURL(f); } }} className="absolute inset-0 opacity-0 cursor-pointer" />{faceImage ? <img src={faceImage} className="max-h-48 mx-auto rounded" /> : <span className="text-gray-500">{TRANSLATIONS[lang].face_guide}</span>}</div><div className="flex gap-2"><button onClick={() => navigateTo(AppState.CATEGORY_SELECT)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold">{TRANSLATIONS[lang].back}</button><button onClick={startFaceReading} className="flex-[2] py-3 bg-purple-700 hover:bg-purple-600 rounded font-bold">{TRANSLATIONS[lang].face_upload_btn}</button></div></div></div> )}
          {appState === AppState.LIFE_INPUT && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in"><div className="w-full max-w-md bg-black/60 border border-purple-500/50 p-6 rounded text-center"><h2 className="text-xl font-bold text-white mb-2">{TRANSLATIONS[lang].life_reading_title}</h2><div className="flex gap-4 justify-center mb-6"><select value={birthTime.h} onChange={e=>setBirthTime({...birthTime, h:e.target.value})} className="bg-gray-800 text-white p-2 rounded">{Array.from({length:24}).map((_,i) => <option key={i} value={i.toString()}>{i}시</option>)}</select><select value={birthTime.m} onChange={e=>setBirthTime({...birthTime, m:e.target.value})} className="bg-gray-800 text-white p-2 rounded">{Array.from({length:60}).map((_,i) => <option key={i} value={i.toString()}>{i}분</option>)}</select></div><div className="flex gap-2"><button onClick={() => navigateTo(AppState.CATEGORY_SELECT)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold">{TRANSLATIONS[lang].back}</button><button onClick={startLifeReading} className="flex-[2] py-3 bg-purple-700 hover:bg-purple-600 rounded font-bold">{TRANSLATIONS[lang].life_input_btn}</button></div></div></div> )}
          {appState === AppState.PARTNER_INPUT && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in"><div className="w-full max-w-md bg-black/60 border border-purple-500/50 p-6 rounded text-center"><h2 className="text-xl font-bold text-white mb-2">{selectedCategory?.label}</h2><p className="text-gray-400 mb-6">{selectedCategory?.id === 'SECRET_COMPAT' ? TRANSLATIONS[lang].secret_compat_desc : TRANSLATIONS[lang].partner_life_desc}</p><input value={partnerBirth} onChange={e=>setPartnerBirth(e.target.value)} placeholder={TRANSLATIONS[lang].partner_birth_ph} className="w-full p-3 bg-gray-800 rounded text-white border border-gray-700 focus:border-purple-500 mb-6 outline-none"/><div className="flex gap-2"><button onClick={() => navigateTo(AppState.CATEGORY_SELECT)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold">{TRANSLATIONS[lang].back}</button><button onClick={startPartnerReading} className="flex-[2] py-3 bg-purple-700 hover:bg-purple-600 rounded font-bold">{selectedCategory?.id === 'SECRET_COMPAT' ? TRANSLATIONS[lang].secret_compat_btn : TRANSLATIONS[lang].partner_life_btn}</button></div></div></div> )}
          {appState === AppState.QUESTION_SELECT && selectedCategory && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in pt-20"><h2 className="text-2xl font-occult text-purple-200 mb-6 text-center">{selectedCategory.label}</h2><div className="w-full max-w-xl space-y-3">{selectedCategory.questions.map((q, i) => (<button key={i} onClick={() => handleQuestionSelect(q)} className="w-full p-4 text-left bg-black/60 border border-purple-900/50 rounded hover:bg-purple-900/30 hover:border-purple-500 transition-all text-gray-200 text-sm md:text-base">{q}</button>))}<div className="relative mt-6 pt-4 border-t border-gray-800"><input className="w-full p-4 bg-gray-900 border border-gray-700 rounded text-white focus:border-purple-500 focus:outline-none" placeholder={TRANSLATIONS[lang].custom_q_ph} value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} /><button onClick={() => handleQuestionSelect(customQuestion)} className="absolute right-2 top-6 bottom-2 px-4 bg-purple-900 rounded text-xs font-bold hover:bg-purple-700 mt-4 mb-2">OK</button></div><button onClick={() => navigateTo(AppState.CATEGORY_SELECT)} className="w-full mt-6 py-3 bg-gray-800 text-gray-400 hover:text-white rounded border border-gray-700">{TRANSLATIONS[lang].back}</button></div></div> )}
          {appState === AppState.SHUFFLING && ( <ShufflingAnimation onComplete={() => navigateTo(AppState.CARD_SELECT)} lang={lang} skin={user.currentSkin} activeCustomSkin={user.activeCustomSkin} rugColor={user.rugColor} /> )}
          {appState === AppState.CARD_SELECT && ( <CardSelection onSelectCards={handleCardSelect} lang={lang} skin={user.currentSkin} activeCustomSkin={user.activeCustomSkin} /> )}
          {appState === AppState.RESULT && ( <ResultView question={selectedQuestion} selectedCards={selectedCards} onRetry={() => navigateTo(AppState.CATEGORY_SELECT)} lang={lang} readingPromise={readingPromise} onReadingComplete={(text) => { const result: ReadingResult = { date: new Date().toISOString(), question: selectedQuestion, cards: selectedCards, interpretation: text }; updateUser((prev) => ({ ...prev, history: [result, ...(prev.history ?? [])] })); }} user={user} spendCoins={spendCoins} onLogin={() => setAuthMode("LOGIN")} /> )}
          
          {showShop && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
                 <div className="bg-[#0f0826] border-2 border-yellow-600/70 p-8 rounded-xl max-w-lg w-full relative overflow-hidden shadow-[0_0_80px_rgba(234,179,8,0.2)]">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                     <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"></div>
                     <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
                     <button onClick={() => { setShowShop(false); setShopStep('AMOUNT'); }} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
                     {shopStep === 'AMOUNT' ? (
                        <>
                            <div className="text-center mb-8 relative z-10"><h2 className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 font-bold mb-2 font-occult drop-shadow-sm">{TRANSLATIONS[lang].shop_title}</h2><p className="text-sm text-yellow-100/60 italic font-serif-en">"{TRANSLATIONS[lang].shop_subtitle}"</p></div>
                            <div className="grid grid-cols-1 gap-4 relative z-10">
                                <button onClick={() => initiatePayment(4900, 60)} className="group flex justify-between items-center p-5 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg hover:from-gray-800 hover:to-gray-700 border border-gray-700 hover:border-yellow-500/50 transition-all transform hover:-translate-y-1 shadow-lg"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-yellow-900/30 flex items-center justify-center text-xl">💰</div><span className="font-bold text-white text-lg">{TRANSLATIONS[lang].shop_pkg_1}</span></div><span className="text-yellow-500 text-sm font-bold uppercase tracking-wider group-hover:text-yellow-300">Purchase</span></button>
                                <button onClick={() => initiatePayment(7900, 110)} className="group flex justify-between items-center p-6 bg-gradient-to-r from-yellow-900/20 to-black rounded-lg border-2 border-yellow-600/50 hover:border-yellow-400 hover:bg-yellow-900/30 transition-all transform hover:-translate-y-1 shadow-[0_0_20px_rgba(234,179,8,0.15)] relative overflow-hidden"><div className="absolute top-0 right-0 bg-yellow-600 text-black text-[10px] font-bold px-2 py-1 rounded-bl">POPULAR</div><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center text-2xl shadow-inner">💎</div><span className="font-bold text-yellow-100 text-xl">{TRANSLATIONS[lang].shop_pkg_2}</span></div><span className="text-white bg-yellow-600 px-4 py-1 rounded-full text-xs font-bold shadow hover:bg-yellow-500">BUY NOW</span></button>
                                <button onClick={() => initiatePayment(15500, 220)} className="group flex justify-between items-center p-5 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg hover:from-gray-800 hover:to-gray-700 border border-gray-700 hover:border-yellow-500/50 transition-all transform hover:-translate-y-1 shadow-lg"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center text-xl">👑</div><span className="font-bold text-white text-lg">{TRANSLATIONS[lang].shop_pkg_3}</span></div><span className="text-yellow-500 text-sm font-bold uppercase tracking-wider group-hover:text-yellow-300">Purchase</span></button>
                            </div>
                        </>
                     ) : (
                         <>
                            <div className="text-center mb-6 relative z-10"><h2 className="text-2xl text-gold-gradient font-bold mb-2">{TRANSLATIONS[lang].pay_title}</h2><p className="text-lg text-white font-bold">{pendingPackage?.coins} Coins / ₩{pendingPackage?.amount.toLocaleString()}</p></div>
                            <div className="flex flex-col gap-3 relative z-10">{['KAKAO', 'TOSS', 'PAYPAL'].map((m) => (<button key={m} onClick={() => setSelectedPaymentMethod(m as any)} className={`p-4 rounded border flex items-center justify-center font-bold transition-all ${selectedPaymentMethod === m ? 'bg-yellow-600 text-black border-yellow-400 shadow-lg scale-105' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>{m === 'KAKAO' ? 'Kakao Bank' : m === 'TOSS' ? 'Toss Payments' : 'PayPal'}</button>))}<div className="flex gap-2 mt-6"><button onClick={() => setShopStep('AMOUNT')} className="flex-1 py-3 bg-gray-700 text-gray-300 rounded font-bold hover:bg-gray-600">{TRANSLATIONS[lang].pay_cancel}</button><button onClick={processPayment} className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded hover:from-yellow-500 hover:to-yellow-400 shadow-lg transform hover:scale-105 transition-transform">{TRANSLATIONS[lang].pay_confirm}</button></div></div>
                         </>
                     )}
                 </div>
             </div>
          )}

          {showSettings && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                 <div className="bg-gray-900 border-wine-gradient p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl overflow-y-auto max-h-[80vh]">
                     <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-occult text-purple-200">{settingsMode === 'MAIN' ? TRANSLATIONS[lang].settings_title : settingsMode === 'RUG' ? 'Rug Color' : settingsMode === 'BGM' ? 'BGM Upload' : settingsMode === 'SKIN' ? 'Card Skins' : TRANSLATIONS[lang].history}</h3><button onClick={() => { if (settingsMode === 'MAIN') setShowSettings(false); else setSettingsMode('MAIN'); }} className="text-gray-400">{settingsMode === 'MAIN' ? '✕' : '←'}</button></div>
                     
                     {settingsMode === 'MAIN' && (
                         <>
                         {user.email !== 'Guest' && (
                             <>
                             <div className="mb-6 bg-black/40 p-4 rounded border border-purple-900">
                                 <h4 className="text-gold-gradient font-bold mb-4">{TRANSLATIONS[lang].tier_info}: <span className="text-white">{user.tier}</span></h4>
                                 <div className="space-y-3">
                                     <div className={`flex justify-between items-center p-3 rounded-lg ${user.tier === UserTier.BRONZE ? 'bg-stone-800 border border-stone-600' : 'opacity-50'}`}><span className="text-stone-400 font-bold">Bronze</span><span className="text-xs text-stone-500">0 Used</span></div>
                                     <div className={`flex justify-between items-center p-3 rounded-lg ${user.tier === UserTier.SILVER ? 'bg-gray-300 text-black border border-white shadow-[0_0_10px_white]' : 'opacity-50'}`}><span className="font-bold">Silver</span><span className="text-xs">400 Used</span></div>
                                     <div className={`flex justify-between items-center p-3 rounded-lg ${user.tier === UserTier.GOLD ? 'bg-yellow-500 text-black border border-yellow-300 shadow-[0_0_10px_gold]' : 'opacity-50'}`}><span className="font-bold">Gold</span><span className="text-xs">1500 Used</span></div>
                                     <div className={`flex justify-between items-center p-3 rounded-lg ${user.tier === UserTier.PLATINUM ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border border-purple-300 shadow-[0_0_15px_purple]' : 'opacity-50'}`}><span className="font-bold">Platinum</span><span className="text-xs">4000 Used</span></div>
                                 </div>
                                 <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-1">
                                     <div className="flex justify-between text-xs"><span className="text-gray-400">이번 달 사용</span><span className="text-yellow-500 font-mono">{user.monthlyCoinsSpent || 0} Coins</span></div>
                                     <div className="flex justify-between text-xs"><span className="text-gray-400">누적 사용</span><span className="text-gray-400 font-mono">{user.totalSpent || 0} Coins</span></div>
                                 </div>
                             </div>
                             <div className="mb-4 flex gap-2">
                                <button onClick={() => setShowAttendancePopup(true)} className="flex-1 py-2 bg-yellow-900/30 text-yellow-500 border border-yellow-700 rounded font-bold hover:bg-yellow-900/50 text-xs">{TRANSLATIONS[lang].attendance}</button>
                                <button onClick={() => setSettingsMode('HISTORY')} className="flex-1 py-2 bg-purple-900/30 text-purple-300 border border-purple-700 rounded font-bold hover:bg-purple-900/50 text-xs">{TRANSLATIONS[lang].history}</button>
                             </div>
                             </>
                         )}
                         <div className="mb-6"><label className="block text-gray-400 mb-2">{TRANSLATIONS[lang].bgm_control}</label><input type="range" min="0" max="1" step="0.1" value={bgmVolume} onChange={(e) => { setBgmVolume(parseFloat(e.target.value)); if(parseFloat(e.target.value)>0 && bgmStopped) setBgmStopped(false); }} className="w-full accent-purple-500" /><div className="flex justify-between text-xs text-gray-500 mt-1"><span>Mute</span><span>Max</span></div><div className="mt-2 flex gap-2"><button onClick={() => setBgmStopped(!bgmStopped)} className="text-xs bg-gray-800 px-3 py-1 rounded border border-gray-600 hover:bg-gray-700">{bgmStopped ? '▶ Play' : '⏸ Pause'}</button></div></div>
                         <div className="mb-6"><label className="block text-gray-400 mb-2">{TRANSLATIONS[lang].language_control}</label><div className="flex bg-gray-800 rounded p-1"><button onClick={() => setLang('ko')} className={`flex-1 py-1 rounded text-sm ${lang === 'ko' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>한국어</button><button onClick={() => setLang('en')} className={`flex-1 py-1 rounded text-sm ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>English</button></div></div>
                         {user.email !== 'Guest' && (
                             <div className="mb-6 grid grid-cols-2 gap-2">
                                 <button onClick={() => setSettingsMode('SKIN')} className="p-3 bg-gray-800 border border-gray-700 rounded text-sm hover:border-purple-500 transition-colors flex flex-col items-center gap-1"><span className="text-xl">🃏</span><span>{TRANSLATIONS[lang].skin_shop}</span></button>
                                 {user.tier !== UserTier.BRONZE && user.tier !== UserTier.SILVER && (
                                     <>
                                        <button onClick={() => setSettingsMode('RUG')} className="p-3 bg-gray-800 border border-gray-700 rounded text-sm hover:border-yellow-500 transition-colors flex flex-col items-center gap-1"><span className="text-xl">🕸</span><span>{TRANSLATIONS[lang].rug_shop}</span></button>
                                        <button onClick={() => setSettingsMode('BGM')} className="p-3 bg-gray-800 border border-gray-700 rounded text-sm hover:border-yellow-500 transition-colors flex flex-col items-center gap-1"><span className="text-xl">🎵</span><span>{TRANSLATIONS[lang].bgm_upload}</span></button>
                                     </>
                                 )}
                             </div>
                         )}
                         {user.email !== 'Guest' && (<button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="w-full py-3 border border-red-900/50 text-red-400 rounded hover:bg-red-900/20">{TRANSLATIONS[lang].logout}</button>)}
                         </>
                     )}
                     
                     {settingsMode === 'RUG' && (<div className="grid grid-cols-3 gap-3">{RK_COLORS.map(c => (<button key={c.name} onClick={() => handleRugChange(c.color)} className="aspect-square rounded-full border-2 border-gray-600 hover:scale-110 transition-transform shadow-lg relative" style={{ backgroundColor: c.color }}>{user.rugColor === c.color && <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">✓</div>}</button>))}</div>)}
                     {settingsMode === 'BGM' && (<div className="text-center"><div className="border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-purple-500 transition-colors cursor-pointer relative"><input type="file" accept="audio/*" onChange={handleBgmUpload} className="absolute inset-0 opacity-0 cursor-pointer" /><p className="text-gray-400">Click to upload MP3</p></div>{currentBgm.id.startsWith('custom') && <p className="mt-4 text-green-400 text-sm">Custom BGM Playing: {currentBgm.name}</p>}</div>)}
                     {settingsMode === 'SKIN' && (
                         <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-3">
                                 {SKINS.map(skin => (
                                     <button key={skin.id} onClick={() => buySkin(skin)} className={`p-2 rounded border relative overflow-hidden group ${user.currentSkin === skin.id ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700 bg-gray-800'}`}>
                                         <div className={`h-24 w-full rounded mb-2 ${skin.cssClass.replace('design-', 'bg-design-')} bg-gray-900`}></div>
                                         <p className="text-xs font-bold text-white">{skin.name}</p>
                                         {!user.ownedSkins.includes(skin.id) && <span className="text-[10px] text-yellow-500 block mt-1">{skin.cost} Coins</span>}
                                         {user.currentSkin === skin.id && <span className="absolute top-1 right-1 text-green-400 text-lg">✓</span>}
                                     </button>
                                 ))}
                             </div>
                             {/* Silver+ Custom Upload */}
                             {user.tier !== UserTier.BRONZE && (
                                 <div className="pt-4 border-t border-gray-700">
                                     <h4 className="text-purple-300 font-bold mb-2">{TRANSLATIONS[lang].custom_skin_title}</h4>
                                     <div className="mb-3 border border-dashed border-gray-600 rounded p-4 text-center cursor-pointer relative"><input type="file" onChange={handleCustomSkinUpload} className="absolute inset-0 opacity-0 cursor-pointer" />{customSkinImage ? "Image Loaded" : TRANSLATIONS[lang].upload_skin}</div>
                                     <div className="flex gap-2 mb-3"><button onClick={()=>setIsSkinPublic(true)} className={`flex-1 py-1 rounded text-xs ${isSkinPublic?'bg-purple-600':'bg-gray-700'}`}>{TRANSLATIONS[lang].public_option}</button><button onClick={()=>setIsSkinPublic(false)} className={`flex-1 py-1 rounded text-xs ${!isSkinPublic?'bg-purple-600':'bg-gray-700'}`}>{TRANSLATIONS[lang].private_option}</button></div>
                                     <button onClick={handleSaveCustomSkin} className="w-full py-2 bg-purple-700 rounded text-sm font-bold">Save Custom Skin</button>
                                 </div>
                             )}
                             <div className="pt-4 border-t border-gray-700">
                                 <h4 className="text-gray-400 text-xs mb-2">Apply Shared Skin Code</h4>
                                 <div className="flex gap-2"><input value={inputSkinCode} onChange={e=>setInputSkinCode(e.target.value)} placeholder={TRANSLATIONS[lang].skin_code_placeholder} className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 text-sm" /><button onClick={handleApplySkinCode} className="px-3 py-1 bg-gray-700 rounded text-xs">{TRANSLATIONS[lang].skin_code_btn}</button></div>
                             </div>
                         </div>
                     )}
                     
                     {/* History Mode */}
                     {settingsMode === 'HISTORY' && (
                        <div className="space-y-4">
                            {user.history.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">{TRANSLATIONS[lang].no_history}</div>
                            ) : (
                                user.history.map((h, i) => (
                                    <div key={i} className="bg-black/60 border border-gray-700 p-4 rounded-lg hover:border-purple-500 transition-all">
                                        <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                                            <span className="text-xs text-gray-500">{new Date(h.date).toLocaleDateString()}</span>
                                            <span className="text-[10px] bg-purple-900 px-2 py-0.5 rounded text-purple-200">{h.cards.length} Cards</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-white mb-3">Q. {h.question}</h4>
                                        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
                                            {h.cards.map((c, idx) => (
                                                <img key={idx} src={c.imagePlaceholder} alt={c.name} className={`w-10 h-16 object-cover rounded border border-gray-600 ${c.isReversed ? 'rotate-180' : ''}`} />
                                            ))}
                                        </div>
                                        <div className="bg-gray-800/50 p-3 rounded text-xs text-gray-300 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 leading-relaxed whitespace-pre-wrap">{h.interpretation}</div>
                                    </div>
                                ))
                            )}
                        </div>
                     )}
                 </div>
             </div>
          )}

          {authMode && ( <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4"><div className="bg-gray-900 border border-purple-500 p-8 rounded max-w-sm w-full shadow-[0_0_50px_rgba(147,51,234,0.3)] relative"><button onClick={() => setAuthMode(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button><h2 className="text-2xl font-bold text-white mb-6 text-center">ACCESS REQUIRED</h2><AuthForm onClose={() => setAuthMode(null)} onLoginSuccess={() => { setAuthMode(null); checkUser(); }} /></div></div> )}
      </div>
  );
};

export default App;