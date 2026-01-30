import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from "./src/lib/supabase";
import { GoogleContinueButton } from "./components/AuthModal";
import LoginForm from './components/LoginForm';
import { AppState, CategoryKey, TarotCard, QuestionCategory, User, UserInfo, Language, ReadingResult, UserTier, Country, BGM, Skin, ChatMessage, CustomSkin, CustomFrame } from './types';
import { CATEGORIES, TAROT_DECK, COUNTRIES, BGMS, SKINS, TIER_THRESHOLDS, ATTENDANCE_REWARDS, RESULT_FRAMES, RESULT_BACKGROUNDS, DEFAULT_STICKERS } from './constants';
import Background from './components/Background';
import Logo from './components/Logo';
import AudioPlayer from './components/AudioPlayer';
import { getTarotReading, getFallbackTarotImage, getFaceReading, getLifeReading, getCompatibilityReading, getPartnerLifeReading, generateTarotCardImage } from './services/geminiService';
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
    select_cards_title: "카드 3장을 고르세요.",
    result_question: "질문",
    share: "결과 저장 & 공유", 
    settings_title: "설정 (Settings)",
    settings_login_only: "※ 설정 기능은 로그인 유저만 사용할 수 있습니다.",
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
    face_upload_btn: "관상 보기 (-250 Coin)",
    face_guide: "인물의 얼굴이 잘 보이는 사진을 업로드 하세요.",
    life_reading_title: "인생",
    life_reading_desc: "당신이 언제, 무엇으로 떼돈을 벌까요? 당신도 몰랐던 당신만의 천재적 재능은 무엇일까요? 모두를 거느리는 내 인생의 황금기는 언제일까요? 미래의 배우자는 어떤 키, 외모, 분위기, 직업을 가지고 있을까요? 정상에 오르기 위해 놓치면 안 될 내 인생의 귀인은 누구일까요? 당신의 타고난 성격과 성향, 그리고 그것에 기반해 주의해야 할 점은 무엇일까요? 지금 당신의 숨겨진 인생 치트키를 알아보세요.",
    life_input_btn: "인생 치트키 확인 (-250 Coin)",
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
    shop_subtitle: "마음 속 고민의 운명적인 해답을 찾아보세요.",
    shop_pkg_1: "4,900원 / 60 Coins",
    shop_pkg_2: "7,900원 / 110 Coins",
    shop_pkg_3: "15,500원 / 220 Coins",
    next: "다음",
    custom_q_ph: "구체적인 고민을 입력해 주세요.",
    history: "타로 히스토리",
    no_history: "기록이 없습니다.",
    limit_reached: "오늘의 리딩 횟수(10회)를 모두 소진했습니다. 내일 다시 시도하세요.",
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
    secret_compat_desc: "아기들은 나가라.",
    secret_compat_btn: "궁합 확인 (-200 Coin)",
    partner_life_title: "그 사람의 인생",
    partner_life_desc: "그 사람의 타고난 인생 팔자를 비밀리에 들춰 보세요.",
    partner_life_btn: "인생 훔쳐보기 (-250 Coin)",
    bronze_shop_lock: "브론즈 등급은 스킨을 구매할 수 없습니다.",
    chat_room_title: "운명의 수다방",
    chat_input_ph: "고민을 나누어 보세요...",
    chat_entry_fee: "입장료 20 코인",
    chat_full: "방이 가득 찼습니다. (최대 50명)",
    chat_leave: "나가기",
    custom_skin_title: "커스텀 스킨 스튜디오",
    upload_skin: "디자인 업로드",
    public_option: "공개 (코드 발급)",
    private_option: "비공개 (나만 사용)",
    skin_code_label: "스킨 코드 입력",
    skin_code_btn: "적용",
    skin_code_placeholder: "숫자 코드 6자리",
    skin_saved: "스킨이 저장되었습니다.",
    skin_applied: "스킨이 적용되었습니다!",
    rug_shop: "타로 러그 색상",
    bgm_upload: "BGM 업로드",
    back: "뒤로 가기",
    frame_shop: "결과지 프레임",
    custom_frame_title: "커스텀 프레임 제작",
    result_bg_shop: "결과지 배경",
    sticker_shop: "스티커 관리",
    sticker_upload: "커스텀 스티커 업로드",
    decorate_btn: "꾸미기",
    save_changes: "저장 완료"
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
    settings_login_only: "※ Features require login.",
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
    face_upload_btn: "Analyze Face (-250 Coin)",
    face_guide: "Upload a clear photo of the face.",
    life_reading_title: "Life Path",
    life_reading_desc: "When will you make a fortune? Hidden talents, golden age, future spouse.",
    life_input_btn: "Reveal Cheat Codes (-250 Coin)",
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
    limit_reached: "Daily reading limit (10) reached.",
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
    secret_compat_btn: "Check Compat (-200 Coin)",
    partner_life_title: "Their Life",
    partner_life_desc: "Secretly reveal their true destiny.",
    partner_life_btn: "Spy on Life (-250 Coin)",
    bronze_shop_lock: "Bronze tier cannot purchase skins.",
    chat_room_title: "Fate Chat Room",
    chat_input_ph: "Share your worries...",
    chat_entry_fee: "Entry Fee 20 Coins",
    chat_full: "Room is full (Max 50)",
    chat_leave: "Leave",
    custom_skin_title: "Custom Skin Studio",
    upload_skin: "Upload Design",
    public_option: "Public (Get Code)",
    private_option: "Private (Only Me)",
    skin_code_label: "Enter Skin Code",
    skin_code_btn: "Apply",
    skin_code_placeholder: "6-Digit Code",
    skin_saved: "Skin saved successfully.",
    skin_applied: "Skin applied successfully!",
    rug_shop: "Tarot Rug Color",
    bgm_upload: "BGM Upload",
    back: "Back",
    frame_shop: "Result Frame",
    custom_frame_title: "Create Custom Frame",
    result_bg_shop: "Result Background",
    sticker_shop: "Sticker Manager",
    sticker_upload: "Upload Custom Sticker",
    decorate_btn: "Decorate",
    save_changes: "Saved"
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

    // Generate a stable ID for guest session if not present
    const getChatUserId = () => {
        if (user.email !== 'Guest') return user.email;
        let guestId = sessionStorage.getItem('guest_chat_id');
        if (!guestId) {
            guestId = 'Guest-' + Math.random().toString(36).substring(2, 9);
            sessionStorage.setItem('guest_chat_id', guestId);
        }
        return guestId;
    };

    const chatUserId = getChatUserId();

    useEffect(() => {
        if (!isSupabaseConfigured) {
            // Mock chat if backend is not configured
            setMessages([{
                id: 'system', userId: 'system', nickname: 'System', 
                text: 'Chat is unavailable in demo mode (Backend not configured).', 
                timestamp: Date.now(), tier: UserTier.PLATINUM, avatarUrl: ''
            }]);
            return;
        }

        // Connect to a global channel for all users
        const channel = supabase.channel('black-tarot-global', {
            config: {
                presence: {
                    key: chatUserId
                }
            }
        });

        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'chat' }, ({ payload }) => {
                setMessages(prev => {
                    // Optimized: Keep only the last 50 messages to prevent lag
                    const newMessages = [...prev, payload];
                    return newMessages.slice(-50);
                });
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
            userId: chatUserId,
            nickname: user.userInfo?.name || 'Anonymous',
            avatarUrl: user.userInfo?.profileImage,
            bio: user.userInfo?.bio || '', // Ensure bio is passed
            text: inputText,
            timestamp: Date.now(),
            tier: user.tier
        };

        // Optimistic UI update
        setMessages(prev => [...prev, msg].slice(-50)); 

        if (isSupabaseConfigured) {
            await channelRef.current?.send({
                type: 'broadcast',
                event: 'chat',
                payload: msg
            });
        }

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
                    const isMe = msg.userId === chatUserId;
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
                    onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        if (e.key === 'Enter') handleSendMessage();
                    }}
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

            {/* Profile Popup Overlay - Shows All User Data */}
            {viewingUser && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in" onClick={() => setViewingUser(null)}>
                    <div className="bg-[#1a103c] border-2 border-purple-500 p-6 rounded-xl max-w-xs w-full text-center relative shadow-[0_0_50px_rgba(147,51,234,0.5)] transform transition-transform scale-100" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setViewingUser(null)}>✕</button>
                        <div className="w-24 h-24 rounded-full border-2 border-yellow-500 mx-auto mb-4 overflow-hidden shadow-lg bg-gray-800">
                             {viewingUser.avatarUrl ? <img src={viewingUser.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{viewingUser.nickname}</h3>
                        <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold mb-4 uppercase tracking-widest ${viewingUser.tier === UserTier.PLATINUM ? 'bg-purple-900 text-purple-200 border border-purple-500' : viewingUser.tier === UserTier.GOLD ? 'bg-yellow-900 text-yellow-200 border border-yellow-500' : 'bg-gray-800 text-gray-300 border border-gray-600'}`}>
                            {viewingUser.tier}
                        </span>
                        <div className="bg-black/40 p-4 rounded border border-purple-900/50 min-h-[80px] max-h-[150px] overflow-y-auto">
                            <p className="text-sm text-gray-300 italic whitespace-pre-wrap leading-relaxed">"{viewingUser.bio || 'No bio available.'}"</p>
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
  // Increased Z-Index to 60 to ensure it's above normal overlays (usually z-50)
  <div className="fixed top-0 left-0 right-0 z-[60] flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/95 to-transparent pointer-events-none transition-all">
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
      {user.email === 'Guest' && (
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
      <button onClick={onOpenSettings} className="text-gray-400 hover:text-purple-400 transition-colors p-2 cursor-pointer z-50">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// MISSING COMPONENTS IMPLEMENTATION
// ---------------------------------------------------------------------------

const UserInfoForm: React.FC<{ onSubmit: (info: UserInfo) => void; lang: Language }> = ({ onSubmit, lang }) => {
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [country, setCountry] = useState('South Korea');

    const handleSubmit = () => {
        if (!name || !birthDate) return alert("Please fill in all fields.");
        if (birthDate.length !== 8) return alert("Birthdate must be 8 digits (YYYYMMDD).");
        
        const info: UserInfo = {
            name,
            birthDate,
            country,
            timezone: COUNTRIES.find(c => c.nameEn === country)?.timezone || 'Asia/Seoul',
            zodiacSign: 'Unknown', // meaningful calculation omitted for brevity
            nameChangeCount: 0,
            birthDateChanged: false,
            countryChanged: false
        };
        onSubmit(info);
    };

    return (
        <div className="space-y-4 w-full text-left">
            <div>
                <label className="block text-xs text-gray-400 mb-1">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-purple-500 outline-none" placeholder="Name / Nickname" />
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1">Birthdate (YYYYMMDD)</label>
                <input value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-purple-500 outline-none" placeholder="19990101" maxLength={8} />
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1">Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-purple-500 outline-none">
                    {COUNTRIES.map(c => <option key={c.code} value={c.nameEn}>{c.nameKo} ({c.nameEn})</option>)}
                </select>
            </div>
            {/* Updated Darker Purple Next Button */}
            <button onClick={handleSubmit} className="w-full bg-[#1a052a] hover:bg-[#3b0764] text-white font-bold py-3 rounded mt-4 transition-all shadow-[0_0_15px_rgba(76,29,149,0.5)] border border-purple-900/50">
                Next
            </button>
        </div>
    );
};

const ShufflingAnimation: React.FC<{ onComplete: () => void; lang: Language; skin: string; activeCustomSkin?: CustomSkin | null; rugColor?: string }> = ({ onComplete, lang, skin, activeCustomSkin, rugColor }) => {
    useEffect(() => {
        playShuffleLoop();
        const timer = setTimeout(() => {
            stopShuffleLoop();
            onComplete();
        }, 1200); // Further sped up shuffling for snappy feel (1.5s -> 1.2s)
        return () => {
            clearTimeout(timer);
            stopShuffleLoop();
        };
    }, [onComplete]);

    // SVG Noise Data for Rug Texture
    const noiseSvg = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E";

    // Dynamic Style for Rug
    const rugStyle = {
        background: `radial-gradient(circle at center, ${rugColor || '#2e0b49'} 0%, #000000 100%), url("${noiseSvg}")`,
        backgroundBlendMode: 'multiply'
    };

    // Custom skin support
    const cardBackStyle = activeCustomSkin ? { backgroundImage: `url(${activeCustomSkin.imageUrl})`, backgroundSize: 'cover' } : {};

    return (
        <div 
            className="flex flex-col items-center justify-center min-h-screen relative z-10 animate-fade-in rug-texture !border-0 !outline-none !shadow-none" 
            style={rugStyle}
        >
            <style>{`
                @keyframes cosmic-shuffle {
                    0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); z-index: 1; filter: brightness(1); }
                    25% { transform: translate3d(-120px, -20px, 0) rotate(-10deg) scale(1.05); z-index: 10; filter: brightness(1.2); }
                    50% { transform: translate3d(0, -40px, 0) rotate(0deg) scale(1.1); z-index: 20; filter: brightness(1.5) drop-shadow(0 0 15px #a855f7); }
                    75% { transform: translate3d(120px, -20px, 0) rotate(10deg) scale(1.05); z-index: 10; filter: brightness(1.2); }
                    100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); z-index: 1; filter: brightness(1); }
                }
                @keyframes deck-pulse-fancy {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(168,85,247,0.3); }
                    50% { transform: scale(1.02); box-shadow: 0 0 40px rgba(168,85,247,0.6); }
                }
            `}</style>

            <div className="relative w-40 h-64 z-20" style={{ animation: 'deck-pulse-fancy 1.5s infinite ease-in-out', willChange: 'transform, box-shadow' }}>
                {/* Center Static Base */}
                 <div className={`absolute inset-0 bg-purple-900 rounded-lg border border-purple-500/30 shadow-[0_0_20px_rgba(0,0,0,0.8)] card-back ${SKINS.find(s => s.id === skin)?.cssClass}`} style={cardBackStyle}></div>

                {/* Left Orbit - Fluid & Flashy */}
                {[...Array(8)].map((_, i) => (
                    <div key={`left-${i}`} className={`absolute inset-0 bg-purple-900 rounded-lg border border-purple-400/40 card-back ${SKINS.find(s => s.id === skin)?.cssClass}`} 
                         style={{ 
                             animation: `cosmic-shuffle 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite`,
                             animationDelay: `${i * 0.08}s`,
                             boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                             willChange: 'transform, filter',
                             ...cardBackStyle
                         }}>
                    </div>
                ))}

                {/* Right Orbit - Fluid & Flashy (Offset) */}
                {[...Array(8)].map((_, i) => (
                    <div key={`right-${i}`} className={`absolute inset-0 bg-purple-900 rounded-lg border border-purple-400/40 card-back ${SKINS.find(s => s.id === skin)?.cssClass}`}
                        style={{
                            animation: `cosmic-shuffle 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite reverse`,
                            animationDelay: `${i * 0.08}s`,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            willChange: 'transform, filter',
                            ...cardBackStyle
                        }}>
                    </div>
                ))}
                
                {/* Central Magic Core */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-24 h-24 bg-purple-500/30 blur-3xl rounded-full animate-pulse"></div>
                </div>
            </div>
            
            <p className="mt-32 text-purple-200 font-occult animate-pulse text-2xl z-20 shadow-black drop-shadow-md">
                {lang === 'ko' ? "운명을 섞는 중..." : "Shuffling Fate..."}
            </p>
        </div>
    );
};

const CardSelection: React.FC<{ onSelectCards: (indices: number[]) => void; lang: Language; skin: string; activeCustomSkin?: CustomSkin | null; rugColor?: string }> = ({ onSelectCards, lang, skin, activeCustomSkin, rugColor }) => {
    const [selected, setSelected] = useState<number[]>([]);
    
    const handleCardClick = (i: number) => {
        if (selected.includes(i) || selected.length >= 3) return;
        
        playSound('SELECT');
        const newSelected = [...selected, i];
        setSelected(newSelected);
        
        if (newSelected.length === 3) {
            setTimeout(() => onSelectCards(newSelected), 1200); 
        }
    };

    // SVG Noise Data for Rug Texture
    const noiseSvg = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E";

    // Dynamic Style for Rug
    const rugStyle = {
        background: `radial-gradient(circle at center, ${rugColor || '#2e0b49'} 0%, #000000 100%), url("${noiseSvg}")`,
        backgroundBlendMode: 'multiply'
    };

    return (
        <div 
            className="flex flex-col items-center justify-start min-h-screen overflow-hidden relative z-10 pt-20 pb-10 rug-texture !border-0 !outline-none !shadow-none"
            style={rugStyle}
        >
            <h2 className="text-2xl font-occult text-purple-200 mb-8 animate-pulse text-center w-full shadow-black drop-shadow-md">
                {lang === 'ko' ? "3장의 카드를 선택하세요" : "Select 3 Cards"}
            </h2>
            <div className="w-full max-w-5xl h-[70vh] overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-transparent touch-pan-y">
                <div className="grid grid-cols-8 md:grid-cols-12 gap-1 pb-32">
                    {TAROT_DECK.map((cardName, i) => {
                        const isSelected = selected.includes(i);
                        return (
                            <div 
                                key={i}
                                onClick={() => handleCardClick(i)}
                                // Highly Optimized Fluid Animation for Mobile:
                                // - Use 'will-change: transform' to hint browser
                                // - Remove complex shadow transitions (only opacity/transform)
                                // - Snappy bezier curve for instant feedback
                                className={`aspect-[2/3] rounded-sm border border-purple-500/30 cursor-pointer 
                                transition-transform duration-200 ease-out card-back ${SKINS.find(s => s.id === skin)?.cssClass} 
                                touch-manipulation active:scale-95 will-change-transform
                                ${isSelected 
                                    ? 'scale-110 border-purple-200 z-50 brightness-125 -translate-y-4' 
                                    : 'hover:-translate-y-1 hover:scale-105 z-0 hover:z-10'}`}
                                style={{
                                    backgroundSize: 'cover',
                                    backgroundImage: activeCustomSkin ? `url(${activeCustomSkin.imageUrl})` : undefined,
                                    // Static shadow for selected, no shadow for others to save GPU
                                    boxShadow: isSelected ? '0 0 15px #d946ef' : 'none'
                                }}
                            >
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="absolute bottom-10 flex gap-3 z-20 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 border-purple-500 transition-all duration-300 ${selected.length > i ? 'bg-purple-500 shadow-[0_0_15px_#d946ef] scale-125' : 'bg-transparent'}`}></div>
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
    onLogin: () => void 
}> = ({ question, selectedCards, onRetry, lang, readingPromise, onReadingComplete, user, spendCoins }) => {
    const [rawText, setRawText] = useState<string | null>(null);
    const [interpretation, setInterpretation] = useState<string>("");
    const [solution, setSolution] = useState<string>("");
    const [isSolutionUnlocked, setIsSolutionUnlocked] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const hasLogRef = useRef(false); // Ref to prevent double logging in StrictMode

    // Determine Result Background Style
    let resultBgStyle: any = {};
    if (user.resultBackground) {
        if (user.resultBackground.startsWith('http') || user.resultBackground.startsWith('data:')) {
            resultBgStyle = { backgroundImage: `url(${user.resultBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' };
        } else {
            const foundBg = RESULT_BACKGROUNDS.find(bg => bg.id === user.resultBackground);
            if (foundBg) resultBgStyle = { background: foundBg.css };
        }
    } else {
        resultBgStyle = { background: RESULT_BACKGROUNDS[0].css };
    }

    // Determine Result Frame Style
    let resultFrameStyle: any = {};
    let isCustomFrame = false;
    if (user.resultFrame && user.resultFrame !== 'default') {
        const presetFrame = RESULT_FRAMES.find(f => f.id === user.resultFrame);
        if (presetFrame) {
            // Preset frames use raw CSS string, need to apply via style attribute carefully or class
            // Here we just use the raw CSS text on an inner div
        } else {
            const customFrame = user.customFrames?.find(f => f.id === user.resultFrame);
            if (customFrame) {
                isCustomFrame = true;
                resultFrameStyle = { 
                    border: '20px solid transparent', 
                    borderImage: `url(${customFrame.imageUrl}) 30 round` 
                };
            }
        }
    }

    // Initial Solution Unlock Check
    useEffect(() => {
        // If guest visiting for the very first time, unlock freely.
        const hasVisited = localStorage.getItem('has_visited');
        if (!hasVisited && user.email === 'Guest') {
            setIsSolutionUnlocked(true);
            localStorage.setItem('has_visited', 'true');
        }
    }, [user.email]);

    useEffect(() => {
        if (readingPromise && !rawText) { 
            readingPromise
                .then(text => {
                    setRawText(text);
                    
                    // Fix: Prevent double execution of history saving
                    if (!hasLogRef.current) {
                        hasLogRef.current = true;
                        onReadingComplete(text);
                    }
                    
                    // Parse Text
                    const solutionHeader = lang === 'en' ? "[Practical Solutions]" : "[실질적인 해결책]";
                    if (text.includes(solutionHeader)) {
                        const parts = text.split(solutionHeader);
                        setInterpretation(parts[0].trim());
                        setSolution(solutionHeader + "\n" + parts[1].trim());
                    } else {
                        setInterpretation(text);
                        setSolution(""); 
                    }
                })
                .catch(err => {
                    console.error(err);
                    setRawText("운명의 신호가 약합니다. 다시 시도해주세요.");
                });
        }
    }, [readingPromise, onReadingComplete, rawText, lang]);

    const handleUnlockSolution = () => {
        if (spendCoins(15)) {
            setIsSolutionUnlocked(true);
        }
    };

    const handleShare = async () => {
        if (contentRef.current) {
            try {
                // Temporarily remove max-height/overflow for full screenshot if needed, or rely on scroll capture
                const canvas = await html2canvas(contentRef.current, { 
                    backgroundColor: '#000',
                    useCORS: true,
                    scale: 2 // Higher quality
                });
                const link = document.createElement('a');
                link.download = 'black-tarot-result.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (e) {
                console.error("Share failed", e);
            }
        }
    };

    // Helper to get Frame CSS string if it's a preset
    const getPresetFrameCss = () => {
        const frame = RESULT_FRAMES.find(f => f.id === user.resultFrame);
        return frame ? frame.css : '';
    };

    return (
        <div className="min-h-screen py-10 px-4 relative z-10 overflow-y-auto">
            {/* Main Result Container with Custom Background */}
            <div 
                ref={contentRef} 
                className="max-w-3xl mx-auto p-8 md:p-12 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden text-center"
                style={resultBgStyle}
            >
                {/* Dark Overlay for Readability */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>

                {/* Custom Frame Overlay */}
                <div className="absolute inset-0 pointer-events-none z-20" style={isCustomFrame ? resultFrameStyle : { cssText: getPresetFrameCss() } as any}></div>

                {/* Stickers - Randomly placed for decoration */}
                {user.customStickers?.map((sticker, idx) => (
                    <img 
                        key={idx} 
                        src={sticker} 
                        className="absolute w-12 h-12 md:w-16 md:h-16 object-contain z-20 opacity-80"
                        style={{ 
                            top: `${Math.random() * 90}%`, 
                            left: `${Math.random() * 90}%`, 
                            transform: `rotate(${Math.random() * 45 - 22.5}deg)` 
                        }}
                    />
                ))}

                {/* Content Wrapper */}
                <div className="relative z-30">
                    {/* Header Decoration */}
                    <div className="mb-6">
                        <span className="text-yellow-500/50 text-4xl">✦</span>
                    </div>

                    <h2 className="text-2xl md:text-4xl font-occult text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-4 drop-shadow-md">{question}</h2>
                    <div className="w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mb-10"></div>
                    
                    {/* Cards Display */}
                    <div className="flex justify-center items-center gap-4 md:gap-8 mb-10 flex-nowrap w-full overflow-x-auto overflow-y-visible px-4 pb-6 scrollbar-hide">
                        {selectedCards.map((card, idx) => (
                            <div key={idx} className="flex flex-col items-center animate-fade-in flex-shrink-0" style={{ animationDelay: `${idx * 0.2}s` }}>
                                <div className="w-[30vw] h-[45vw] max-w-[140px] max-h-[210px] md:w-40 md:h-60 rounded-lg bg-gray-900 border-2 border-yellow-600/30 overflow-hidden relative shadow-[0_0_20px_rgba(0,0,0,0.5)] group transform hover:scale-105 transition-transform duration-300">
                                    <img 
                                        src={card.generatedImage || card.imagePlaceholder} 
                                        alt={card.name} 
                                        className={`w-full h-full object-cover transition-transform duration-700 ${card.isReversed ? 'rotate-180' : ''}`} 
                                    />
                                    {card.isReversed && <div className="absolute inset-0 bg-red-900/30 pointer-events-none flex items-center justify-center"><span className="text-xs md:text-sm font-bold bg-black/70 px-2 py-1 rounded text-red-400 border border-red-500">REVERSED</span></div>}
                                </div>
                                <span className="text-xs md:text-sm text-yellow-100/80 mt-3 font-serif truncate w-full text-center px-1 tracking-wider">{card.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Interpretation */}
                    <div className="text-left space-y-8 bg-black/40 p-6 rounded-lg border border-white/10 backdrop-blur-md">
                        {!rawText ? (
                            <div className="text-center py-10 space-y-4">
                                <div className="inline-block w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-yellow-200 animate-pulse font-serif text-lg">
                                    {lang === 'ko' ? "운명의 메시지를 해석하는 중..." : "Interpreting Fate..."}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="prose prose-invert max-w-none">
                                    <div className="whitespace-pre-line text-gray-100 leading-relaxed text-sm md:text-lg font-serif tracking-wide">
                                        {interpretation}
                                    </div>
                                </div>

                                {solution && (
                                    <div className="relative mt-8 pt-6 border-t border-white/10">
                                        <div className={`prose prose-invert max-w-none p-6 rounded-lg border transition-all duration-700 ${isSolutionUnlocked ? 'bg-purple-900/30 border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'bg-black/60 border-gray-700 blur-sm select-none'}`}>
                                            <div className="whitespace-pre-line text-gray-200 leading-relaxed text-sm md:text-lg font-bold font-serif">
                                                {isSolutionUnlocked ? solution : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(15)}
                                            </div>
                                        </div>
                                        
                                        {!isSolutionUnlocked && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/20 backdrop-blur-[1px]">
                                                <div className="text-5xl mb-4 drop-shadow-lg">🔒</div>
                                                <button 
                                                    onClick={handleUnlockSolution}
                                                    className="px-8 py-4 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-full shadow-[0_0_25px_rgba(168,85,247,0.6)] transform hover:scale-105 transition-all flex items-center gap-3 border border-purple-400/30"
                                                >
                                                    <span className="text-lg">{lang === 'ko' ? '실질적인 해결책 보기' : 'Unlock Practical Solution'}</span>
                                                    <span className="bg-black/40 px-3 py-1 rounded-full text-sm text-yellow-300 font-mono">-15 Coin</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    {/* Footer Decoration */}
                    <div className="mt-10 opacity-50">
                        <span className="text-yellow-500 text-2xl">✦ &nbsp; ✦ &nbsp; ✦</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {rawText && (
                <div className="mt-8 flex gap-4 justify-center relative z-40">
                    <button onClick={onRetry} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 font-bold transition-all border border-gray-600 shadow-lg">
                        {lang === 'ko' ? "처음으로" : "Home"}
                    </button>
                    <button onClick={handleShare} className="px-8 py-3 bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-white font-bold rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all border border-yellow-500/50 flex items-center gap-2">
                        <span>📸</span> {lang === 'ko' ? "결과 저장" : "Save Image"}
                    </button>
                </div>
            )}
        </div>
    );
};

const AuthForm: React.FC<{ onClose: () => void; onLoginSuccess: () => void }> = ({ onClose, onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                alert("Login Failed: " + error.message);
            } else {
                onLoginSuccess();
            }
        } else {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                alert("Sign Up Failed: " + error.message);
            } else {
                alert("Check your email for the confirmation link!");
                setIsLogin(true);
            }
        }
        setLoading(false);
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Email" 
                    className="p-3 bg-black/50 border border-gray-700 rounded text-white focus:border-purple-500 outline-none"
                    required 
                />
                <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Password" 
                    className="p-3 bg-black/50 border border-gray-700 rounded text-white focus:border-purple-500 outline-none"
                    required 
                />
                <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded text-white font-bold transition-all shadow-lg">
                    {loading ? "Loading..." : (isLogin ? "Log In" : "Sign Up")}
                </button>
            </form>
            
            <div className="mt-4 flex flex-col gap-3">
                <GoogleContinueButton />
                
                <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-gray-400 hover:text-white underline">
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                </button>
            </div>
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

const TIER_POPUP_TEXT = {
    ko: {
        up_title: "🎉 티어 상승! 축하합니다!",
        down_title: "📉 티어 하락",
        up_msg: "등급이 올랐습니다! 다음 혜택이 적용됩니다:",
        down_msg: "15일 동안 접속하지 않아 티어가 하락했습니다.",
        confirm: "확인",
        benefit_silver: "일일 리딩 횟수 30회로 증가",
        benefit_gold: "일일 리딩 무제한 + 월 코인 1.5배",
        benefit_platinum: "월 코인 2.0배 + VIP 배지"
    },
    en: {
        up_title: "🎉 LEVEL UP! Congratulations!",
        down_title: "📉 Tier Dropped",
        up_msg: "You've reached a new tier! Enjoy these benefits:",
        down_msg: "Your tier has dropped due to inactivity for 15 days.",
        confirm: "Confirm",
        benefit_silver: "Daily Limit increased to 30",
        benefit_gold: "Unlimited Readings + 1.5x Monthly Coins",
        benefit_platinum: "2.0x Monthly Coins + VIP Badge"
    }
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [user, setUser] = useState<User>({ email: 'Guest', coins: 0, history: [], totalSpent: 0, tier: UserTier.BRONZE, attendanceDay: 0, ownedSkins: ['default'], currentSkin: 'default', readingsToday: 0, loginDates: [], customSkins: [], activeCustomSkin: null, monthlyCoinsSpent: 0, resultFrame: 'default', customFrames: [], resultBackground: 'default', customBackgrounds: [], customStickers: [] });
  const [authMode, setAuthMode] = useState<'LOGIN'|'SIGNUP'|null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMode, setSettingsMode] = useState<'MAIN' | 'RUG' | 'BGM' | 'SKIN' | 'HISTORY' | 'FRAME' | 'RESULT_BG' | 'STICKER'>('MAIN');
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGuestBlock, setShowGuestBlock] = useState(false);
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  
  // Tier Change Popups
  const [showTierChangePopup, setShowTierChangePopup] = useState(false);
  const [tierChangeDirection, setTierChangeDirection] = useState<'UP' | 'DOWN'>('UP');
  const [tierChangeNewTier, setTierChangeNewTier] = useState<UserTier>(UserTier.BRONZE);

  const [attendanceReward, setAttendanceReward] = useState(0);
  const [editProfileData, setEditProfileData] = useState<UserInfo>({ name: '', birthDate: '', country: '', timezone: '', zodiacSign: '', nameChangeCount: 0, birthDateChanged: false, countryChanged: false });
  const [customSkinImage, setCustomSkinImage] = useState<string | null>(null);
  const [customFrameImage, setCustomFrameImage] = useState<string | null>(null);
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [customStickerImage, setCustomStickerImage] = useState<string | null>(null);
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

  const saveUserState = useCallback(async (u: User, state: AppState) => {
      try {
          localStorage.setItem('black_tarot_user', JSON.stringify({ ...u, lastAppState: state }));
      } catch (e) {
          console.error("Local storage error (Quota exceeded?):", e);
      }
      if (u.email !== 'Guest' && isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          
          if (!userId) {
              console.warn("No active session, skipping cloud save.");
              return;
          }

          const payload: any = { 
              id: userId, // PK matching Auth ID
              email: u.email,
              data: { ...u, lastAppState: state }, 
              updated_at: new Date().toISOString() 
          };

          supabase.from('user_profiles').upsert(payload, { onConflict: 'id' })
            .then(({ error }) => { if (error) console.warn("Cloud save failed:", error.message); });
      }
  }, []);

  const navigateTo = (newState: AppState) => { setAppState(newState); saveUserState(user, newState); };
  const updateUser = (updater: (prev: User) => User) => { setUser(prev => { const newUser = updater(prev); saveUserState(newUser, appState); return newUser; }); };

  const handleReadingComplete = useCallback((text: string) => { 
      const result: ReadingResult = { date: new Date().toISOString(), question: selectedQuestion, cards: selectedCards, interpretation: text }; 
      updateUser((prev) => ({ ...prev, history: [result, ...(prev.history ?? [])] })); 
  }, [selectedQuestion, selectedCards]); 

  // --- IDENTITY SYNC & AUTH LISTENER ---
  useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (session?.user) {
                  checkUser(); // Load data after sync
              }
          }
      });

      let channel: RealtimeChannel | null = null;
      if (isSupabaseConfigured && user.email !== 'Guest') {
          // Listen to changes on 'user_profiles' for this user ID
          channel = supabase.channel(`user_profiles:${user.email}`)
              .on(
                  'postgres_changes',
                  {
                      event: 'UPDATE',
                      schema: 'public',
                      table: 'user_profiles', // Changed to user_profiles
                      filter: `email=eq.${user.email}`,
                  },
                  (payload) => {
                      if (payload.new && payload.new.data) {
                          setUser(prev => ({
                              ...prev,
                              ...payload.new.data
                          }));
                      }
                  }
              )
              .subscribe();
      }

      return () => {
          subscription.unsubscribe();
          if (channel) supabase.removeChannel(channel);
      };
  }, [user.email]);

  // --- SESSION PERSISTENCE LOGIC ---
  useEffect(() => {
      const timeoutId = setTimeout(() => {
          updateUser(prev => ({
              ...prev,
              currentSession: {
                  appState: appState,
                  selectedCategoryId: selectedCategory?.id,
                  selectedQuestion: selectedQuestion,
                  customQuestion: customQuestion,
                  selectedCards: selectedCards,
                  readingResult: undefined, 
                  faceImage: faceImage || undefined,
                  birthTime: birthTime,
                  partnerBirth: partnerBirth
              }
          }));
      }, 1000); 

      return () => clearTimeout(timeoutId);
  }, [appState, selectedCategory, selectedQuestion, customQuestion, selectedCards, faceImage, birthTime, partnerBirth]);

  const checkUser = useCallback(async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let localUser: User | null = null;
        
        try { 
            const stored = localStorage.getItem('black_tarot_user'); 
            if (stored) { 
                localUser = JSON.parse(stored); 
            } 
        } catch (e) {
            console.warn("Failed to parse local user data", e);
        }

        let currentUser = localUser || { ...user, email: "Guest" };

        if (isSupabaseConfigured) {
            try {
                // Renamed to authUser to prevent conflict with state 'user'
                // This gets the currently logged-in user from auth
                const { data: { user: authUser }, error: userErr } = await supabase.auth.getUser();
                
                if (authUser) {
                    const email = authUser.email || "User";
                    
                    try { 
                        // --- STRICT SYNC LOGIC START ---
                        const profilePayload = {
                            id: authUser.id,
                            email: authUser.email ?? null,
                            full_name: (authUser.user_metadata?.full_name ?? authUser.user_metadata?.name) ?? null,
                            avatar_url: authUser.user_metadata?.avatar_url ?? null,
                            updated_at: new Date().toISOString(),
                        };

                        // 1. Ensure Profile Exists via Upsert (Syncing Account Existence)
                        const { error: upsertErr } = await supabase
                            .from("user_profiles")
                            .upsert(profilePayload, { onConflict: "id" }) // ID-based conflict resolution
                            .select()
                            .single();

                        if (upsertErr) console.warn("Upsert warning:", upsertErr.message);

                        // 2. Fetch Fresh Data (Syncing Account Data)
                        // CRITICAL: We fetch the 'data' column which contains the JSON blob of the user state
                        const { data: profileData, error: fetchErr } = await supabase
                            .from("user_profiles")
                            .select("*")
                            .eq("id", authUser.id)
                            .single();
                        
                        if (profileData && profileData.data) {
                            // FOUND: Use cloud data -> This effectively syncs across devices
                            // Overwrite currentUser completely with cloud data
                            currentUser = { ...profileData.data, email };
                            
                            // Initialize arrays to prevent crashes in settings
                            if (!currentUser.customSkins) currentUser.customSkins = [];
                            if (!currentUser.customFrames) currentUser.customFrames = [];
                            if (!currentUser.customStickers) currentUser.customStickers = [];
                            if (!currentUser.customBackgrounds) currentUser.customBackgrounds = []; // Init backgrounds
                            if (!currentUser.ownedSkins) currentUser.ownedSkins = ['default'];
                        } else {
                            // If fetch fails or no data column (new user), fallback to local logic
                            // But attach correct email
                            if (!localUser || localUser.email !== email) {
                                currentUser = { ...user, email };
                            } else {
                                currentUser = { ...localUser, email };
                            }
                        }
                        // --- STRICT SYNC LOGIC END ---

                    } catch(e) { console.warn("Failed to fetch cloud data", e); }
                    // Double check email is set correctly
                    if (currentUser.email !== email) currentUser.email = email;
                } else {
                   // Guest logic
                   if (!localUser || localUser.email !== 'Guest') {
                       currentUser = { ...user, email: "Guest", lastLoginDate: today, tier: UserTier.PLATINUM }; 
                   }
                   if (!localStorage.getItem('tarot_device_id')) {
                       localStorage.setItem('tarot_device_id', Math.random().toString(36).substring(2));
                   }
                }
            } catch (err: any) { 
                console.warn("Session check failed (network/config error), defaulting to Guest:", err);
                if (!localUser || localUser.email !== 'Guest') {
                     currentUser = { ...user, email: "Guest", lastLoginDate: today, tier: UserTier.PLATINUM }; 
                }
            }
        } else {
            if (!localUser || localUser.email !== 'Guest') {
                 currentUser = { ...user, email: "Guest", lastLoginDate: today, tier: UserTier.PLATINUM }; 
            }
        }

        // FORCE SANITIZATION
        const safeNum = (val: any) => {
            const num = Number(val);
            return Number.isFinite(num) ? num : 0;
        };

        currentUser.coins = safeNum(currentUser.coins);
        currentUser.totalSpent = safeNum(currentUser.totalSpent);
        currentUser.monthlyCoinsSpent = safeNum(currentUser.monthlyCoinsSpent);
        currentUser.readingsToday = safeNum(currentUser.readingsToday);
        currentUser.attendanceDay = safeNum(currentUser.attendanceDay);

        // ... (Tier calculation logic remains the same) ...
        const oldTier = currentUser.tier;
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
        }

        let newLoginDates = [...(currentUser.loginDates || [])]; if (!newLoginDates.includes(today)) newLoginDates.push(today);
        let newCoins = currentUser.coins; let currentMonthlyReward = currentUser.lastMonthlyReward; let newAttendanceDay = currentUser.attendanceDay; let newLastAttendance = currentUser.lastAttendance;
        let newMonthlyCoinsSpent = currentUser.monthlyCoinsSpent || 0;
        const currentMonth = today.substring(0, 7);

        if (currentMonthlyReward !== currentMonth) {
            if (newTier !== UserTier.BRONZE) {
                if (currentUser.email !== 'Guest') {
                    if (newTier === UserTier.GOLD) { newCoins = Math.floor(newCoins * 1.5); alert(TRANSLATIONS[lang].reward_popup + " (1.5x)"); }
                    else if (newTier === UserTier.PLATINUM) { newCoins = Math.floor(newCoins * 2.0); alert(TRANSLATIONS[lang].reward_popup + " (2.0x)"); }
                }
            }
            newMonthlyCoinsSpent = 0; 
            newTier = UserTier.BRONZE; 
            currentMonthlyReward = currentMonth;
        } else {
            if (diffDays < 15) {
                 newTier = calculateTier(newMonthlyCoinsSpent);
            }
        }

        if (currentUser.email === 'Guest') {
            newTier = UserTier.PLATINUM;
        }

        if (currentUser.email !== 'Guest' && newTier !== oldTier) {
            const tiers = [UserTier.BRONZE, UserTier.SILVER, UserTier.GOLD, UserTier.PLATINUM];
            const oldIdx = tiers.indexOf(oldTier);
            const newIdx = tiers.indexOf(newTier);
            
            if (newTier !== UserTier.BRONZE) {
                setTierChangeNewTier(newTier);
                if (newIdx > oldIdx) {
                    setTierChangeDirection('UP');
                    setShowTierChangePopup(true);
                } else if (newIdx < oldIdx) {
                    setTierChangeDirection('DOWN');
                    setShowTierChangePopup(true);
                }
            }
        }

        if (newLastAttendance !== today) {
            if (newAttendanceDay < 10) newAttendanceDay += 1; else newAttendanceDay = 1; 
            const reward = ATTENDANCE_REWARDS[Math.min(newAttendanceDay, 10) - 1] || 20;
            
            if (currentUser.email !== 'Guest') {
                newCoins += reward; 
                setAttendanceReward(reward); 
                setShowAttendancePopup(true);
            }
            newLastAttendance = today; 
        }
        
        const readingsToday = currentUser.lastReadingDate === today ? currentUser.readingsToday : 0;

        const updatedUser = { ...currentUser, tier: newTier, coins: newCoins, lastLoginDate: today, loginDates: newLoginDates, readingsToday: readingsToday, lastReadingDate: today, lastMonthlyReward: currentMonthlyReward, attendanceDay: newAttendanceDay, lastAttendance: newLastAttendance, monthlyCoinsSpent: newMonthlyCoinsSpent };
        
        if (updatedUser.currentSession) {
            const session = updatedUser.currentSession;
            if (session.appState) setAppState(session.appState);
            if (session.selectedCategoryId) setSelectedCategory(CATEGORIES.find(c => c.id === session.selectedCategoryId) || null);
            if (session.selectedQuestion) setSelectedQuestion(session.selectedQuestion);
            if (session.customQuestion) setCustomQuestion(session.customQuestion);
            if (session.selectedCards) setSelectedCards(session.selectedCards);
            if (session.faceImage) setFaceImage(session.faceImage);
            if (session.birthTime) setBirthTime(session.birthTime);
            if (session.partnerBirth) setPartnerBirth(session.partnerBirth);
        } else if (updatedUser.lastAppState) {
            setAppState(updatedUser.lastAppState);
        }

        setUser(updatedUser); 
        saveUserState(updatedUser, updatedUser.lastAppState || AppState.WELCOME);
    } catch (error) {
        console.error("Critical error in checkUser:", error);
    }
  }, []);

  // Initialization Guard Ref to prevent double-firing in Strict Mode causing crashes
  const initRef = useRef(false);

  useEffect(() => { 
      if (!initRef.current) {
          initRef.current = true;
          checkUser(); 
      }
  }, [checkUser]);

  // LOGOUT HANDLER
  const handleLogout = async () => {
      try {
          if (isSupabaseConfigured) {
              await supabase.auth.signOut();
          }
      } catch (e) {
          console.error("Sign out error:", e);
      }
      
      localStorage.removeItem('black_tarot_user');
      
      const cleanGuestUser: User = { 
          email: 'Guest', 
          coins: 0, 
          history: [], 
          totalSpent: 0, 
          tier: UserTier.BRONZE, 
          attendanceDay: 0, 
          ownedSkins: ['default'], 
          currentSkin: 'default', 
          readingsToday: 0, 
          loginDates: [], 
          monthlyCoinsSpent: 0, 
          lastAppState: AppState.WELCOME,
          customSkins: [],
          activeCustomSkin: null,
          resultFrame: 'default',
          customFrames: [],
          resultBackground: 'default',
          customBackgrounds: [],
          customStickers: []
      };
      
      setUser(cleanGuestUser);
      setAppState(AppState.WELCOME);
      setShowSettings(false);
      setShowProfile(false);
  };

  const handleStart = () => { initSounds(); setBgmStopped(false); if (user.userInfo?.name && user.userInfo?.birthDate) navigateTo(AppState.CATEGORY_SELECT); else navigateTo(AppState.INPUT_INFO); };
  const handleUserInfoSubmit = (info: UserInfo) => { updateUser((prev) => ({ ...prev, userInfo: info })); navigateTo(AppState.CATEGORY_SELECT); };
  const spendCoins = (amount: number): boolean => { if (user.email === 'Guest') return true; if (user.coins < amount) { if (confirm(TRANSLATIONS[lang].coin_shortage)) { setShowShop(true); setShopStep('AMOUNT'); } return false; } updateUser(prev => { const newSpent = (prev.monthlyCoinsSpent || 0) + amount; return { ...prev, coins: prev.coins - amount, monthlyCoinsSpent: newSpent, tier: calculateTier(newSpent) }; }); return true; };
  
  const checkGuestAction = () => {
      if (user.email === 'Guest') {
          alert("로그인한 사용자만 이용 가능합니다.");
          return true;
      }
      return false;
  };

  const buySkin = (skin: Skin) => {
      if (checkGuestAction()) return;
      if (user.ownedSkins.includes(skin.id)) { updateUser(prev => ({ ...prev, currentSkin: skin.id, activeCustomSkin: null })); return; }
      if (spendCoins(skin.cost)) { updateUser(prev => ({ ...prev, ownedSkins: [...prev.ownedSkins, skin.id], currentSkin: skin.id, activeCustomSkin: null })); }
  };
  const handleCustomSkinUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => setCustomSkinImage(e.target?.result as string); reader.readAsDataURL(file); };
  const handleSaveCustomSkin = () => { 
      if (checkGuestAction()) return; 
      if (!customSkinImage) return; 
      if (!spendCoins(120)) return; // Added 120 coin cost check
      const newSkin: CustomSkin = { id: Math.random().toString(36).substring(2), imageUrl: customSkinImage, isPublic: isSkinPublic, shareCode: isSkinPublic ? Math.floor(100000 + Math.random() * 900000).toString() : undefined }; updateUser(prev => ({ ...prev, customSkins: [...(prev.customSkins || []), newSkin], activeCustomSkin: newSkin })); setCustomSkinImage(null); alert(`${TRANSLATIONS[lang].skin_saved} ${newSkin.shareCode ? `Code: ${newSkin.shareCode}` : ''}`); 
  };
  
  const handleCustomFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => setCustomFrameImage(e.target?.result as string); reader.readAsDataURL(file); };
  const handleSaveCustomFrame = () => { if (checkGuestAction()) return; if (!customFrameImage) return; const newFrame: CustomFrame = { id: Math.random().toString(36).substring(2), imageUrl: customFrameImage, name: 'Custom Frame' }; updateUser(prev => ({ ...prev, customFrames: [...(prev.customFrames || []), newFrame], resultFrame: newFrame.id })); setCustomFrameImage(null); alert("Frame Saved & Applied!"); };

  const handleCustomBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => setCustomBgImage(e.target?.result as string); reader.readAsDataURL(file); };
  const handleSaveCustomBg = () => { 
      if (checkGuestAction()) return; 
      if (!customBgImage) return; 
      
      const newBg: CustomFrame = { id: Math.random().toString(36).substring(2), imageUrl: customBgImage, name: 'Custom BG' };
      updateUser(prev => ({ 
          ...prev, 
          customBackgrounds: [...(prev.customBackgrounds || []), newBg],
          resultBackground: newBg.imageUrl // Automatically select the new background
      })); 
      
      setCustomBgImage(null); 
      alert("Background Saved & Applied!"); 
  };

  const handleCustomStickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => setCustomStickerImage(e.target?.result as string); reader.readAsDataURL(file); };
  const handleSaveCustomSticker = () => { if (checkGuestAction()) return; if (!customStickerImage) return; updateUser(prev => ({ ...prev, customStickers: [...(prev.customStickers || []), customStickerImage] })); setCustomStickerImage(null); alert("Sticker Added!"); };

  const handleApplySkinCode = () => { if (checkGuestAction()) return; const found = user.customSkins?.find(s => s.shareCode === inputSkinCode); if (found) { updateUser(prev => ({ ...prev, activeCustomSkin: found })); alert(TRANSLATIONS[lang].skin_applied); } else alert("Invalid Code (Simulation: Only local codes work in demo)"); };
  const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (checkGuestAction()) return; const file = e.target.files?.[0]; if (!file) return; const url = URL.createObjectURL(file); const newBgm: BGM = { id: 'custom-' + Date.now(), name: file.name, url: url, category: 'DEFAULT' }; setCurrentBgm(newBgm); alert("BGM Applied!"); };
  const handleRugChange = (color: string) => { if (checkGuestAction()) return; updateUser(prev => ({ ...prev, rugColor: color })); };
  const handleOpenProfile = () => { if (user.userInfo) setEditProfileData({ ...user.userInfo }); setShowProfile(true); };
  
  const handleSaveProfile = async () => { 
      // 1. Check existence
      if (!user.userInfo) return;
      if (checkGuestAction()) return;

      // 2. Prepare data
      const currentInfo = user.userInfo; // Source of truth for counters
      const nextInfo = { ...editProfileData }; // User's input
      
      // 3. Check Limits & Update Counters
      // Name
      if (nextInfo.name !== currentInfo.name) {
          const currentCount = currentInfo.nameChangeCount || 0;
          if (currentCount >= 5) {
              alert("이름 변경 횟수(5회)를 초과했습니다.");
              return;
          }
          nextInfo.nameChangeCount = currentCount + 1;
      } else {
          // Ensure counter is preserved from source if name didn't change (just in case editData had stale counter)
          nextInfo.nameChangeCount = currentInfo.nameChangeCount;
      }

      // Birthdate
      if (nextInfo.birthDate !== currentInfo.birthDate) {
          if (currentInfo.birthDateChanged) {
              alert("생년월일은 한 번만 변경할 수 있습니다.");
              return;
          }
          nextInfo.birthDateChanged = true;
      }
      
      // Country
      if (nextInfo.country !== currentInfo.country) {
           if (currentInfo.countryChanged) {
              alert("국가는 한 번만 변경할 수 있습니다.");
              return;
          }
          nextInfo.countryChanged = true;
      }

      // Update
      updateUser(prev => ({ ...prev, userInfo: nextInfo }));
      setShowProfile(false);
      alert("프로필이 저장되었습니다.");
  };

  const handleDeleteAccount = async () => { if (confirm(TRANSLATIONS[lang].delete_confirm)) { if (isSupabaseConfigured) await supabase.auth.signOut(); localStorage.removeItem('black_tarot_user'); localStorage.removeItem('tarot_device_id'); const cleanUser = { email: 'Guest', coins: 0, history: [], totalSpent: 0, tier: UserTier.BRONZE, attendanceDay: 0, ownedSkins: ['default'], currentSkin: 'default', readingsToday: 0, loginDates: [], monthlyCoinsSpent: 0, lastAppState: AppState.WELCOME }; setUser(cleanUser); setAppState(AppState.WELCOME); setShowProfile(false); } };
  const initiatePayment = (amount: number, coins: number) => { if (user.email === 'Guest') { alert("Please login to purchase coins."); return; } setPendingPackage({ amount, coins }); setShopStep('METHOD'); };
  const processPayment = () => { if (!pendingPackage) return; setTimeout(() => { alert(`Payment Successful via ${selectedPaymentMethod}!`); updateUser(prev => ({ ...prev, coins: prev.coins + pendingPackage.coins, totalSpent: prev.totalSpent + pendingPackage.amount, })); setPendingPackage(null); setShopStep('AMOUNT'); setShowShop(false); }, 1500); };
  
  const handleCategorySelect = (category: QuestionCategory) => { 
      if (user.email === 'Guest' && ['FACE', 'LIFE', 'SECRET_COMPAT', 'PARTNER_LIFE'].includes(category.id)) {
          setAuthMode('LOGIN');
          return;
      }

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

  const handleEnterChat = async () => { if (!spendCoins(20)) return; navigateTo(AppState.CHAT_ROOM); };
  const handleQuestionSelect = (q: string) => { setSelectedQuestion(q); navigateTo(AppState.SHUFFLING); };
  
  const checkTierLimit = () => {
      if (user.email === 'Guest') return true;
      if (user.tier === UserTier.GOLD || user.tier === UserTier.PLATINUM) return true;
      
      const limit = user.tier === UserTier.SILVER ? 30 : 10;
      if (user.readingsToday >= limit) {
          alert(`${user.tier} 등급의 일일 리딩 한도(${limit}회)를 초과했습니다. 내일 다시 시도하세요.`);
          return false;
      }
      return true;
  };

  const startFaceReading = () => { 
      if (user.email === 'Guest' && parseInt(localStorage.getItem('guest_readings') || '0') >= 1) { setShowGuestBlock(true); return; } 
      if (!checkTierLimit()) return;
      if (!faceImage) return alert("Please upload a photo first."); 
      if (!spendCoins(250)) return;
      navigateTo(AppState.RESULT); 
      setSelectedQuestion(TRANSLATIONS[lang].face_reading_title); 
      setSelectedCards([]); 
      setReadingPromise(getFaceReading(faceImage, user.userInfo, lang)); 
      updateUser(prev => ({...prev, readingsToday: prev.readingsToday + 1}));
  };

  const startLifeReading = () => {
      if (user.email === 'Guest' && parseInt(localStorage.getItem('guest_readings') || '0') >= 1) { setShowGuestBlock(true); return; }
      if (!checkTierLimit()) return;
      if (!spendCoins(250)) return;
      
      const finalUserInfo: UserInfo = {
          ...(user.userInfo as UserInfo),
          birthTime: `${birthTime.h}:${birthTime.m}`
      };

      navigateTo(AppState.RESULT);
      setSelectedQuestion(TRANSLATIONS[lang].life_reading_title);
      setSelectedCards([]);
      setReadingPromise(getLifeReading(finalUserInfo, lang));
      updateUser(prev => ({...prev, readingsToday: prev.readingsToday + 1}));
  };

  const startPartnerReading = () => {
      if (user.email === 'Guest' && parseInt(localStorage.getItem('guest_readings') || '0') >= 1) { setShowGuestBlock(true); return; }
      if (!checkTierLimit()) return;
      if (!partnerBirth || partnerBirth.length < 8) return alert("올바른 생년월일을 입력해주세요. (YYYYMMDD)");

      const isSecret = selectedCategory?.id === 'SECRET_COMPAT';
      const cost = isSecret ? 200 : 250;

      if (!spendCoins(cost)) return;

      navigateTo(AppState.RESULT);
      setSelectedQuestion(selectedCategory?.label || "Partner Reading");
      setSelectedCards([]);

      if (isSecret) {
          if (!user.userInfo) {
             alert("User info missing");
             return;
          }
          setReadingPromise(getCompatibilityReading(user.userInfo, partnerBirth, lang));
      } else {
          setReadingPromise(getPartnerLifeReading(partnerBirth, lang));
      }
      updateUser(prev => ({...prev, readingsToday: prev.readingsToday + 1}));
  };

  const handleCardSelect = (indices: number[]) => { 
      if (user.email === 'Guest') { 
          const guestReadings = parseInt(localStorage.getItem('guest_readings') || '0'); 
          if (guestReadings >= 1) { setShowGuestBlock(true); return; } 
          localStorage.setItem('guest_readings', (guestReadings + 1).toString()); 
      } else { 
          if (!checkTierLimit()) return;
          if (!spendCoins(5)) return; 
          updateUser(prev => ({...prev, readingsToday: prev.readingsToday + 1})); 
      } 
      
      const selected = indices.map(i => { 
          const cardName = TAROT_DECK[i]; 
          return { 
              id: i, 
              name: cardName, 
              isReversed: Math.random() < 0.3, 
              imagePlaceholder: getFallbackTarotImage(i), 
              generatedImage: undefined, // Start with undefined to show loading
              backDesign: 0 
          }; 
      }); 
      
      setSelectedCards(selected); 
      navigateTo(AppState.RESULT); 
      setReadingPromise(getTarotReading(selectedQuestion, selected, user.userInfo, lang, user.history, user.tier)); 

      selected.forEach((card, idx) => {
          generateTarotCardImage(card.name)
            .then(base64 => {
                const imageUrl = `data:image/png;base64,${base64}`;
                setSelectedCards(prev => {
                    const newCards = [...prev];
                    if (newCards[idx] && newCards[idx].name === card.name) {
                        newCards[idx] = { ...newCards[idx], generatedImage: imageUrl };
                    }
                    return newCards;
                });
            })
            .catch(err => {
                console.warn("Gemini Image Gen failed, falling back to Pollinations", err);
                const seed = Math.floor(Math.random() * 1000000);
                const genUrl = `https://image.pollinations.ai/prompt/tarot%20card%20${encodeURIComponent(card.name)}%20mystical%20dark%20fantasy%20style%20deep%20purple%20and%20gold%20smoke%20effect%20detailed%204k%20no%20text?width=300&height=500&nologo=true&seed=${seed}&model=flux-schnell`;
                setSelectedCards(prev => {
                    const newCards = [...prev];
                    if (newCards[idx] && newCards[idx].name === card.name) {
                        newCards[idx] = { ...newCards[idx], generatedImage: genUrl };
                    }
                    return newCards;
                });
            });
      });
  };

  const isFirstPurchase = user.totalSpent === 0 && user.email !== 'Guest';
  const isGuest = user.email === 'Guest';

  const handleSettingsClick = (mode: 'SKIN' | 'FRAME' | 'RUG' | 'BGM' | 'HISTORY' | 'RESULT_BG' | 'STICKER') => {
      if (user.email === 'Guest') {
          alert("로그인이 필요한 기능입니다.");
          setAuthMode('LOGIN');
          return;
      }
      setSettingsMode(mode);
  };

  return (
      <div className={`relative min-h-screen text-white font-sans overflow-hidden select-none ${SKINS.find(s=>s.id===user.currentSkin)?.cssClass}`}>
          <Background />
          <AudioPlayer volume={bgmVolume} userStopped={bgmStopped} currentTrack={currentBgm.url} />
          {appState !== AppState.WELCOME && appState !== AppState.INPUT_INFO && appState !== AppState.CHAT_ROOM && (
              <div className="z-50 pointer-events-auto"><Header user={user} lang={lang} onOpenSettings={() => { setShowSettings(true); setSettingsMode('MAIN'); }} onOpenShop={() => { setShowShop(true); setShopStep('AMOUNT'); }} onLogin={() => setAuthMode("LOGIN")} openProfile={handleOpenProfile} /></div>
          )}
          {showGuestBlock && ( <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-6"><div className="bg-gray-900 border border-purple-500 p-8 rounded text-center max-w-sm w-full shadow-[0_0_50px_rgba(168,85,247,0.5)]"><h2 className="text-2xl font-bold text-white mb-4">STOP</h2><p className="text-gray-300 mb-8 leading-relaxed">{TRANSLATIONS[lang].guest_lock_msg}</p><button onClick={() => { setShowGuestBlock(false); setAuthMode('LOGIN'); }} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all hover:scale-105">{TRANSLATIONS[lang].guest_lock_btn}</button></div></div> )}
          
          {/* TIER CHANGE POPUP */}
          {showTierChangePopup && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in p-6" onClick={() => setShowTierChangePopup(false)}>
                  <div className="relative bg-[#1a103c] border-2 border-yellow-500 rounded-xl p-8 max-w-sm w-full text-center shadow-[0_0_80px_rgba(250,204,21,0.6)] overflow-hidden" onClick={e=>e.stopPropagation()}>
                      {tierChangeDirection === 'UP' && <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent animate-pulse pointer-events-none"></div>}
                      <div className="text-6xl mb-4 animate-bounce">{tierChangeDirection === 'UP' ? '🚀' : '📉'}</div>
                      <h2 className="text-3xl font-occult text-white mb-2 uppercase font-bold tracking-wider">{tierChangeDirection === 'UP' ? TIER_POPUP_TEXT[lang].up_title : TIER_POPUP_TEXT[lang].down_title}</h2>
                      <p className={`text-lg font-bold mb-6 ${tierChangeDirection === 'UP' ? 'text-yellow-400' : 'text-gray-400'}`}>Current Tier: <span className="text-2xl">{tierChangeNewTier}</span></p>
                      {tierChangeDirection === 'UP' ? (
                          <div className="bg-black/40 p-4 rounded-lg border border-white/10 mb-6 text-sm text-gray-300 text-left">
                              <p className="mb-2 font-bold text-white">{TIER_POPUP_TEXT[lang].up_msg}</p>
                              <ul className="list-disc list-inside space-y-1">
                                  {tierChangeNewTier === UserTier.SILVER && <li>{TIER_POPUP_TEXT[lang].benefit_silver}</li>}
                                  {tierChangeNewTier === UserTier.GOLD && <li>{TIER_POPUP_TEXT[lang].benefit_gold}</li>}
                                  {tierChangeNewTier === UserTier.PLATINUM && <li>{TIER_POPUP_TEXT[lang].benefit_platinum}</li>}
                              </ul>
                          </div>
                      ) : (
                          <div className="bg-black/40 p-4 rounded-lg border border-white/10 mb-6 text-sm text-gray-300"><p>{TIER_POPUP_TEXT[lang].down_msg}</p></div>
                      )}
                      <button onClick={() => setShowTierChangePopup(false)} className="w-full py-3 bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-bold rounded hover:brightness-110 transition-all shadow-lg">{TIER_POPUP_TEXT[lang].confirm}</button>
                  </div>
              </div>
          )}

          {showAttendancePopup && ( 
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-lg animate-fade-in p-4">
                <div className="relative bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#2e1065] p-1 rounded-2xl shadow-[0_0_80px_rgba(250,204,21,0.4)] max-w-sm w-full scale-100 animate-[bounce_1s_infinite]">
                    <div className="relative bg-[#1a103c] rounded-xl p-8 text-center border border-yellow-500/50 overflow-hidden">
                        <h2 className="text-3xl font-occult text-shine mb-4 relative z-10 font-bold uppercase tracking-widest">{TRANSLATIONS[lang].attendance_popup}</h2>
                        <div className="text-7xl mb-6 relative z-10 animate-bounce">🎁</div>
                        <p className="text-yellow-200 text-lg mb-2 font-bold relative z-10">Day {user.attendanceDay} Reached!</p>
                        <p className="text-gray-300 mb-8 relative z-10">You received <span className="text-yellow-400 font-bold text-xl">{attendanceReward} Coins</span></p>
                        <button onClick={() => setShowAttendancePopup(false)} className="relative z-10 w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-extrabold rounded-lg shadow-lg">Claim Reward</button>
                    </div>
                </div>
            </div> 
          )}
          
          {showProfile && user.email !== 'Guest' && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
                  <div className="bg-gray-900 border border-purple-500 rounded-lg max-w-md w-full p-6 relative overflow-y-auto max-h-[90vh]">
                      <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
                      <h2 className="text-2xl font-occult text-purple-200 mb-6 text-center">{TRANSLATIONS[lang].profile_edit}</h2>
                      <div className="flex justify-center mb-6"><div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-purple-500 flex items-center justify-center overflow-hidden relative group cursor-pointer">{editProfileData.profileImage ? <img src={editProfileData.profileImage} className="w-full h-full object-cover" /> : <span className="text-4xl">👤</span>}<div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-xs text-white">Change</div><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>{ const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onload=()=>setEditProfileData(prev => ({...prev, profileImage: r.result as string})); r.readAsDataURL(f); } }}/></div></div>
                      <div className="space-y-4">
                          <div><label className="text-xs text-gray-500 block mb-1">Name (Changed: {user.userInfo?.nameChangeCount || 0}/5)</label><input value={editProfileData.name} onChange={(e) => setEditProfileData(prev => ({...prev, name: e.target.value}))} className={`w-full p-2 bg-gray-800 rounded border border-gray-700 text-white ${user.userInfo?.nameChangeCount && user.userInfo.nameChangeCount >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!!(user.userInfo?.nameChangeCount && user.userInfo.nameChangeCount >= 5)} /></div>
                          <div><label className="text-xs text-gray-500 block mb-1">Birthdate (Changeable Once)</label><input value={editProfileData.birthDate} onChange={(e) => setEditProfileData(prev => ({...prev, birthDate: e.target.value}))} placeholder="YYYYMMDD" className={`w-full p-2 bg-gray-800 rounded border border-gray-700 text-white ${user.userInfo?.birthDateChanged ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={user.userInfo?.birthDateChanged} /></div>
                          <div><label className="text-xs text-gray-500 block mb-1">Country (Changeable Once)</label><select value={COUNTRIES.find(c => c.nameEn === editProfileData.country)?.code || ''} onChange={(e) => { const c = COUNTRIES.find(cnt => cnt.code === e.target.value); if(c) setEditProfileData(prev => ({...prev, country: c.nameEn})); }} className={`w-full p-2 bg-gray-800 rounded border border-gray-700 text-white ${user.userInfo?.countryChanged ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={user.userInfo?.countryChanged} >{COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.nameKo}</option>)}</select></div>
                          <div><label className="text-xs text-gray-500 block mb-1">Bio (Public Description)</label><textarea value={editProfileData.bio || ''} onChange={(e) => setEditProfileData(prev => ({...prev, bio: e.target.value}))} className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white h-20 resize-none" placeholder="Introduce yourself..." /></div>
                      </div>
                      <div className="mt-6 flex gap-2"><button onClick={() => setShowProfile(false)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 font-bold">Cancel</button><button onClick={handleSaveProfile} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 rounded text-white font-bold">Save Changes</button></div>
                      <div className="mt-8 pt-6 border-t border-gray-800"><button onClick={handleDeleteAccount} className="w-full py-3 bg-red-900/50 text-red-400 font-bold rounded border border-red-900 hover:bg-red-900 hover:text-white transition-colors">{TRANSLATIONS[lang].delete_account}</button></div>
                  </div>
              </div>
          )}
          {authMode && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-6">
                  <div className="bg-gray-900 border border-purple-500 p-8 rounded text-center max-w-sm w-full shadow-[0_0_50px_rgba(168,85,247,0.5)] relative">
                      <button onClick={() => setAuthMode(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
                      <h2 className="text-2xl font-bold text-white mb-6">Login / Sign Up</h2>
                      {authMode === 'LOGIN' ? (
                          <AuthForm onClose={() => setAuthMode(null)} onLoginSuccess={() => { setAuthMode(null); checkUser(); }} />
                      ) : (
                          <div className="text-white">Sign Up Logic Here</div> 
                      )}
                  </div>
              </div>
          )}
          {appState === AppState.WELCOME && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in relative z-10"><Header user={user} lang={lang} onOpenSettings={() => { setShowSettings(true); setSettingsMode('MAIN'); }} onOpenShop={() => { setShowShop(true); setShopStep('AMOUNT'); }} onLogin={() => setAuthMode("LOGIN")} openProfile={handleOpenProfile} /><Logo size="large" /><p className="font-serif-en text-sm md:text-base italic mb-12 text-gold-gradient font-bold tracking-widest uppercase drop-shadow-sm opacity-90">{TRANSLATIONS[lang].welcome_sub}</p><button onClick={handleStart} className="btn-gold-3d mb-8">{TRANSLATIONS[lang].enter}</button></div> )}
          {appState === AppState.INPUT_INFO && ( <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10 animate-fade-in"><Logo size="small" /><div className="w-full max-w-md bg-black/60 border-wine-gradient p-8 rounded-lg backdrop-blur-sm"><h2 className="text-2xl font-occult text-purple-200 mb-2 text-center">{TRANSLATIONS[lang].info_title}</h2><p className="text-gray-400 text-sm mb-8 text-center">{TRANSLATIONS[lang].info_desc}</p><UserInfoForm onSubmit={handleUserInfoSubmit} lang={lang} /></div></div> )}
          {appState === AppState.CATEGORY_SELECT && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in pt-20 pb-10"><h2 className="text-3xl font-occult text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-800 mb-8 text-center">{TRANSLATIONS[lang].select_cat_title}</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full relative">{(<button onClick={handleEnterChat} className="absolute -right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-purple-900/80 border border-purple-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.6)] hover:bg-purple-800 hover:scale-110 transition-all z-20 group"><span className="text-2xl mb-1 group-hover:animate-bounce">💬</span><span className="text-[8px] text-white font-bold">{isGuest ? 'Free' : TRANSLATIONS[lang].chat_entry_fee}</span></button>)}{CATEGORIES.map((cat) => { return (<button key={cat.id} onClick={() => handleCategorySelect(cat)} className={`relative flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-200 border-wine-gradient backdrop-blur-sm group bg-gradient-to-br from-[#1a103c] to-[#000000] hover:-translate-y-1 hover:shadow-[0_8px_15px_rgba(88,28,135,0.4)]`}><span className="text-4xl mb-2 filter drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] transition-transform duration-300 group-hover:scale-110">{cat.icon}</span><span className="text-gray-200 font-sans font-bold tracking-wide group-hover:text-white transition-colors">{lang === 'en' ? cat.id : cat.label}</span>{!isGuest && cat.cost && <span className="absolute top-2 right-2 text-[10px] text-yellow-500 bg-black/80 px-1 rounded border border-yellow-700">-{cat.cost}</span>}</button>); })}</div></div> )}
          {appState === AppState.CHAT_ROOM && ( <ChatView user={user} lang={lang} onLeave={() => navigateTo(AppState.CATEGORY_SELECT)} /> )}
          {appState === AppState.FACE_UPLOAD && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in"><div className="w-full max-w-md bg-black/60 border border-purple-500/50 p-6 rounded text-center"><h2 className="text-xl font-bold text-white mb-4">{TRANSLATIONS[lang].face_reading_title}</h2><p className="text-gray-300 mb-6 text-sm md:text-base leading-relaxed break-keep">{TRANSLATIONS[lang].face_reading_desc}</p><div className="mb-6 border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-purple-500 transition-colors cursor-pointer relative"><input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend=()=>setFaceImage(r.result as string); r.readAsDataURL(f); } }} className="absolute inset-0 opacity-0 cursor-pointer" />{faceImage ? <img src={faceImage} className="max-h-48 mx-auto rounded" /> : <span className="text-gray-500">{TRANSLATIONS[lang].face_guide}</span>}</div><div className="flex gap-2"><button onClick={() => navigateTo(AppState.CATEGORY_SELECT)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold">{TRANSLATIONS[lang].back}</button><button onClick={startFaceReading} className="flex-[2] py-3 bg-purple-700 hover:bg-purple-600 rounded font-bold">{TRANSLATIONS[lang].face_upload_btn.replace(/\(-?\d+\s*Coin\)/, isGuest ? '' : '(-250 Coin)')}</button></div></div></div> )}
          {appState === AppState.LIFE_INPUT && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in"><div className="w-full max-w-md bg-black/60 border border-purple-500/50 p-6 rounded text-center"><h2 className="text-xl font-bold text-white mb-2">{TRANSLATIONS[lang].life_reading_title}</h2><p className="text-gray-300 text-sm mb-6 leading-relaxed break-keep whitespace-pre-wrap">{TRANSLATIONS[lang].life_reading_desc}</p><div className="flex gap-4 justify-center mb-6"><select value={birthTime.h} onChange={e=>setBirthTime({...birthTime, h:e.target.value})} className="bg-gray-800 text-white p-2 rounded">{Array.from({length:24}).map((_,i) => <option key={i} value={i.toString()}>{i}시</option>)}</select><select value={birthTime.m} onChange={e=>setBirthTime({...birthTime, m:e.target.value})} className="bg-gray-800 text-white p-2 rounded">{Array.from({length:60}).map((_,i) => <option key={i} value={i.toString()}>{i}분</option>)}</select></div><div className="flex gap-2"><button onClick={() => navigateTo(AppState.CATEGORY_SELECT)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold">{TRANSLATIONS[lang].back}</button><button onClick={startLifeReading} className="flex-[2] py-3 bg-purple-700 hover:bg-purple-600 rounded font-bold">{TRANSLATIONS[lang].life_input_btn.replace(/\(-?\d+\s*Coin\)/, isGuest ? '' : '(-250 Coin)')}</button></div></div></div> )}
          {appState === AppState.PARTNER_INPUT && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in"><div className="w-full max-w-md bg-black/60 border border-purple-500/50 p-6 rounded text-center"><h2 className="text-xl font-bold text-white mb-2">{selectedCategory?.label}</h2><p className="text-gray-400 mb-6">{selectedCategory?.id === 'SECRET_COMPAT' ? TRANSLATIONS[lang].secret_compat_desc : TRANSLATIONS[lang].partner_life_desc}</p><input value={partnerBirth} onChange={e=>setPartnerBirth(e.target.value)} placeholder={TRANSLATIONS[lang].partner_birth_ph} className="w-full p-3 bg-gray-800 rounded text-white border border-gray-700 focus:border-purple-500 mb-6 outline-none"/><div className="flex gap-2"><button onClick={() => navigateTo(AppState.CATEGORY_SELECT)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold">{TRANSLATIONS[lang].back}</button><button onClick={startPartnerReading} className="flex-[2] py-3 bg-purple-700 hover:bg-purple-600 rounded font-bold">{(selectedCategory?.id === 'SECRET_COMPAT' ? TRANSLATIONS[lang].secret_compat_btn : TRANSLATIONS[lang].partner_life_btn).replace(/\(-?\d+\s*Coin\)/, isGuest ? '' : selectedCategory?.id === 'SECRET_COMPAT' ? '(-200 Coin)' : '(-250 Coin)')}</button></div></div></div> )}
          {appState === AppState.QUESTION_SELECT && selectedCategory && ( <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10 animate-fade-in pt-20"><h2 className="text-2xl font-occult text-purple-200 mb-6 text-center">{selectedCategory.label}</h2><div className="w-full max-w-xl space-y-3">{selectedCategory.questions.map((q, i) => (<button key={i} onClick={() => handleQuestionSelect(q)} className="w-full p-4 text-left bg-black/60 border border-purple-900/50 rounded hover:bg-purple-900/30 hover:border-purple-500 transition-all text-gray-200 text-sm md:text-base">{q}</button>))}<div className="relative mt-6 pt-4 border-t border-gray-800"><input className="w-full p-4 bg-gray-900 border border-gray-700 rounded text-white focus:border-purple-500 focus:outline-none" placeholder={TRANSLATIONS[lang].custom_q_ph} value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} /><button onClick={() => handleQuestionSelect(customQuestion)} className="absolute right-2 top-6 bottom-2 px-4 bg-purple-900 rounded text-xs font-bold hover:bg-purple-700 mt-4 mb-2">OK</button></div><button onClick={() => navigateTo(AppState.CATEGORY_SELECT)} className="w-full mt-6 py-3 bg-gray-800 text-gray-400 hover:text-white rounded border border-gray-700">{TRANSLATIONS[lang].back}</button></div></div> )}
          {appState === AppState.SHUFFLING && ( <ShufflingAnimation onComplete={() => navigateTo(AppState.CARD_SELECT)} lang={lang} skin={user.currentSkin} activeCustomSkin={user.activeCustomSkin} rugColor={user.rugColor} /> )}
          {appState === AppState.CARD_SELECT && ( <CardSelection onSelectCards={handleCardSelect} lang={lang} skin={user.currentSkin} activeCustomSkin={user.activeCustomSkin} rugColor={user.rugColor} /> )}
          {appState === AppState.RESULT && ( <ResultView question={selectedQuestion} selectedCards={selectedCards} onRetry={() => navigateTo(AppState.CATEGORY_SELECT)} lang={lang} readingPromise={readingPromise} onReadingComplete={handleReadingComplete} user={user} spendCoins={spendCoins} onLogin={() => setAuthMode("LOGIN")} /> )}
          
          {showShop && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
                 {/* Main Modal Container - Deep Purple Gradient with Golden Border Feeling */}
                 <div className="w-full max-w-lg bg-[#0d001a] border border-[#d4af37] rounded-2xl shadow-[0_0_60px_rgba(139,92,246,0.2)] relative overflow-hidden flex flex-col animate-fade-in">
                     
                     {/* Close Button */}
                     <button onClick={() => { setShowShop(false); setShopStep('AMOUNT'); }} className="absolute top-4 right-4 text-[#d4af37] hover:text-white z-20">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                         </svg>
                     </button>

                     {shopStep === 'AMOUNT' ? (
                        <>
                            {/* Header */}
                            <div className="p-8 pb-4 relative z-10 text-center">
                                <h2 className="text-3xl font-occult text-yellow-500 mb-2">{TRANSLATIONS[lang].shop_title}</h2>
                                <p className="text-gray-400 text-sm">{TRANSLATIONS[lang].shop_subtitle}</p>
                                {isFirstPurchase && <p className="text-green-400 font-bold text-xs mt-2 animate-pulse">First Purchase 50% OFF!</p>}
                            </div>

                            {/* Packages */}
                            <div className="p-8 pt-0 space-y-4 relative z-10">
                                <button onClick={() => initiatePayment(isFirstPurchase ? 2450 : 4900, 60)} className="w-full bg-gradient-to-r from-gray-900 to-black border border-gray-700 hover:border-yellow-500 p-4 rounded-xl flex items-center justify-between group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-yellow-900/20 flex items-center justify-center text-xs font-bold text-yellow-500">C</div>
                                        <div className="text-left">
                                            <div className="text-yellow-100 font-bold group-hover:text-yellow-400">60 Coins</div>
                                            <div className="text-gray-500 text-xs">Basic Reading</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        {isFirstPurchase && <span className="text-xs text-gray-500 line-through">₩4,900</span>}
                                        <span className="text-white font-bold">₩{(isFirstPurchase ? 2450 : 4900).toLocaleString()}</span>
                                    </div>
                                </button>
                                <button onClick={() => initiatePayment(isFirstPurchase ? 3950 : 7900, 110)} className="w-full bg-gradient-to-r from-gray-900 to-black border border-gray-700 hover:border-yellow-500 p-4 rounded-xl flex items-center justify-between group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-yellow-900/20 flex items-center justify-center text-xs font-bold text-yellow-500">C</div>
                                        <div className="text-left">
                                            <div className="text-yellow-100 font-bold group-hover:text-yellow-400">110 Coins</div>
                                            <div className="text-gray-500 text-xs">Popular Choice</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        {isFirstPurchase && <span className="text-xs text-gray-500 line-through">₩7,900</span>}
                                        <span className="text-white font-bold">₩{(isFirstPurchase ? 3950 : 7900).toLocaleString()}</span>
                                    </div>
                                </button>
                                <button onClick={() => initiatePayment(isFirstPurchase ? 7750 : 15500, 220)} className="w-full bg-gradient-to-r from-gray-900 to-black border border-yellow-700/50 hover:border-yellow-400 p-4 rounded-xl flex items-center justify-between group transition-all relative overflow-hidden">
                                    <div className="absolute inset-0 bg-yellow-900/10 group-hover:bg-yellow-900/20 transition-colors"></div>
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-xs text-black font-bold">VIP</div>
                                        <div className="text-left">
                                            <div className="text-yellow-400 font-bold group-hover:text-yellow-200">220 Coins</div>
                                            <div className="text-yellow-700 text-xs">Best Value</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end relative z-10">
                                        {isFirstPurchase && <span className="text-xs text-yellow-700 line-through">₩15,500</span>}
                                        <span className="text-yellow-400 font-bold">₩{(isFirstPurchase ? 7750 : 15500).toLocaleString()}</span>
                                    </div>
                                </button>
                            </div>
                        </>
                     ) : (
                        <div className="p-8 relative z-10 text-center animate-fade-in">
                            <h2 className="text-2xl font-bold text-white mb-6">{TRANSLATIONS[lang].pay_title}</h2>
                            <div className="mb-4">
                                <p className="text-yellow-400 text-xl font-bold">{pendingPackage?.coins} Coins</p>
                                <p className="text-white text-lg">₩{pendingPackage?.amount.toLocaleString()}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {['TOSS', 'PAYPAL', 'APPLE', 'KAKAO'].map(m => (
                                    <button 
                                        key={m} 
                                        onClick={() => setSelectedPaymentMethod(m as any)}
                                        className={`p-4 rounded-xl border ${selectedPaymentMethod === m ? 'border-yellow-500 bg-yellow-900/20 text-white' : 'border-gray-700 bg-black/50 text-gray-400 hover:border-gray-500'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShopStep('AMOUNT')} className="flex-1 py-3 bg-gray-800 rounded text-gray-300 font-bold">{TRANSLATIONS[lang].pay_cancel}</button>
                                <button onClick={processPayment} className="flex-[2] py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:brightness-110">{TRANSLATIONS[lang].pay_confirm}</button>
                            </div>
                        </div>
                     )}
                     
                     {/* Background Glow */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-900/20 blur-[100px] pointer-events-none"></div>
                 </div>
             </div>
          )}
          
          {showSettings && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
                 {/* Stylish Purple Settings Container */}
                 <div className="w-full max-w-md bg-[#0f0518]/95 border border-purple-500/40 rounded-2xl p-6 relative shadow-[0_0_60px_rgba(168,85,247,0.25)] backdrop-blur-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                     <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-purple-300/50 hover:text-white transition-colors">✕</button>
                     <h2 className="text-2xl font-occult text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-100 to-purple-400 mb-8 text-center border-b border-purple-500/20 pb-4 tracking-widest">{TRANSLATIONS[lang].settings_title}</h2>
                     
                     {settingsMode === 'MAIN' && (
                         <div className="space-y-6">
                             <div>
                                 <label className="block text-sm text-purple-200 mb-2 font-serif">{TRANSLATIONS[lang].language_control}</label>
                                 <div className="flex bg-[#1a0b2e] rounded-xl border border-purple-500/30 p-1">
                                     <button onClick={() => setLang('ko')} className={`flex-1 py-2 rounded-lg text-sm transition-all font-serif ${lang === 'ko' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-gray-400 hover:text-white'}`}>한국어</button>
                                     <button onClick={() => setLang('en')} className={`flex-1 py-2 rounded-lg text-sm transition-all font-serif ${lang === 'en' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-gray-400 hover:text-white'}`}>English</button>
                                 </div>
                             </div>
                             
                             {/* Attendance Progress Section - Visible Only to Logged In Users */}
                             {user.email !== 'Guest' && (
                                <div className="bg-[#1a0b2e] rounded-xl border border-purple-500/30 p-4 mt-2">
                                    <h4 className="text-sm font-bold text-purple-200 mb-2 font-serif">{TRANSLATIONS[lang].attendance}</h4>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Day {user.attendanceDay}</span>
                                        <span>Goal: 10</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
                                        <div className="bg-gradient-to-r from-yellow-600 to-yellow-300 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(Math.min(user.attendanceDay, 10) / 10) * 100}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 text-center italic">Log in daily for bonus coins!</p>
                                </div>
                             )}

                             <div>
                                 <label className="block text-sm text-purple-200 mb-2 font-serif">{TRANSLATIONS[lang].bgm_control}</label>
                                 <input type="range" min="0" max="1" step="0.01" value={bgmVolume} onChange={e => setBgmVolume(parseFloat(e.target.value))} className="w-full accent-purple-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                                 <div className="flex justify-between mt-2">
                                     <button onClick={() => setBgmStopped(!bgmStopped)} className="text-xs text-purple-300 border border-purple-500/30 px-3 py-1 rounded-lg hover:bg-purple-500/20 transition-all">{bgmStopped ? 'PLAY' : 'STOP'}</button>
                                     <span className="text-xs text-gray-500">{currentBgm.name}</span>
                                 </div>
                             </div>
                             
                             <div className="border-t border-purple-500/20 pt-6 space-y-3">
                                 <button onClick={() => handleSettingsClick('SKIN')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm">
                                     <span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].skin_shop}</span>
                                 </button>
                                 <button onClick={() => handleSettingsClick('FRAME')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm">
                                     <span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].frame_shop}</span>
                                 </button>
                                 <button onClick={() => handleSettingsClick('RESULT_BG')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm">
                                     <span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].result_bg_shop}</span>
                                 </button>
                                 <button onClick={() => handleSettingsClick('STICKER')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm">
                                     <span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].sticker_shop}</span>
                                 </button>
                                 <button onClick={() => handleSettingsClick('RUG')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm">
                                     <span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].rug_shop}</span>
                                 </button>
                                 <button onClick={() => handleSettingsClick('BGM')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm">
                                     <span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].bgm_upload}</span>
                                 </button>
                                 <button onClick={() => handleSettingsClick('HISTORY')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm">
                                     <span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].history}</span>
                                 </button>
                             </div>
                             
                             {user.email !== 'Guest' && (
                                <div className="pt-6 border-t border-purple-500/20 text-center">
                                    <button onClick={handleLogout} className="text-xs text-red-400/70 hover:text-red-400 font-serif tracking-widest transition-colors">{TRANSLATIONS[lang].logout}</button>
                                </div>
                             )}
                         </div>
                     )}

                     {settingsMode === 'FRAME' && (
                         <div className="space-y-4">
                             <button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button>
                             <h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Select Result Frame</h3>
                             <div className="grid grid-cols-2 gap-4">
                                 {RESULT_FRAMES.map(frame => (
                                     <div key={frame.id} onClick={() => { if(checkGuestAction()) return; updateUser(prev => ({...prev, resultFrame: frame.id})); }} className={`aspect-[3/4] border relative cursor-pointer bg-[#050505] flex items-center justify-center rounded-lg transition-all ${user.resultFrame === frame.id ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'border-gray-800 hover:border-purple-500/50'}`}>
                                         <div className="absolute inset-2 z-10 bg-gray-800/50 flex items-center justify-center text-[8px] text-gray-400 rounded">Preview</div>
                                         <div className="absolute inset-0 z-20 pointer-events-none rounded-lg" style={{ cssText: frame.css } as any}></div>
                                         <span className="absolute bottom-[-20px] text-[10px] text-gray-400 w-full text-center">{frame.name}</span>
                                     </div>
                                 ))}
                             </div>

                             <div className="mt-8 pt-4 border-t border-purple-500/20">
                                 <h3 className="text-sm font-bold text-purple-200 mb-4">{TRANSLATIONS[lang].custom_frame_title}</h3>
                                 <div className="border border-dashed border-purple-500/30 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all relative">
                                     <input type="file" accept="image/*" onChange={handleCustomFrameUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                     {customFrameImage ? <img src={customFrameImage} className="h-20 mx-auto object-contain rounded" /> : <span className="text-xs text-gray-400">Upload Frame Image</span>}
                                 </div>
                                 {customFrameImage && <button onClick={handleSaveCustomFrame} className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition-colors font-bold shadow-lg">Save Frame</button>}
                                 
                                 {user.customFrames && user.customFrames.length > 0 && (
                                     <div className="grid grid-cols-3 gap-2 mt-4">
                                         {user.customFrames.map(cf => (
                                             <div key={cf.id} onClick={() => { if(checkGuestAction()) return; updateUser(prev => ({...prev, resultFrame: cf.id})); }} className={`aspect-[3/4] border cursor-pointer bg-black relative rounded-lg ${user.resultFrame === cf.id ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-gray-800'}`}>
                                                 <div className="absolute inset-0 rounded-lg" style={{ border: '10px solid transparent', borderImage: `url(${cf.imageUrl}) 20 round` }}></div>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                         </div>
                     )}

                     {settingsMode === 'RESULT_BG' && (
                         <div className="space-y-4">
                             <button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button>
                             <h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Select Result Background</h3>
                             <div className="grid grid-cols-2 gap-4">
                                 {RESULT_BACKGROUNDS.map(bg => (
                                     <div key={bg.id} onClick={() => updateUser(prev => ({...prev, resultBackground: bg.id}))} className={`aspect-square border cursor-pointer rounded-lg transition-all relative overflow-hidden ${user.resultBackground === bg.id ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-gray-800'}`}>
                                         <div className="absolute inset-0" style={{ background: bg.css }}></div>
                                         <span className="absolute bottom-1 w-full text-center text-[10px] text-white/70 bg-black/30 backdrop-blur-sm">{bg.name}</span>
                                     </div>
                                 ))}
                             </div>
                             
                             <div className="mt-4 pt-4 border-t border-purple-500/20">
                                 <h3 className="text-sm font-bold text-purple-200 mb-4">Custom Background</h3>
                                 <div className="border border-dashed border-purple-500/30 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all relative">
                                     <input type="file" accept="image/*" onChange={handleCustomBgUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                     {customBgImage ? <img src={customBgImage} className="h-20 mx-auto object-cover rounded" /> : <span className="text-xs text-gray-400">Upload Background</span>}
                                 </div>
                                 {customBgImage && <button onClick={handleSaveCustomBg} className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-bold shadow-lg">Set Background</button>}

                                 {/* Render User Uploaded Backgrounds */}
                                 {user.customBackgrounds && user.customBackgrounds.length > 0 && (
                                     <div className="grid grid-cols-3 gap-2 mt-4">
                                         {user.customBackgrounds.map(bg => (
                                             <div key={bg.id} onClick={() => updateUser(prev => ({...prev, resultBackground: bg.imageUrl}))} className={`aspect-square border cursor-pointer relative rounded-lg overflow-hidden ${user.resultBackground === bg.imageUrl ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-gray-800'}`}>
                                                 <div className="absolute inset-0" style={{ backgroundImage: `url(${bg.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                         </div>
                     )}

                     {settingsMode === 'STICKER' && (
                         <div className="space-y-4">
                             <button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button>
                             <h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Manage Stickers</h3>
                             <div className="flex flex-wrap gap-2 mb-4 bg-black/40 p-2 rounded-lg">
                                {user.customStickers?.map((s, i) => (
                                    <div key={i} className="w-10 h-10 border border-gray-700 rounded bg-black/60 p-1 relative group">
                                        <img src={s} className="w-full h-full object-contain" />
                                        <button onClick={() => updateUser(prev => ({...prev, customStickers: prev.customStickers?.filter((_, idx) => idx !== i)}))} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100">✕</button>
                                    </div>
                                ))}
                                {(!user.customStickers || user.customStickers.length === 0) && <span className="text-xs text-gray-500 w-full text-center py-2">No custom stickers yet.</span>}
                             </div>
                             
                             <div className="border border-dashed border-purple-500/30 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all relative">
                                 <input type="file" accept="image/*" onChange={handleCustomStickerUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                 {customStickerImage ? <img src={customStickerImage} className="h-20 mx-auto object-contain" /> : <span className="text-xs text-gray-400">{TRANSLATIONS[lang].sticker_upload}</span>}
                             </div>
                             {customStickerImage && <button onClick={handleSaveCustomSticker} className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-bold shadow-lg">Add Sticker</button>}
                         </div>
                     )}

                     {settingsMode === 'SKIN' && (
                         <div className="space-y-4">
                             <button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button>
                             <h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Select Card Skin</h3>
                             <div className="grid grid-cols-2 gap-4">
                                 {SKINS.map(skin => (
                                     <div key={skin.id} onClick={() => buySkin(skin)} className={`border rounded-lg p-2 cursor-pointer transition-all ${user.currentSkin === skin.id && !user.activeCustomSkin ? 'border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-gray-800 hover:border-purple-500/50'} ${user.tier === UserTier.BRONZE && skin.cost > 0 && !isGuest ? 'opacity-50 grayscale' : ''}`}>
                                         <div className={`h-24 rounded-md mb-2 w-full card-back ${skin.cssClass}`}></div>
                                         <div className="flex justify-between items-center">
                                             <span className="text-xs text-gray-300 font-serif">{skin.name}</span>
                                             {user.ownedSkins.includes(skin.id) ? <span className="text-[10px] bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded border border-green-800">OWNED</span> : <span className={`text-[10px] ${isGuest ? 'text-green-400' : 'text-purple-300'}`}>{isGuest ? 'Free' : skin.cost + ' C'}</span>}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                             
                             <div className="mt-8 pt-4 border-t border-purple-500/20">
                                 <h3 className="text-sm font-bold text-purple-200 mb-4">{TRANSLATIONS[lang].custom_skin_title}</h3>
                                 
                                 <div className="space-y-4">
                                     <div className="border border-dashed border-purple-500/30 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all relative">
                                         <input type="file" accept="image/*" onChange={handleCustomSkinUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                         {customSkinImage ? <img src={customSkinImage} className="h-32 mx-auto object-contain rounded" /> : <span className="text-xs text-gray-400">{TRANSLATIONS[lang].upload_skin}</span>}
                                     </div>
                                     
                                     {customSkinImage && (
                                         <div className="flex flex-col gap-2">
                                             <div className="flex gap-2 text-xs">
                                                 <button onClick={() => setIsSkinPublic(false)} className={`flex-1 py-2 rounded-lg border transition-all ${!isSkinPublic ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>{TRANSLATIONS[lang].private_option}</button>
                                                 <button onClick={() => setIsSkinPublic(true)} className={`flex-1 py-2 rounded-lg border transition-all ${isSkinPublic ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>{TRANSLATIONS[lang].public_option}</button>
                                             </div>
                                             <button onClick={handleSaveCustomSkin} className="w-full py-2.5 bg-white text-black font-bold rounded-lg text-xs hover:bg-gray-200 shadow-lg">Save Custom Skin (-120 Coin)</button>
                                         </div>
                                     )}

                                     <div className="mt-4 pt-4 border-t border-purple-500/20">
                                         <label className="text-xs text-gray-400 block mb-2">{TRANSLATIONS[lang].skin_code_label}</label>
                                         <div className="flex gap-2">
                                             <input value={inputSkinCode} onChange={e=>setInputSkinCode(e.target.value)} placeholder={TRANSLATIONS[lang].skin_code_placeholder} className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none" />
                                             <button onClick={handleApplySkinCode} className="px-4 py-2 bg-purple-900/50 border border-purple-500/50 text-purple-200 text-xs rounded-lg hover:bg-purple-800 transition-colors font-bold">{TRANSLATIONS[lang].skin_code_btn}</button>
                                         </div>
                                     </div>

                                     {user.customSkins && user.customSkins.length > 0 && (
                                         <div className="grid grid-cols-3 gap-2 mt-4">
                                             {user.customSkins.map(cs => (
                                                 <div key={cs.id} onClick={() => { if(checkGuestAction()) return; updateUser(prev => ({...prev, activeCustomSkin: cs})); }} className={`aspect-[2/3] rounded-lg border cursor-pointer bg-cover bg-center transition-all ${user.activeCustomSkin?.id === cs.id ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'border-gray-800 hover:border-purple-500/50'}`} style={{ backgroundImage: `url(${cs.imageUrl})` }}></div>
                                             ))}
                                             <div onClick={() => { if(checkGuestAction()) return; updateUser(prev => ({...prev, activeCustomSkin: null})); }} className="aspect-[2/3] rounded-lg border border-red-900/50 flex items-center justify-center text-red-400 text-xs cursor-pointer hover:bg-red-900/20 hover:border-red-500 transition-all font-bold">Reset</div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         </div>
                     )}

                     {settingsMode === 'RUG' && (
                         <div className="space-y-4">
                             <button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button>
                             <h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Select Rug Color</h3>
                             <div className="grid grid-cols-3 gap-4">
                                 {RK_COLORS.map(c => (
                                     <div key={c.name} onClick={() => handleRugChange(c.color)} className={`aspect-square rounded-full cursor-pointer border-2 transition-transform ${user.rugColor === c.color ? 'border-white shadow-[0_0_15px_white] scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c.color }}></div>
                                 ))}
                             </div>
                             <div className="flex items-center gap-4 mt-4 p-4 bg-white/5 rounded-xl">
                                 <span className="text-sm text-gray-300">Custom Color:</span>
                                 <input type="color" value={user.rugColor || '#2e0b49'} onChange={(e) => handleRugChange(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent" />
                             </div>
                         </div>
                     )}

                     {settingsMode === 'BGM' && (
                         <div className="space-y-4">
                             <button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button>
                             <h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Upload Custom BGM</h3>
                             <div className="border border-dashed border-purple-500/30 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all relative">
                                <input type="file" accept="audio/*" onChange={handleBgmUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <span className="text-2xl mb-2 block">🎵</span>
                                <span className="text-xs text-gray-400">Click to upload MP3/WAV</span>
                             </div>
                             <p className="text-[10px] text-gray-500 mt-2 text-center">Supported: MP3, WAV. Stored locally.</p>
                         </div>
                     )}


                     {settingsMode === 'HISTORY' && (
                         <div className="space-y-4">
                             <button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button>
                             <h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">{TRANSLATIONS[lang].history}</h3>
                             {user.history.length === 0 ? <p className="text-gray-500 text-xs text-center py-8">{TRANSLATIONS[lang].no_history}</p> : (
                                 <div className="space-y-3">
                                     {user.history.map((h, i) => (
                                         <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                                             <div className="flex justify-between text-[10px] text-purple-300 mb-2">
                                                 <span>{new Date(h.date).toLocaleDateString()}</span>
                                                 <span className="font-bold bg-purple-900/50 px-2 py-0.5 rounded">{h.type || 'TAROT'}</span>
                                             </div>
                                             <p className="text-xs text-gray-200 font-bold truncate mb-1">{h.question}</p>
                                             <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{h.interpretation}</p>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
             </div>
          )}
      </div>
  );
};

export default App;