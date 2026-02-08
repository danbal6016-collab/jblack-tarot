
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from "./src/lib/supabase";
import { GoogleContinueButton } from "./components/AuthModal";
import { AppState, CategoryKey, TarotCard, QuestionCategory, User, UserInfo, Language, ReadingResult, UserTier, Country, BGM, Skin, ChatMessage, CustomSkin, CustomFrame } from './types';
import { CATEGORIES, TAROT_DECK, COUNTRIES, BGMS, SKINS, TIER_THRESHOLDS, ATTENDANCE_REWARDS, RESULT_FRAMES, RESULT_BACKGROUNDS, DEFAULT_STICKERS, TIER_POPUP_TEXT, RK_COLORS } from './constants';
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
    delete_confirm: "정말로 탈퇴하시겠습니까? 모든 데이터(코인, 등급, 기록)가 영구적으로 삭제됩니다.",
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
    delete_confirm: "Are you sure? All data (Coins, Tier, History) will be permanently deleted.",
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
    const [viewingUser, setViewingUser] = useState<ChatMessage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const getChatUserId = () => {
        let id = sessionStorage.getItem('chat_uid');
        if (!id) {
            id = crypto.randomUUID();
            sessionStorage.setItem('chat_uid', id);
        }
        return id;
    };

    const chatUserId = getChatUserId();

    const handleSendMessage = async () => {
        const text = inputText.trim();
        if (!text) return;

        const channel = channelRef.current;
        if (!channel) return;

        const payload: ChatMessage = {
            id: crypto.randomUUID(),
            userId: chatUserId,
            nickname: (user.userInfo?.name || "Anonymous").slice(0, 20),
            text: text.slice(0, 300),
            timestamp: Date.now(),
            tier: user.tier || UserTier.BRONZE,
            avatarUrl: user.userInfo?.profileImage || "",
            bio: user.userInfo?.bio ? user.userInfo.bio.slice(0, 200) : undefined,
        };

        // Send broadcast message (Ephemeral)
        await channel.send({ 
            type: "broadcast", 
            event: "chat", 
            payload 
        });
        
        // Optimistically update UI for sender
        setMessages(prev => [...prev, payload]);
        setInputText("");
    };

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setMessages([{
                id: 'system',
                userId: 'system',
                nickname: 'System',
                text: 'Chat is unavailable in demo mode (Backend not configured).',
                timestamp: Date.now(),
                tier: UserTier.PLATINUM,
                avatarUrl: ''
            }]);
            return;
        }

        // Use a consistent channel name for everyone
        const channel = supabase.channel('black-tarot-global');

        channel
            .on('broadcast', { event: 'chat' }, ({ payload }) => {
                // Ensure payload is safe
                if (!payload) return;
                
                // Don't duplicate self-sent messages (if optimistic update is used)
                if (payload.userId === chatUserId) return;

                const safePayload: ChatMessage = {
                    ...payload,
                    id: String(payload?.id ?? crypto.randomUUID()),
                    userId: String(payload?.userId ?? 'unknown'),
                    nickname: String(payload?.nickname ?? 'Anonymous').slice(0, 20),
                    text: String(payload?.text ?? '').slice(0, 300),
                    timestamp: Number(payload?.timestamp ?? Date.now()),
                    tier: (payload?.tier && Object.values(UserTier).includes(payload.tier))
                        ? payload.tier
                        : UserTier.BRONZE,
                    avatarUrl: String(payload?.avatarUrl ?? ''),
                    bio: typeof payload?.bio === 'string' ? payload.bio.slice(0, 200) : undefined,
                };

                setMessages(prev => [...prev, safePayload].slice(-50)); // Keep last 50
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                setPresenceCount(Object.keys(state).length);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track presence
                    await channel.track({
                        user_id: chatUserId,
                        user: user.userInfo?.name || 'Anonymous',
                        online_at: new Date().toISOString(),
                    });
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatUserId, user.userInfo?.name]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col h-[100dvh]">
            <div className="flex-none h-16 bg-gradient-to-b from-purple-900/80 to-transparent flex items-center justify-between px-4 z-20 border-b border-purple-500/30">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 scrollbar-thin scrollbar-thumb-purple-700 bg-black/50">
                {messages.map((msg, i) => {
                    const isMe = msg.userId === chatUserId;
                    return (
                        <div key={i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isMe && (
                                <div className="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform" onClick={() => setViewingUser(msg)}>
                                    <div className={`w-8 h-8 rounded-full overflow-hidden border ${msg.tier === UserTier.PLATINUM ? 'border-purple-400' : msg.tier === UserTier.GOLD ? 'border-yellow-400' : 'border-gray-500'}`}>
                                        {msg.avatarUrl ? <img src={msg.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs bg-gray-700">?</div>}
                                    </div>
                                </div>
                            )}
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                {!isMe && <span className="text-[10px] text-gray-400 mb-1 ml-1">{msg.nickname}</span>}
                                <div className={`px-4 py-2 rounded-2xl text-sm break-words shadow-lg ${isMe ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'}`}>
                                    {msg.text && <p>{msg.text}</p>}
                                </div>
                                <span className="text-[9px] text-gray-600 mt-1 mx-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex-none bg-gray-900 border-t border-purple-900/50 p-4 pb-safe flex gap-2 items-center z-20">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === 'Enter') handleSendMessage(); }} placeholder={TRANSLATIONS[lang].chat_input_ph} className="flex-1 bg-black/50 border border-gray-700 rounded-full px-4 py-2 text-white focus:border-purple-500 outline-none text-sm" />
                <button onClick={handleSendMessage} className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-[0_0_10px_rgba(147,51,234,0.5)]">➤</button>
            </div>
            {viewingUser && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in" onClick={() => setViewingUser(null)}>
                    <div className="bg-[#1a103c] border-2 border-purple-500 p-6 rounded-xl max-w-xs w-full text-center relative shadow-[0_0_50px_rgba(147,51,234,0.5)] transform transition-transform scale-100" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setViewingUser(null)}>✕</button>
                        <div className="w-24 h-24 rounded-full border-2 border-yellow-500 mx-auto mb-4 overflow-hidden shadow-lg bg-gray-800">
                             {viewingUser.avatarUrl ? <img src={viewingUser.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{viewingUser.nickname}</h3>
                        <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold mb-4 uppercase tracking-widest ${viewingUser.tier === UserTier.PLATINUM ? 'bg-purple-900 text-purple-200 border border-purple-500' : viewingUser.tier === UserTier.GOLD ? 'bg-yellow-900 text-yellow-200 border border-yellow-500' : 'bg-gray-800 text-gray-300 border border-gray-600'}`}>{viewingUser.tier}</span>
                        <div className="bg-black/40 p-4 rounded border border-purple-900/50 min-h-[80px] max-h-[150px] overflow-y-auto"><p className="text-sm text-gray-300 italic whitespace-pre-wrap leading-relaxed">"{viewingUser.bio || 'No bio available.'}"</p></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AuthForm: React.FC<{ onClose: () => void; onLoginSuccess: () => void; onSwitchToSignup: () => void }> = ({ onClose, onLoginSuccess, onSwitchToSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Additional state for password reset logic from LoginForm.tsx
    const [showResetLink, setShowResetLink] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        if (!email || !password) return alert("Please fill in all fields.");
        setLoading(true);
        setErrorMessage('');
        
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        
        if (error) { 
            console.error("Login Error:", error.message);
            setErrorMessage("아이디 또는 비밀번호가 잘못되었습니다.");
            setShowResetLink(true); // Show reset link on error
        } else { 
            onLoginSuccess(); 
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
          alert("이메일을 입력해주세요.");
          return;
        }
    
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
          });
    
          if (error) throw error;
    
          alert(`${email}로 비밀번호 재설정 링크를 보냈습니다! 메일함을 확인해주세요.`);
          setShowResetLink(false);
        } catch (error: any) {
          console.error(error);
          alert("메일 전송 실패: 잠시 후 다시 시도해주세요.");
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full text-left">
            <div><label className="text-xs text-gray-400 mb-1 block">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white focus:border-purple-500 outline-none" placeholder="Enter your email" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white focus:border-purple-500 outline-none" placeholder="Enter password" onKeyDown={(e) => e.key === 'Enter' && handleLogin()}/></div>
            <button onClick={handleLogin} disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all">{loading ? 'Logging in...' : 'Log In'}</button>
            
            {/* Error Message */}
            {errorMessage && <p className="text-red-400 text-xs text-center">{errorMessage}</p>}

            {/* Forgot Password Link - Only shown on error */}
            {showResetLink && (
                <div className="mt-2 p-3 bg-gray-800/50 rounded border border-gray-700 text-center">
                  <p className="text-xs text-gray-400 mb-2">비밀번호를 잊어버리셨습니까?</p>
                  <button 
                    type="button" 
                    onClick={handlePasswordReset}
                    className="text-xs text-blue-400 underline hover:text-blue-300"
                  >
                    비밀번호 재설정 메일 보내기
                  </button>
                </div>
            )}

            <div className="flex justify-center text-xs text-gray-400"><button onClick={onSwitchToSignup} className="hover:text-white underline">Need an account? Sign Up</button></div>
            <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-700"></div><span className="flex-shrink-0 mx-4 text-gray-500 text-xs">OR</span><div className="flex-grow border-t border-gray-700"></div></div>
            <GoogleContinueButton />
        </div>
    );
};

const SignUpForm: React.FC<{ onClose: () => void; onSwitchToLogin: () => void }> = ({ onClose, onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSignUp = async () => {
        if (!email || !password) return alert("Please fill in all fields.");
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        setLoading(false);
        if (error) { alert(error.message); } else { alert("Sign up successful! Please check your email for confirmation."); onSwitchToLogin(); }
    };
    return (
        <div className="flex flex-col gap-4 w-full text-left">
            <div><label className="text-xs text-gray-400 mb-1 block">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white focus:border-purple-500 outline-none" placeholder="Enter your email" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white focus:border-purple-500 outline-none" placeholder="Create password" onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}/></div>
            <button onClick={handleSignUp} disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all">{loading ? 'Signing Up...' : 'Sign Up'}</button>
            <div className="flex justify-center text-xs text-gray-400"><button onClick={onSwitchToLogin} className="hover:text-white underline">Already have an account? Log In</button></div>
            <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-700"></div><span className="flex-shrink-0 mx-4 text-gray-500 text-xs">OR</span><div className="flex-grow border-t border-gray-700"></div></div>
            <GoogleContinueButton />
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
  <div className="fixed top-0 left-0 right-0 z-[60] flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/95 to-transparent pointer-events-none transition-all">
    <div className="flex items-center gap-2 pointer-events-auto">
      {user.email !== 'Guest' && (
          <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-full border border-yellow-600/30 backdrop-blur-md shadow-lg animate-fade-in cursor-pointer hover:bg-black/80" onClick={openProfile}>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${user.tier === UserTier.PLATINUM ? 'bg-purple-500 text-white' : user.tier === UserTier.GOLD ? 'bg-yellow-500 text-black' : user.tier === UserTier.SILVER ? 'bg-gray-400 text-black' : 'bg-stone-700 text-gray-300'}`}>{user.tier}</span>
              <div className="flex items-center gap-2"><GoldCoinIcon /><span className="text-yellow-100 font-mono font-bold text-lg">{user.coins.toLocaleString()}</span></div>
              <button onClick={(e) => { e.stopPropagation(); onOpenShop(); }} className="w-6 h-6 flex items-center justify-center bg-yellow-700 hover:bg-yellow-500 rounded-full text-white text-xs font-extrabold border border-yellow-300 shadow-[0_0_8px_gold] transition-all hover:scale-110 active:scale-95">+</button>
              <span className="text-gray-400 text-xs md:text-sm font-sans border-l border-gray-600 pl-3 ml-1 hidden sm:inline">{user.userInfo?.name || user.email}</span>
          </div>
      )}
    </div>
    <div className="flex items-center gap-4 pointer-events-auto">
      {user.email === 'Guest' && (<button onClick={onLogin} className="text-xs bg-purple-900 border border-purple-500 px-3 py-1 rounded text-white animate-pulse">Login / Join</button>)}
      {user.email !== 'Guest' && (<button onClick={openProfile} className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 overflow-hidden hover:border-purple-500 transition-all">{user.userInfo?.profileImage ? (<img src={user.userInfo.profileImage} alt="Profile" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-xs">👤</div>)}</button>)}
      <button onClick={onOpenSettings} className="text-gray-400 hover:text-purple-400 transition-colors p-2 cursor-pointer z-50">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </div>
);

const UserInfoForm: React.FC<{ onSubmit: (info: UserInfo) => void; lang: Language }> = ({ onSubmit, lang }) => {
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [country, setCountry] = useState('South Korea');
    const handleSubmit = () => {
        if (!name || !birthDate) return alert("Please fill in all fields.");
        if (birthDate.length !== 8) return alert("Birthdate must be 8 digits (YYYYMMDD).");
        const info: UserInfo = { name, birthDate, country, timezone: COUNTRIES.find(c => c.nameEn === country)?.timezone || 'Asia/Seoul', zodiacSign: 'Unknown', nameChangeCount: 0, birthDateChanged: false, countryChanged: false };
        onSubmit(info);
    };
    return (
        <div className="space-y-4 w-full text-left">
            <div><label className="block text-xs text-gray-400 mb-1">Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-purple-500 outline-none" placeholder="Name / Nickname" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Birthdate (YYYYMMDD)</label><input value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-purple-500 outline-none" placeholder="19990101" maxLength={8} /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Country</label><select value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-purple-500 outline-none">{COUNTRIES.map(c => <option key={c.code} value={c.nameEn}>{c.nameKo} ({c.nameEn})</option>)}</select></div>
            <button onClick={handleSubmit} className="w-full bg-[#1a052a] hover:bg-[#3b0764] text-white font-bold py-3 rounded mt-4 transition-all shadow-[0_0_15px_rgba(76,29,149,0.5)] border border-purple-900/50">Next</button>
        </div>
    );
};

const ShufflingAnimation: React.FC<{ onComplete: () => void; lang: Language; skin: string; activeCustomSkin?: CustomSkin | null; rugColor?: string }> = ({ onComplete, lang, skin, activeCustomSkin, rugColor }) => {
    useEffect(() => {
        playShuffleLoop();
        const timer = setTimeout(() => { stopShuffleLoop(); onComplete(); }, 1200); 
        return () => { clearTimeout(timer); stopShuffleLoop(); };
    }, [onComplete]);
    const noiseSvg = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E";
    const rugStyle = { background: `radial-gradient(circle at center, ${rugColor || '#2e0b49'} 0%, #000000 100%), url("${noiseSvg}")`, backgroundBlendMode: 'multiply' };
    const cardBackStyle = activeCustomSkin ? { backgroundImage: `url(${activeCustomSkin.imageUrl})`, backgroundSize: 'cover' } : {};
    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative z-10 animate-fade-in rug-texture !border-0 !outline-none !shadow-none" style={rugStyle}>
            <style>{`@keyframes cosmic-shuffle { 0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); z-index: 1; filter: brightness(1); } 25% { transform: translate3d(-120px, -20px, 0) rotate(-10deg) scale(1.05); z-index: 10; filter: brightness(1.2); } 50% { transform: translate3d(0, -40px, 0) rotate(0deg) scale(1.1); z-index: 20; filter: brightness(1.5) drop-shadow(0 0 15px #a855f7); } 75% { transform: translate3d(120px, -20px, 0) rotate(10deg) scale(1.05); z-index: 10; filter: brightness(1.2); } 100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); z-index: 1; filter: brightness(1); } } @keyframes deck-pulse-fancy { 0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(168,85,247,0.3); } 50% { transform: scale(1.02); box-shadow: 0 0 40px rgba(168,85,247,0.6); } }`}</style>
            <div className="relative w-40 h-64 z-20" style={{ animation: 'deck-pulse-fancy 1.5s infinite ease-in-out', willChange: 'transform, box-shadow' }}>
                 <div className={`absolute inset-0 bg-purple-900 rounded-lg border border-purple-500/30 shadow-[0_0_20px_rgba(0,0,0,0.8)] card-back ${SKINS.find(s => s.id === skin)?.cssClass}`} style={cardBackStyle}></div>
                {[...Array(8)].map((_, i) => (<div key={`left-${i}`} className={`absolute inset-0 bg-purple-900 rounded-lg border border-purple-400/40 card-back ${SKINS.find(s => s.id === skin)?.cssClass}`} style={{ animation: `cosmic-shuffle 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite`, animationDelay: `${i * 0.08}s`, boxShadow: '0 4px 10px rgba(0,0,0,0.5)', willChange: 'transform, filter', ...cardBackStyle }}></div>))}
                {[...Array(8)].map((_, i) => (<div key={`right-${i}`} className={`absolute inset-0 bg-purple-900 rounded-lg border border-purple-400/40 card-back ${SKINS.find(s => s.id === skin)?.cssClass}`} style={{ animation: `cosmic-shuffle 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite reverse`, animationDelay: `${i * 0.08}s`, boxShadow: '0 4px 10px rgba(0,0,0,0.5)', willChange: 'transform, filter', ...cardBackStyle }}></div>))}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-24 h-24 bg-purple-500/30 blur-3xl rounded-full animate-pulse"></div></div>
            </div>
            <p className="mt-32 text-purple-200 font-occult animate-pulse text-2xl z-20 shadow-black drop-shadow-md">{lang === 'ko' ? "운명을 섞는 중..." : "Shuffling Fate..."}</p>
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
        if (newSelected.length === 3) { setTimeout(() => onSelectCards(newSelected), 1200); }
    };
    const noiseSvg = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E";
    const rugStyle = { background: `radial-gradient(circle at center, ${rugColor || '#2e0b49'} 0%, #000000 100%), url("${noiseSvg}")`, backgroundBlendMode: 'multiply' };
    return (
        <div className="flex flex-col items-center justify-start min-h-screen overflow-hidden relative z-10 pt-20 pb-10 rug-texture !border-0 !outline-none !shadow-none" style={rugStyle}>
            <h2 className="text-2xl font-occult text-purple-200 mb-8 animate-pulse text-center w-full shadow-black drop-shadow-md">{lang === 'ko' ? "3장의 카드를 선택하세요" : "Select 3 Cards"}</h2>
            <div className="w-full max-w-5xl h-[70vh] overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-transparent touch-pan-y">
                <div className="grid grid-cols-8 md:grid-cols-12 gap-1 pb-32">
                    {TAROT_DECK.map((cardName, i) => {
                        const isSelected = selected.includes(i);
                        return (<div key={i} onClick={() => handleCardClick(i)} className={`aspect-[2/3] rounded-sm border border-purple-500/30 cursor-pointer transition-all duration-500 ease-out card-back ${SKINS.find(s => s.id === skin)?.cssClass} touch-manipulation active:scale-95 transform-gpu will-change-transform ${isSelected ? 'scale-110 border-purple-200 z-50 brightness-125 -translate-y-4 shadow-[0_0_20px_#d946ef]' : 'hover:-translate-y-1 hover:scale-105 z-0 hover:z-10'}`} style={{ backgroundSize: 'cover', backgroundImage: activeCustomSkin ? `url(${activeCustomSkin.imageUrl})` : undefined, boxShadow: isSelected ? '0 0 15px #d946ef' : 'none' }}></div>);
                    })}
                </div>
            </div>
            <div className="absolute bottom-10 flex gap-3 z-20 pointer-events-none">{[...Array(3)].map((_, i) => (<div key={i} className={`w-4 h-4 rounded-full border-2 border-purple-500 transition-all duration-300 ${selected.length > i ? 'bg-purple-500 shadow-[0_0_15px_#d946ef] scale-125' : 'bg-transparent'}`}></div>))}</div>
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
    
    const [activeStickers, setActiveStickers] = useState<{id: number, src: string, x: number, y: number}[]>([]);
    
    const contentRef = useRef<HTMLDivElement>(null);
    const hasLogRef = useRef(false); 
    const frameRef = useRef<HTMLDivElement>(null);

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

    let resultFrameStyle: any = {};
    let isCustomFrame = false;
    if (user.resultFrame && user.resultFrame !== 'default') {
        const presetFrame = RESULT_FRAMES.find(f => f.id === user.resultFrame);
        if (!presetFrame) {
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

    useEffect(() => {
        if (frameRef.current && !isCustomFrame && user.resultFrame) {
            const presetFrame = RESULT_FRAMES.find(f => f.id === user.resultFrame);
            if (presetFrame) {
                frameRef.current.style.cssText = presetFrame.css;
            } else {
                frameRef.current.style.cssText = '';
            }
        }
    }, [user.resultFrame, isCustomFrame]);

    useEffect(() => {
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
                    if (!hasLogRef.current) {
                        hasLogRef.current = true;
                        onReadingComplete(text);
                    }
                    const solutionHeader = lang === 'en' ? "[Practical Solutions]" : "[실질적인 해결책]";
                    if (text.includes(solutionHeader)) {
                        const parts = text.split(solutionHeader);
                        setInterpretation(parts[0].trim());
                        let solRaw = parts[1].trim();
                        solRaw = solRaw.replace(/현실적인 해결책/g, "").replace(/가장 효과적인 해결책/g, "").replace(/창의적인 해결책/g, "")
                                 .replace(/Realistic Solution/g, "").replace(/Fastest Solution/g, "").replace(/Creative Solution/g, "")
                                 .trim();
                        setSolution(solutionHeader + "\n" + solRaw);
                    } else {
                        setInterpretation(text);
                        setSolution(""); 
                    }
                })
                .catch(err => {
                    console.error(err);
                    setRawText("운명의 신호가 약합니다. 잠시 후 다시 시도해주세요.");
                });
        }
    }, [readingPromise, onReadingComplete, rawText, lang]);

    const handleUnlockSolution = () => { if (spendCoins(15)) setIsSolutionUnlocked(true); };

    const handleShare = async () => {
        if (contentRef.current) {
            try {
                // FORCE 9:20 VERTICAL RATIO (Phone screen ratio)
                const canvas = await html2canvas(contentRef.current, { 
                    backgroundColor: '#000',
                    useCORS: true,
                    scale: 2,
                    windowWidth: 400, 
                    windowHeight: 890, 
                    onclone: (clonedDoc) => {
                        const wrapper = clonedDoc.querySelector('.result-content-wrapper') as HTMLElement;
                        const container = clonedDoc.querySelector('.shadow-2xl') as HTMLElement; 

                        if (container) {
                            // Enforce strict 9:20 vertical ratio
                            container.style.width = '400px';
                            container.style.height = '888px'; 
                            container.style.maxWidth = 'none';
                            container.style.maxHeight = 'none';
                            container.style.aspectRatio = '9/20';
                        }

                        if (wrapper) {
                            // Shrink text to fit ALL content inside fixed height
                            wrapper.style.fontSize = '9px'; 
                            wrapper.style.lineHeight = '1.3';
                            wrapper.style.overflow = 'visible';
                            
                            const cards = wrapper.querySelectorAll('.card-img-container');
                            cards.forEach((c: any) => c.style.marginBottom = '2px');
                            
                            const title = wrapper.querySelector('h2');
                            if(title) {
                                title.style.fontSize = '14px';
                                title.style.marginBottom = '8px';
                            }
                            
                            // Adjust solution box spacing
                            const solutionBox = wrapper.querySelector('.border-t');
                            if(solutionBox) {
                                (solutionBox as HTMLElement).style.marginTop = '4px';
                                (solutionBox as HTMLElement).style.paddingTop = '4px';
                            }
                        }
                    }
                });
                
                const link = document.createElement('a');
                link.download = 'black-tarot-result.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (e) {
                console.error("Share failed", e);
                alert("이미지 저장 중 오류가 발생했습니다.");
            }
        }
    };

    const addSticker = (src: string) => {
        const newSticker = { id: Date.now(), src, x: Math.random() * 60 + 20, y: Math.random() * 60 + 20 };
        setActiveStickers([...activeStickers, newSticker]);
    };

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: number) => {
        const target = e.currentTarget as HTMLElement;
        const container = contentRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        
        // Use requestAnimationFrame for smooth throttling
        let animationFrameId: number | null = null;

        const onMove = (mv: MouseEvent | TouchEvent) => {
            if (animationFrameId !== null) return; // Throttle

            animationFrameId = requestAnimationFrame(() => {
                const clientX = 'clientX' in mv ? (mv as MouseEvent).clientX : (mv as TouchEvent).touches[0].clientX;
                const clientY = 'clientY' in mv ? (mv as MouseEvent).clientY : (mv as TouchEvent).touches[0].clientY;
                
                let newX = ((clientX - rect.left) / rect.width) * 100;
                let newY = ((clientY - rect.top) / rect.height) * 100;
                
                setActiveStickers(prev => prev.map(s => s.id === id ? { ...s, x: newX, y: newY } : s));
                animationFrameId = null;
            });
        };
        
        const onUp = () => {
            if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
        };
        
        // Passive false is important for touchmove to prevent scrolling
        window.addEventListener('mousemove', onMove, { passive: false });
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp);
    };

    return (
        <div className="min-h-screen py-10 px-4 relative z-10 overflow-y-auto flex flex-col items-center">
            <div 
                ref={contentRef} 
                className="w-full max-w-[400px] aspect-[9/20] shadow-2xl relative overflow-hidden text-center flex flex-col rounded-2xl border border-purple-500/30 bg-black"
                style={resultBgStyle}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
                <div ref={frameRef} className="absolute inset-0 pointer-events-none z-20" style={isCustomFrame ? resultFrameStyle : undefined}></div>
                {activeStickers.map((sticker) => (
                    <div key={sticker.id} onMouseDown={(e) => handleDragStart(e, sticker.id)} onTouchStart={(e) => handleDragStart(e, sticker.id)} className="absolute z-50 cursor-move hover:scale-110 active:scale-95 transition-transform" style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: 'translate(-50%, -50%)' }}>
                        {sticker.src.startsWith('http') || sticker.src.startsWith('data:') ? <img src={sticker.src} className="w-16 h-16 object-contain drop-shadow-md" draggable={false} /> : <span className="text-5xl drop-shadow-md select-none">{sticker.src}</span>}
                    </div>
                ))}

                <div className="relative z-10 flex-1 flex flex-col p-6 overflow-y-auto scrollbar-hide result-content-wrapper">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-6 drop-shadow-md break-keep leading-snug result-title">{question}</h2>
                    
                    {/* Purple Gradient Line - Opacity 100 */}
                    <div className="w-24 h-1.5 bg-gradient-to-r from-transparent via-purple-600 to-transparent mx-auto mb-6 rounded-full opacity-100 shadow-[0_0_10px_rgba(147,51,234,0.5)]"></div>
                    
                    {/* Cards Display - Side by Side, Equal Width, No Wrap */}
                    <div className="flex w-full items-center justify-center gap-1 px-1 mb-6">
                        {selectedCards.map((card, idx) => (
                            <div key={idx} className="flex-1 min-w-0 flex flex-col items-center animate-fade-in card-img-container">
                                <div className="w-full aspect-[2/3] rounded-md border border-white/20 overflow-hidden relative shadow-lg bg-gray-900 group hover:scale-105 transition-transform">
                                    <img src={card.generatedImage || card.imagePlaceholder} alt={card.name} className={`w-full h-full object-cover transition-transform duration-700 ${card.isReversed ? 'rotate-180' : ''}`} />
                                    {card.isReversed && <div className="absolute inset-0 bg-red-900/30 pointer-events-none flex items-center justify-center"><span className="text-[8px] font-bold bg-black/70 px-1 py-0.5 rounded text-red-400 border border-red-500">REV</span></div>}
                                </div>
                                <span className="text-[9px] text-white/70 mt-1 font-serif truncate w-full text-center tracking-wide">{card.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 text-left space-y-4">
                        {!rawText ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="inline-block w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-white/70 animate-pulse font-serif text-sm">운명을 읽어내는 중...</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-[#1a0b2e]/90 backdrop-blur-md rounded-xl p-5 border border-purple-500/30 shadow-inner">
                                    <div className="text-gray-100 text-base leading-relaxed whitespace-pre-line font-sans drop-shadow-sm">
                                        {interpretation}
                                    </div>
                                </div>
                                {solution && (
                                    <div className="mt-4 pt-4 border-t border-white/10 relative">
                                        <div className={`p-4 rounded-xl transition-all duration-700 ${isSolutionUnlocked ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-black/40 border-gray-700 select-none'}`}>
                                            {/* Mosaic Effect when Locked: blur-[5px] */}
                                            <div className={`text-base leading-relaxed whitespace-pre-line font-bold font-sans ${isSolutionUnlocked ? 'text-white' : 'text-white/50 blur-[5px] select-none'}`}>
                                                {solution}
                                            </div>
                                        </div>
                                        {!isSolutionUnlocked && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                                <div className="text-4xl mb-2 drop-shadow-lg animate-bounce">🔒</div>
                                                <button onClick={handleUnlockSolution} className="px-6 py-3 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-full shadow-[0_0_20px_rgba(168,85,247,0.6)] transform hover:scale-105 transition-all flex items-center gap-2 border border-purple-400/30">
                                                    <span className="text-sm">{lang === 'ko' ? '실질적인 해결책 보기' : 'Unlock Solution'}</span>
                                                    <span className="bg-black/40 px-2 py-0.5 rounded-full text-xs text-yellow-300 font-mono">-15 C</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="mt-auto pt-6 pb-2 text-[10px] text-white/30 uppercase tracking-[0.3em] text-center font-serif">
                        {new Date().toLocaleDateString()} • BLACK TAROT
                    </div>
                </div>
            </div>
            {rawText && (
                <div className="w-full max-w-[400px] mt-6 flex gap-3 z-40">
                    <button onClick={onRetry} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-bold transition-all text-sm border border-gray-600 shadow-lg">{lang === 'ko' ? "처음으로" : "Home"}</button>
                    <button onClick={handleShare} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold shadow-lg transition-all text-sm flex items-center justify-center gap-2 border border-purple-400/50"><span>📥</span> {lang === 'ko' ? "결과 저장" : "Save Image"}</button>
                </div>
            )}
            <div className="w-full max-w-[400px] mt-4 mb-10 z-40">
                <div className="bg-[#0f0518]/90 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col gap-2">
                    <div className="text-[10px] text-purple-300 font-bold uppercase tracking-widest text-center mb-1 flex items-center justify-center gap-2"><span className="w-8 h-[1px] bg-purple-500/50"></span>DECORATE YOUR FATE<span className="w-8 h-[1px] bg-purple-500/50"></span></div>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 justify-start md:justify-center px-1">
                        {user.customStickers?.concat(DEFAULT_STICKERS).map((s, i) => (<button key={i} onClick={() => addSticker(s)} className="w-12 h-12 bg-white/5 hover:bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl hover:scale-110 shrink-0 border border-white/5 hover:border-purple-500/50 transition-all active:scale-95 shadow-sm">{s.startsWith('http') || s.startsWith('data:') ? <img src={s} className="w-full h-full object-contain p-1" /> : s}</button>))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [user, setUser] = useState<User>({ email: 'Guest', coins: 0, history: [], totalSpent: 0, tier: UserTier.BRONZE, attendanceDay: 0, ownedSkins: ['default'], currentSkin: 'default', readingsToday: 0, loginDates: [], customSkins: [], activeCustomSkin: null, monthlyCoinsSpent: 0, resultFrame: 'default', customFrames: [], resultBackground: 'default', customBackgrounds: [], customStickers: [], bgmVolume: 0.5 });
  const [authMode, setAuthMode] = useState<'LOGIN'|'SIGNUP'|null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMode, setSettingsMode] = useState<'MAIN' | 'RUG' | 'BGM' | 'SKIN' | 'HISTORY' | 'FRAME' | 'RESULT_BG' | 'STICKER'>('MAIN');
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGuestBlock, setShowGuestBlock] = useState(false);
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
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
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const saveUserState = useCallback(async (u: User, state: AppState) => {
      try { localStorage.setItem('black_tarot_user', JSON.stringify({ ...u, lastAppState: state })); } catch (e) { console.error(e); }
      if (u.email !== 'Guest' && isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          if (!userId) return;
          const payload: any = { id: userId, email: u.email, data: { ...u, lastAppState: state }, updated_at: new Date().toISOString() };
          // Upsert is correct here as we want to save the latest state for the logged-in user
          supabase.from('user_profiles').upsert(payload, { onConflict: 'id' }).then(({ error }) => { if (error) console.warn("Cloud save failed:", error.message); });
      }
  }, []);
  const navigateTo = (newState: AppState) => { setAppState(newState); saveUserState(user, newState); };
  const updateUser = (updater: (prev: User) => User) => { setUser(prev => { const newUser = updater(prev); saveUserState(newUser, appState); return newUser; }); };
  const handleReadingComplete = useCallback((text: string) => { 
      updateUser((prev) => {
          if (prev.history.length > 0) {
              const last = prev.history[0];
              if (last.question === selectedQuestion && Math.abs(new Date(last.date).getTime() - Date.now()) < 60000) return prev;
          }
          const result: ReadingResult = { date: new Date().toISOString(), question: selectedQuestion, cards: selectedCards, interpretation: text }; 
          return { ...prev, history: [result, ...(prev.history ?? [])] };
      }); 
  }, [selectedQuestion, selectedCards]); 

  // ✅ New Logic: userRef to handle stale closures
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const checkLockRef = useRef(false);

  // Strict Logout on Refresh Logic
  useEffect(() => {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === 'reload') {
        console.log("Reload detected, ensuring strict logout.");
        supabase.auth.signOut().then(() => {
            // Also clear any persistent local storage for user data to avoid leaks
            localStorage.removeItem('black_tarot_user');
            // Reset to clean guest state
            const cleanGuest: User = { email: 'Guest', coins: 0, history: [], totalSpent: 0, tier: UserTier.BRONZE, attendanceDay: 0, ownedSkins: ['default'], currentSkin: 'default', readingsToday: 0, loginDates: [], monthlyCoinsSpent: 0, lastAppState: AppState.WELCOME, customSkins: [], activeCustomSkin: null, resultFrame: 'default', customFrames: [], resultBackground: 'default', customBackgrounds: [], customStickers: [], bgmVolume: 0.5 };
            setUser(cleanGuest);
        });
    }
  }, []);

  const checkUser = useCallback(async (isLoginInit = false) => {
    try {
        let localUser: User | null = null;
        try { const stored = localStorage.getItem('black_tarot_user'); if (stored) localUser = JSON.parse(stored); } catch (e) {}
        
        // ✅ Use userRef.current
        let currentUser = localUser || { ...userRef.current, email: "Guest" };
        
        if (isSupabaseConfigured) {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    const email = authUser.email || "User";
                    try { 
                        const { data: existingProfile, error: fetchError } = await supabase.from("user_profiles").select("*").eq("id", authUser.id).single();
                        if (fetchError && fetchError.code !== 'PGRST116') {
                            console.error("Critical: Failed to fetch user profile.", fetchError);
                            return; 
                        }
                        if (existingProfile && existingProfile.data) {
                             // Load existing data strictly, do not overwrite with local/guest state
                             currentUser = { ...existingProfile.data, email };
                        } else {
                             // Initialize new profile safely
                             const profilePayload = { id: authUser.id, email: authUser.email ?? null, full_name: (authUser.user_metadata?.full_name ?? authUser.user_metadata?.name) ?? null, avatar_url: authUser.user_metadata?.avatar_url ?? null, updated_at: new Date().toISOString() };
                             // Use ignoreDuplicates logic conceptually (though onConflict='id' updates, the 'if exists' check above prevents overwrite).
                             // Adding ignoreDuplicates: true explicitly for safety if supported by library version
                             await supabase.from("user_profiles").upsert(profilePayload, { onConflict: "id", ignoreDuplicates: true });
                             
                             if (localUser && localUser.email === email) {
                                 currentUser = { ...localUser, email };
                             } else {
                                 currentUser = { ...userRef.current, email };
                             }
                        }
                        
                        if (!currentUser.customSkins) currentUser.customSkins = []; 
                        if (!currentUser.customFrames) currentUser.customFrames = []; 
                        if (!currentUser.customStickers) currentUser.customStickers = []; 
                        if (!currentUser.customBackgrounds) currentUser.customBackgrounds = []; 
                        if (!currentUser.ownedSkins) currentUser.ownedSkins = ['default'];
                    } catch(e) {
                        console.error("Profile check failed", e);
                        return; 
                    }
                    if (currentUser.email !== email) currentUser.email = email;
                } else {
                   // If no auth user (e.g. after refresh/logout), ensure strict guest mode
                   if (!localUser || localUser.email !== 'Guest') {
                        // Wipe any previous user data from state if we are now Guest
                        currentUser = { ...userRef.current, email: "Guest", tier: UserTier.BRONZE, coins: 0, history: [] }; 
                   }
                   if (!localStorage.getItem('tarot_device_id')) localStorage.setItem('tarot_device_id', Math.random().toString(36).substring(2));
                }
            } catch (error) { console.error(error); }
        } else {
             if (!localStorage.getItem('tarot_device_id')) localStorage.setItem('tarot_device_id', Math.random().toString(36).substring(2));
        }
        
        const userTimezone = currentUser.userInfo?.timezone || 'Asia/Seoul';
        const today = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone });

        if (currentUser.email !== 'Guest') {
            if (currentUser.lastAttendance !== today) {
                 let newDay = (currentUser.attendanceDay || 0) + 1;
                 if (newDay > 10) newDay = 1; 

                 const reward = ATTENDANCE_REWARDS[newDay - 1] || 20;
                 
                 currentUser.attendanceDay = newDay;
                 currentUser.lastAttendance = today;
                 currentUser.coins = (currentUser.coins || 0) + reward;
                 
                 setAttendanceReward(reward);
                 setShowAttendancePopup(true);
            }
        }

        const computedTier = calculateTier(currentUser.totalSpent);
        if (currentUser.tier !== computedTier) {
            currentUser.tier = computedTier;
        }

        if (typeof currentUser.bgmVolume === 'number') {
            setBgmVolume(currentUser.bgmVolume);
        }

        // Sanitize session to prevent stuck loading
        currentUser.lastAppState = AppState.CATEGORY_SELECT;
        if (currentUser.currentSession) {
             currentUser.currentSession.appState = AppState.CATEGORY_SELECT;
             currentUser.currentSession.readingResult = undefined;
        }

        setUser(currentUser); 
        setIsDataLoaded(true); 
        saveUserState(currentUser, AppState.CATEGORY_SELECT);

        // Only navigate if this is an explicit login action.
        // Otherwise, stay on WELCOME screen (default init state).
        if (isLoginInit) {
             setAppState(AppState.CATEGORY_SELECT);
        }
    } catch (error) { console.error("Critical error in checkUser:", error); }
  }, []); // Intentionally empty dependency to rely on ref

  // ✅ safeCheckUser
  const safeCheckUser = useCallback(async (isLoginInit = false) => {
    if (checkLockRef.current) return;
    checkLockRef.current = true;
    try {
      await checkUser(isLoginInit);
    } finally {
      checkLockRef.current = false;
    }
  }, [checkUser]);

  // ✅ One Consolidated onAuthStateChange
  useEffect(() => {
      if (!isSupabaseConfigured) return;

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { 
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) { 
              safeCheckUser(false); 
          } 
      });
      
      return () => { subscription.unsubscribe(); };
  }, [safeCheckUser]);

  useEffect(() => {
      // Prevent saving incomplete data
      if (!isDataLoaded) return;
      const timeoutId = setTimeout(() => {
          updateUser(prev => ({ ...prev, currentSession: { appState: appState, selectedCategoryId: selectedCategory?.id, selectedQuestion: selectedQuestion, customQuestion: customQuestion, selectedCards: selectedCards, readingResult: undefined, faceImage: faceImage || undefined, birthTime: birthTime, partnerBirth: partnerBirth } }));
      }, 1000); 
      return () => clearTimeout(timeoutId);
  }, [appState, selectedCategory, selectedQuestion, customQuestion, selectedCards, faceImage, birthTime, partnerBirth, isDataLoaded]);

  const initRef = useRef(false);
  useEffect(() => { if (!initRef.current) { initRef.current = true; checkUser(); } }, [checkUser]);

  const handleLogout = async () => { try { if (isSupabaseConfigured) await supabase.auth.signOut(); } catch (e) {} localStorage.removeItem('black_tarot_user'); const cleanGuestUser: User = { email: 'Guest', coins: 0, history: [], totalSpent: 0, tier: UserTier.BRONZE, attendanceDay: 0, ownedSkins: ['default'], currentSkin: 'default', readingsToday: 0, loginDates: [], monthlyCoinsSpent: 0, lastAppState: AppState.WELCOME, customSkins: [], activeCustomSkin: null, resultFrame: 'default', customFrames: [], resultBackground: 'default', customBackgrounds: [], customStickers: [], bgmVolume: 0.5 }; setUser(cleanGuestUser); setAppState(AppState.WELCOME); setShowSettings(false); setShowProfile(false); setBgmVolume(0.5); };
  const handleStart = () => { initSounds(); setBgmStopped(false); if (user.userInfo?.name && user.userInfo?.birthDate) navigateTo(AppState.CATEGORY_SELECT); else navigateTo(AppState.INPUT_INFO); };
  const handleUserInfoSubmit = (info: UserInfo) => { updateUser((prev) => ({ ...prev, userInfo: info })); navigateTo(AppState.CATEGORY_SELECT); };
  
  const spendCoins = (amount: number): boolean => { 
      if (user.email === 'Guest') return true; 
      if (user.coins < amount) { 
          if (confirm(TRANSLATIONS[lang].coin_shortage)) { setShowShop(true); setShopStep('AMOUNT'); } 
          return false; 
      } 
      
      // Calculate new tier state *before* update to check for changes
      const newTotalSpent = user.totalSpent + amount;
      const newTier = calculateTier(newTotalSpent);
      
      if (newTier !== user.tier) {
          const tiers = [UserTier.BRONZE, UserTier.SILVER, UserTier.GOLD, UserTier.PLATINUM];
          const oldIndex = tiers.indexOf(user.tier);
          const newIndex = tiers.indexOf(newTier);
          
          setTierChangeNewTier(newTier);
          setTierChangeDirection(newIndex > oldIndex ? 'UP' : 'DOWN');
          setShowTierChangePopup(true);
      }

      updateUser(prev => { 
          return { 
              ...prev, 
              coins: prev.coins - amount, 
              totalSpent: newTotalSpent, 
              monthlyCoinsSpent: (prev.monthlyCoinsSpent || 0) + amount,
              tier: newTier 
          }; 
      }); 
      return true; 
  };

  const checkGuestAction = () => { if (user.email === 'Guest') { alert("로그인한 사용자만 이용 가능합니다."); return true; } return false; };
  const buySkin = (skin: Skin) => { if (checkGuestAction()) return; if (user.ownedSkins.includes(skin.id)) { updateUser(prev => ({ ...prev, currentSkin: skin.id, activeCustomSkin: null })); return; } if (spendCoins(skin.cost)) { updateUser(prev => ({ ...prev, ownedSkins: [...prev.ownedSkins, skin.id], currentSkin: skin.id, activeCustomSkin: null })); } };
  const handleCustomSkinUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => setCustomSkinImage(e.target?.result as string); reader.readAsDataURL(file); };
  const handleSaveCustomSkin = () => { if (checkGuestAction()) return; if (!customSkinImage) return; if (!spendCoins(120)) return; const newSkin: CustomSkin = { id: Math.random().toString(36).substring(2), imageUrl: customSkinImage, isPublic: isSkinPublic, shareCode: isSkinPublic ? Math.floor(100000 + Math.random() * 900000).toString() : undefined }; updateUser(prev => ({ ...prev, customSkins: [...(prev.customSkins || []), newSkin], activeCustomSkin: newSkin })); setCustomSkinImage(null); alert(`${TRANSLATIONS[lang].skin_saved} ${newSkin.shareCode ? `Code: ${newSkin.shareCode}` : ''}`); };
  const handleCustomFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => setCustomFrameImage(e.target?.result as string); reader.readAsDataURL(file); };
  const handleSaveCustomFrame = () => { if (checkGuestAction()) return; if (!customFrameImage) return; const newFrame: CustomFrame = { id: Math.random().toString(36).substring(2), imageUrl: customFrameImage, name: 'Custom Frame' }; updateUser(prev => ({ ...prev, customFrames: [...(prev.customFrames || []), newFrame], resultFrame: newFrame.id })); setCustomFrameImage(null); alert("Frame Saved & Applied!"); };
  const handleCustomBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => setCustomBgImage(e.target?.result as string); reader.readAsDataURL(file); };
  const handleSaveCustomBg = () => { if (checkGuestAction()) return; if (!customBgImage) return; const newBg: CustomFrame = { id: Math.random().toString(36).substring(2), imageUrl: customBgImage, name: 'Custom BG' }; updateUser(prev => ({ ...prev, customBackgrounds: [...(prev.customBackgrounds || []), newBg], resultBackground: newBg.imageUrl })); setCustomBgImage(null); alert("Background Saved & Applied!"); };
  const handleCustomStickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => setCustomStickerImage(e.target?.result as string); reader.readAsDataURL(file); };
  const handleSaveCustomSticker = () => { if (checkGuestAction()) return; if (!customStickerImage) return; updateUser(prev => ({ ...prev, customStickers: [...(prev.customStickers || []), customStickerImage] })); setCustomStickerImage(null); alert("Sticker Added!"); };
  const handleApplySkinCode = () => { if (checkGuestAction()) return; const found = user.customSkins?.find(s => s.shareCode === inputSkinCode); if (found) { updateUser(prev => ({ ...prev, activeCustomSkin: found })); alert(TRANSLATIONS[lang].skin_applied); } else alert("Invalid Code (Simulation: Only local codes work in demo)"); };
  const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (checkGuestAction()) return; const file = e.target.files?.[0]; if (!file) return; const url = URL.createObjectURL(file); const newBgm: BGM = { id: 'custom-' + Date.now(), name: file.name, url: url, category: 'DEFAULT' }; setCurrentBgm(newBgm); alert("BGM Applied!"); };
  const handleRugChange = (color: string) => { if (checkGuestAction()) return; updateUser(prev => ({ ...prev, rugColor: color })); };
  const handleOpenProfile = () => { if (user.userInfo) setEditProfileData({ ...user.userInfo }); setShowProfile(true); };
  const handleSaveProfile = async () => { if (!user.userInfo) return; if (checkGuestAction()) return; const currentInfo = user.userInfo; const nextInfo = { ...editProfileData }; if (nextInfo.name !== currentInfo.name) { const currentCount = currentInfo.nameChangeCount || 0; if (currentCount >= 5) { alert("이름 변경 횟수(5회)를 초과했습니다."); return; } nextInfo.nameChangeCount = currentCount + 1; } else { nextInfo.nameChangeCount = currentInfo.nameChangeCount; } if (nextInfo.birthDate !== currentInfo.birthDate) { if (currentInfo.birthDateChanged) { alert("생년월일은 한 번만 변경할 수 있습니다."); return; } nextInfo.birthDateChanged = true; } if (nextInfo.country !== currentInfo.country) { if (currentInfo.countryChanged) { alert("국가는 한 번만 변경할 수 있습니다."); return; } nextInfo.countryChanged = true; } updateUser(prev => ({ ...prev, userInfo: nextInfo })); setShowProfile(false); alert("프로필이 저장되었습니다."); };
  
  const handleDeleteAccount = async () => { 
      if (confirm(TRANSLATIONS[lang].delete_confirm)) { 
          if (isSupabaseConfigured) {
              try {
                  const { data: { user: authUser } } = await supabase.auth.getUser();
                  if (authUser) {
                      await supabase.from('user_profiles').delete().eq('id', authUser.id);
                  }
              } catch (e) {
                  console.error("Data deletion failed", e);
              }
              await supabase.auth.signOut(); 
          }
          localStorage.removeItem('black_tarot_user'); 
          localStorage.removeItem('tarot_device_id'); 
          const cleanUser = { email: 'Guest', coins: 0, history: [], totalSpent: 0, tier: UserTier.BRONZE, attendanceDay: 0, ownedSkins: ['default'], currentSkin: 'default', readingsToday: 0, loginDates: [], monthlyCoinsSpent: 0, lastAppState: AppState.WELCOME, customSkins: [], activeCustomSkin: null, resultFrame: 'default', customFrames: [], resultBackground: 'default', customBackgrounds: [], customStickers: [], bgmVolume: 0.5 }; 
          setUser(cleanUser); 
          setAppState(AppState.WELCOME); 
          setShowProfile(false); 
      } 
  };

  const initiatePayment = (amount: number, coins: number) => { if (user.email === 'Guest') { alert("Please login to purchase coins."); return; } setPendingPackage({ amount, coins }); setShopStep('METHOD'); };
  
  // FIX: Payment process modified to show demand alert instead of awarding coins
  const processPayment = () => {
    if (!pendingPackage) return;
    alert("댓글이 100개가 넘으면 오픈합니다.");
    setPendingPackage(null);
    setShopStep('AMOUNT');
    setShowShop(false);
  };
  
  const handleCategorySelect = (category: QuestionCategory) => { if (user.email === 'Guest' && ['FACE', 'LIFE', 'SECRET_COMPAT', 'PARTNER_LIFE'].includes(category.id)) { setAuthMode('LOGIN'); return; } if (category.minTier) { const tiers = [UserTier.BRONZE, UserTier.SILVER, UserTier.GOLD, UserTier.PLATINUM]; if (tiers.indexOf(user.tier) < tiers.indexOf(category.minTier)) { alert(`This category requires ${category.minTier} tier or higher.`); return; } } setSelectedCategory(category); if (category.id === 'FACE') navigateTo(AppState.FACE_UPLOAD); else if (category.id === 'LIFE') navigateTo(AppState.LIFE_INPUT); else if (category.id === 'SECRET_COMPAT' || category.id === 'PARTNER_LIFE') navigateTo(AppState.PARTNER_INPUT); else navigateTo(AppState.QUESTION_SELECT); };
  const handleEnterChat = async () => { if (!spendCoins(20)) return; navigateTo(AppState.CHAT_ROOM); };
  const handleQuestionSelect = (q: string) => { setSelectedQuestion(q); navigateTo(AppState.SHUFFLING); };
  const checkTierLimit = () => { if (user.email === 'Guest') return true; if (user.tier === UserTier.GOLD || user.tier === UserTier.PLATINUM) return true; const limit = user.tier === UserTier.SILVER ? 30 : 10; if (user.readingsToday >= limit) { alert(`${user.tier} 등급의 일일 리딩 한도(${limit}회)를 초과했습니다. 내일 다시 시도하세요.`); return false; } return true; };
  const startFaceReading = () => { if (user.email === 'Guest' && parseInt(localStorage.getItem('guest_readings') || '0') >= 1) { setShowGuestBlock(true); return; } if (!checkTierLimit()) return; if (!faceImage) return alert("Please upload a photo first."); if (!spendCoins(250)) return; navigateTo(AppState.RESULT); setSelectedQuestion(TRANSLATIONS[lang].face_reading_title); setSelectedCards([]); setReadingPromise(getFaceReading(faceImage, user.userInfo, lang)); updateUser(prev => ({...prev, readingsToday: prev.readingsToday + 1})); };
  const startLifeReading = () => { if (user.email === 'Guest' && parseInt(localStorage.getItem('guest_readings') || '0') >= 1) { setShowGuestBlock(true); return; } if (!checkTierLimit()) return; if (!spendCoins(250)) return; const finalUserInfo: UserInfo = { ...(user.userInfo as UserInfo), birthTime: `${birthTime.h}:${birthTime.m}` }; navigateTo(AppState.RESULT); setSelectedQuestion(TRANSLATIONS[lang].life_reading_title); setSelectedCards([]); setReadingPromise(getLifeReading(finalUserInfo, lang)); updateUser(prev => ({...prev, readingsToday: prev.readingsToday + 1})); };
  const startPartnerReading = () => { if (user.email === 'Guest' && parseInt(localStorage.getItem('guest_readings') || '0') >= 1) { setShowGuestBlock(true); return; } if (!checkTierLimit()) return; if (!partnerBirth || partnerBirth.length < 8) return alert("올바른 생년월일을 입력해주세요. (YYYYMMDD)"); const isSecret = selectedCategory?.id === 'SECRET_COMPAT'; const cost = isSecret ? 200 : 250; if (!spendCoins(cost)) return; navigateTo(AppState.RESULT); setSelectedQuestion(selectedCategory?.label || "Partner Reading"); setSelectedCards([]); if (isSecret) { if (!user.userInfo) { alert("User info missing"); return; } setReadingPromise(getCompatibilityReading(user.userInfo, partnerBirth, lang)); } else { setReadingPromise(getPartnerLifeReading(partnerBirth, lang)); } updateUser(prev => ({...prev, readingsToday: prev.readingsToday + 1})); };
  const handleCardSelect = (indices: number[]) => { 
      if (user.email === 'Guest') { const guestReadings = parseInt(localStorage.getItem('guest_readings') || '0'); if (guestReadings >= 1) { setShowGuestBlock(true); return; } localStorage.setItem('guest_readings', (guestReadings + 1).toString()); } else { if (!checkTierLimit()) return; if (!spendCoins(5)) return; updateUser(prev => ({...prev, readingsToday: prev.readingsToday + 1})); } 
      const selected = indices.map(i => { const cardName = TAROT_DECK[i]; return { id: i, name: cardName, isReversed: Math.random() < 0.3, imagePlaceholder: getFallbackTarotImage(i), generatedImage: undefined, backDesign: 0 }; }); 
      setSelectedCards(selected); navigateTo(AppState.RESULT); setReadingPromise(getTarotReading(selectedQuestion, selected, user.userInfo, lang, user.history, user.tier)); 
      selected.forEach((card, idx) => { generateTarotCardImage(card.name).then(base64 => { const imageUrl = `data:image/png;base64,${base64}`; setSelectedCards(prev => { const newCards = [...prev]; if (newCards[idx] && newCards[idx].name === card.name) { newCards[idx] = { ...newCards[idx], generatedImage: imageUrl }; } return newCards; }); }).catch(err => { const seed = Math.floor(Math.random() * 1000000); const genUrl = `https://image.pollinations.ai/prompt/tarot%20card%20${encodeURIComponent(card.name)}%20mystical%20dark%20fantasy%20style%20deep%20purple%20and%20gold%20smoke%20effect%20detailed%204k%20no%20text?width=300&height=500&nologo=true&seed=${seed}&model=flux-schnell`; setSelectedCards(prev => { const newCards = [...prev]; if (newCards[idx] && newCards[idx].name === card.name) { newCards[idx] = { ...newCards[idx], generatedImage: genUrl }; } return newCards; }); }); }); 
  };
  const isFirstPurchase = user.totalSpent === 0 && user.email !== 'Guest';
  const isGuest = user.email === 'Guest';
  const handleSettingsClick = (mode: 'SKIN' | 'FRAME' | 'RUG' | 'BGM' | 'HISTORY' | 'RESULT_BG' | 'STICKER') => { if (user.email === 'Guest') { alert("로그인이 필요한 기능입니다."); setAuthMode('LOGIN'); return; } setSettingsMode(mode); };

  return (
      <div className={`relative min-h-screen text-white font-sans overflow-hidden select-none ${SKINS.find(s=>s.id===user.currentSkin)?.cssClass}`}>
          <Background />
          <AudioPlayer volume={bgmVolume} userStopped={bgmStopped} currentTrack={currentBgm.url} />
          {appState !== AppState.WELCOME && appState !== AppState.INPUT_INFO && appState !== AppState.CHAT_ROOM && (
              <div className="z-50 pointer-events-auto"><Header user={user} lang={lang} onOpenSettings={() => { setShowSettings(true); setSettingsMode('MAIN'); }} onOpenShop={() => { setShowShop(true); setShopStep('AMOUNT'); }} onLogin={() => setAuthMode("LOGIN")} openProfile={handleOpenProfile} /></div>
          )}
          {showGuestBlock && ( <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-6"><div className="bg-gray-900 border border-purple-500 p-8 rounded text-center max-w-sm w-full shadow-[0_0_50px_rgba(168,85,247,0.5)]"><h2 className="text-2xl font-bold text-white mb-4">STOP</h2><p className="text-gray-300 mb-8 leading-relaxed">{TRANSLATIONS[lang].guest_lock_msg}</p><button onClick={() => { setShowGuestBlock(false); setAuthMode('LOGIN'); }} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all hover:scale-105">{TRANSLATIONS[lang].guest_lock_btn}</button></div></div> )}
          
          {showTierChangePopup && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in p-6" onClick={() => setShowTierChangePopup(false)}>
                  <div className="relative bg-[#1a103c] border-2 border-yellow-500 rounded-xl p-8 max-w-sm w-full text-center shadow-[0_0_80px_rgba(250,204,21,0.6)] overflow-hidden" onClick={e=>e.stopPropagation()}>
                      {tierChangeDirection === 'UP' && <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent animate-pulse pointer-events-none"></div>}
                      <div className="text-6xl mb-4 animate-bounce">{tierChangeDirection === 'UP' ? '🚀' : '📉'}</div>
                      <h2 className="text-3xl font-occult text-white mb-2 uppercase font-bold tracking-wider">{tierChangeDirection === 'UP' ? TIER_POPUP_TEXT[lang].up_title : TIER_POPUP_TEXT[lang].down_title}</h2>
                      <p className={`text-lg font-bold mb-6 ${tierChangeDirection === 'UP' ? 'text-yellow-400' : 'text-gray-400'}`}>Current Tier: <span className="text-2xl">{tierChangeNewTier}</span></p>
                      {tierChangeDirection === 'UP' ? (
                          <div className="bg-black/40 p-4 rounded-lg border border-white/10 mb-6 text-sm text-gray-300 text-left"><p className="mb-2 font-bold text-white">{TIER_POPUP_TEXT[lang].up_msg}</p><ul className="list-disc list-inside space-y-1">{tierChangeNewTier === UserTier.SILVER && <li>{TIER_POPUP_TEXT[lang].benefit_silver}</li>}{tierChangeNewTier === UserTier.GOLD && <li>{TIER_POPUP_TEXT[lang].benefit_gold}</li>}{tierChangeNewTier === UserTier.PLATINUM && <li>{TIER_POPUP_TEXT[lang].benefit_platinum}</li>}</ul></div>
                      ) : ( <div className="bg-black/40 p-4 rounded-lg border border-white/10 mb-6 text-sm text-gray-300"><p>{TIER_POPUP_TEXT[lang].down_msg}</p></div> )}
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
                          <AuthForm onClose={() => setAuthMode(null)} onLoginSuccess={() => { setAuthMode(null); checkUser(true); }} onSwitchToSignup={() => setAuthMode('SIGNUP')} />
                      ) : (
                          <SignUpForm onClose={() => setAuthMode(null)} onSwitchToLogin={() => setAuthMode('LOGIN')} />
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
                 <div className="w-full max-w-lg bg-[#0d001a] border border-[#d4af37] rounded-2xl shadow-[0_0_60px_rgba(139,92,246,0.2)] relative overflow-hidden flex flex-col animate-fade-in">
                     <button onClick={() => { setShowShop(false); setShopStep('AMOUNT'); }} className="absolute top-4 right-4 text-[#d4af37] hover:text-white z-20"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                     {shopStep === 'AMOUNT' ? (
                        <>
                            <div className="p-8 pb-4 relative z-10 text-center"><h2 className="text-3xl font-occult text-yellow-500 mb-2">{TRANSLATIONS[lang].shop_title}</h2><p className="text-gray-400 text-sm">{TRANSLATIONS[lang].shop_subtitle}</p>{isFirstPurchase && <p className="text-green-400 font-bold text-xs mt-2 animate-pulse">First Purchase 50% OFF!</p>}</div>
                            <div className="p-8 pt-0 space-y-4 relative z-10">
                                <button onClick={() => initiatePayment(isFirstPurchase ? 2450 : 4900, 60)} className="w-full bg-gradient-to-r from-gray-900 to-black border border-gray-700 hover:border-yellow-500 p-4 rounded-xl flex items-center justify-between group transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-yellow-900/20 flex items-center justify-center text-xs font-bold text-yellow-500">C</div><div className="text-left"><div className="text-yellow-100 font-bold group-hover:text-yellow-400">60 Coins</div><div className="text-gray-500 text-xs">Basic Reading</div></div></div><div className="flex flex-col items-end">{isFirstPurchase && <span className="text-xs text-gray-500 line-through">₩4,900</span>}<span className="text-white font-bold">₩{(isFirstPurchase ? 2450 : 4900).toLocaleString()}</span></div></button>
                                <button onClick={() => initiatePayment(isFirstPurchase ? 3950 : 7900, 110)} className="w-full bg-gradient-to-r from-gray-900 to-black border border-gray-700 hover:border-yellow-500 p-4 rounded-xl flex items-center justify-between group transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-yellow-900/20 flex items-center justify-center text-xs font-bold text-yellow-500">C</div><div className="text-left"><div className="text-yellow-100 font-bold group-hover:text-yellow-400">110 Coins</div><div className="text-gray-500 text-xs">Popular Choice</div></div></div><div className="flex flex-col items-end">{isFirstPurchase && <span className="text-xs text-gray-500 line-through">₩7,900</span>}<span className="text-white font-bold">₩{(isFirstPurchase ? 3950 : 7900).toLocaleString()}</span></div></button>
                                <button onClick={() => initiatePayment(isFirstPurchase ? 7750 : 15500, 220)} className="w-full bg-gradient-to-r from-gray-900 to-black border border-yellow-700/50 hover:border-yellow-400 p-4 rounded-xl flex items-center justify-between group transition-all relative overflow-hidden"><div className="absolute inset-0 bg-yellow-900/10 group-hover:bg-yellow-900/20 transition-colors"></div><div className="flex items-center gap-4 relative z-10"><div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-xs text-black font-bold">VIP</div><div className="text-left"><div className="text-yellow-400 font-bold group-hover:text-yellow-200">220 Coins</div><div className="text-yellow-700 text-xs">Best Value</div></div></div><div className="flex flex-col items-end relative z-10">{isFirstPurchase && <span className="text-xs text-yellow-700 line-through">₩15,500</span>}<span className="text-yellow-400 font-bold">₩{(isFirstPurchase ? 7750 : 15500).toLocaleString()}</span></div></button>
                            </div>
                        </>
                     ) : (
                        <div className="p-8 relative z-10 text-center animate-fade-in">
                            <h2 className="text-2xl font-bold text-white mb-6">{TRANSLATIONS[lang].pay_title}</h2>
                            <div className="mb-4"><p className="text-yellow-400 text-xl font-bold">{pendingPackage?.coins} Coins</p><p className="text-white text-lg">₩{pendingPackage?.amount.toLocaleString()}</p></div>
                            <div className="grid grid-cols-2 gap-4 mb-8">{['TOSS', 'PAYPAL', 'APPLE', 'KAKAO'].map(m => (<button key={m} onClick={() => setSelectedPaymentMethod(m as any)} className={`p-4 rounded-xl border ${selectedPaymentMethod === m ? 'border-yellow-500 bg-yellow-900/20 text-white' : 'border-gray-700 bg-black/50 text-gray-400 hover:border-gray-500'}`}>{m}</button>))}</div>
                            <div className="flex gap-3"><button onClick={() => setShopStep('AMOUNT')} className="flex-1 py-3 bg-gray-800 rounded text-gray-300 font-bold">{TRANSLATIONS[lang].pay_cancel}</button><button onClick={processPayment} className="flex-[2] py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:brightness-110">{TRANSLATIONS[lang].pay_confirm}</button></div>
                        </div>
                     )}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-900/20 blur-[100px] pointer-events-none"></div>
                 </div>
             </div>
          )}
          {showSettings && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
                 <div className="w-full max-w-md bg-[#0f0518]/95 border border-purple-500/40 rounded-2xl p-6 relative shadow-[0_0_60px_rgba(168,85,247,0.25)] backdrop-blur-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                     <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-purple-300/50 hover:text-white transition-colors">✕</button>
                     <h2 className="text-2xl font-occult text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-100 to-purple-400 mb-8 text-center border-b border-purple-500/20 pb-4 tracking-widest">{TRANSLATIONS[lang].settings_title}</h2>
                     {settingsMode === 'MAIN' && (
                         <div className="space-y-6">
                             <div>
                                 <label className="block text-sm text-purple-200 mb-2 font-serif">{TRANSLATIONS[lang].language_control}</label>
                                 <div className="flex bg-[#1a0b2e] rounded-xl border border-purple-500/30 p-1"><button onClick={() => setLang('ko')} className={`flex-1 py-2 rounded-lg text-sm transition-all font-serif ${lang === 'ko' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-gray-400 hover:text-white'}`}>한국어</button><button onClick={() => setLang('en')} className={`flex-1 py-2 rounded-lg text-sm transition-all font-serif ${lang === 'en' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-gray-400 hover:text-white'}`}>English</button></div>
                             </div>
                             {user.email !== 'Guest' && (
                                <div className="bg-[#1a0b2e] rounded-xl border border-purple-500/30 p-4 mt-2">
                                    <h4 className="text-sm font-bold text-purple-200 mb-2 font-serif">{TRANSLATIONS[lang].attendance}</h4>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Day {user.attendanceDay}</span><span>Goal: 10</span></div>
                                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner"><div className="bg-gradient-to-r from-yellow-600 to-yellow-300 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(Math.min(user.attendanceDay, 10) / 10) * 100}%` }}></div></div>
                                    <p className="text-[10px] text-gray-500 mt-2 text-center italic">Log in daily for bonus coins!</p>
                                </div>
                             )}
                             <div>
                                 <label className="block text-sm text-purple-200 mb-2 font-serif">{TRANSLATIONS[lang].bgm_control}</label>
                                 <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.01" 
                                    value={bgmVolume} 
                                    onInput={e => {
                                        const newVol = parseFloat((e.target as HTMLInputElement).value);
                                        setBgmVolume(newVol);
                                    }}
                                    onMouseUp={() => updateUser(prev => ({...prev, bgmVolume}))}
                                    onTouchEnd={() => updateUser(prev => ({...prev, bgmVolume}))}
                                    className="w-full accent-purple-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" 
                                />
                                 <div className="flex justify-between mt-2"><button onClick={() => setBgmStopped(!bgmStopped)} className="text-xs text-purple-300 border border-purple-500/30 px-3 py-1 rounded-lg hover:bg-purple-500/20 transition-all">{bgmStopped ? 'PLAY' : 'STOP'}</button><span className="text-xs text-gray-500">{currentBgm.name}</span></div>
                             </div>
                             <div className="border-t border-purple-500/20 pt-6 space-y-3">
                                 <button onClick={() => handleSettingsClick('SKIN')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm"><span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].skin_shop}</span></button>
                                 <button onClick={() => handleSettingsClick('FRAME')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm"><span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].frame_shop}</span></button>
                                 <button onClick={() => handleSettingsClick('RESULT_BG')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm"><span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].result_bg_shop}</span></button>
                                 <button onClick={() => handleSettingsClick('STICKER')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm"><span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].sticker_shop}</span></button>
                                 <button onClick={() => handleSettingsClick('RUG')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm"><span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].rug_shop}</span></button>
                                 <button onClick={() => handleSettingsClick('BGM')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm"><span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].bgm_upload}</span></button>
                                 <button onClick={() => handleSettingsClick('HISTORY')} className="w-full py-4 bg-white/5 hover:bg-purple-500/10 rounded-xl border border-white/5 hover:border-purple-500/50 text-left px-4 text-sm text-purple-100 flex justify-between items-center transition-all group backdrop-blur-sm"><span className="font-serif group-hover:text-white transition-colors">{TRANSLATIONS[lang].history}</span></button>
                             </div>
                             {user.email !== 'Guest' && (<div className="pt-6 border-t border-purple-500/20 text-center"><button onClick={handleLogout} className="text-xs text-red-400/70 hover:text-red-400 font-serif tracking-widest transition-colors">{TRANSLATIONS[lang].logout}</button></div>)}
                         </div>
                     )}
                     {settingsMode === 'FRAME' && (<div className="space-y-4"><button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button><h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Select Result Frame</h3><div className="grid grid-cols-2 gap-4">{RESULT_FRAMES.map(frame => (<div key={frame.id} onClick={() => { if(checkGuestAction()) return; updateUser(prev => ({...prev, resultFrame: frame.id})); }} className={`aspect-[3/4] border relative cursor-pointer bg-[#050505] flex items-center justify-center rounded-lg transition-all ${user.resultFrame === frame.id ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'border-gray-800 hover:border-purple-500/50'}`}><div className="absolute inset-2 z-10 bg-gray-800/50 flex items-center justify-center text-[8px] text-gray-400 rounded">Preview</div><div className="absolute inset-0 z-20 pointer-events-none rounded-lg" style={{ cssText: frame.css } as any}></div><span className="absolute bottom-[-20px] text-[10px] text-gray-400 w-full text-center">{frame.name}</span></div>))}</div><div className="mt-8 pt-4 border-t border-purple-500/20"><h3 className="text-sm font-bold text-purple-200 mb-4">{TRANSLATIONS[lang].custom_frame_title}</h3><div className="border border-dashed border-purple-500/30 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all relative"><input type="file" accept="image/*" onChange={handleCustomFrameUpload} className="absolute inset-0 opacity-0 cursor-pointer" />{customFrameImage ? <img src={customFrameImage} className="h-20 mx-auto object-contain rounded" /> : <span className="text-xs text-gray-400">Upload Frame Image</span>}</div>{customFrameImage && <button onClick={handleSaveCustomFrame} className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition-colors font-bold shadow-lg">Save Frame</button>}{user.customFrames && user.customFrames.length > 0 && (<div className="grid grid-cols-3 gap-2 mt-4">{user.customFrames.map(cf => (<div key={cf.id} onClick={() => { if(checkGuestAction()) return; updateUser(prev => ({...prev, resultFrame: cf.id})); }} className={`aspect-[3/4] border cursor-pointer bg-black relative rounded-lg ${user.resultFrame === cf.id ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-gray-800'}`}><div className="absolute inset-0 rounded-lg" style={{ border: '10px solid transparent', borderImage: `url(${cf.imageUrl}) 20 round` }}></div></div>))}</div>)}</div></div>)}
                     {settingsMode === 'RESULT_BG' && (<div className="space-y-4"><button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button><h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Select Result Background</h3><div className="grid grid-cols-2 gap-4">{RESULT_BACKGROUNDS.map(bg => (<div key={bg.id} onClick={() => updateUser(prev => ({...prev, resultBackground: bg.id}))} className={`aspect-square border cursor-pointer rounded-lg transition-all relative overflow-hidden ${user.resultBackground === bg.id ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-gray-800'}`}><div className="absolute inset-0" style={{ background: bg.css }}></div><span className="absolute bottom-1 w-full text-center text-[10px] text-white/70 bg-black/30 backdrop-blur-sm">{bg.name}</span></div>))}</div><div className="mt-4 pt-4 border-t border-purple-500/20"><h3 className="text-sm font-bold text-purple-200 mb-4">Custom Background</h3><div className="border border-dashed border-purple-500/30 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all relative"><input type="file" accept="image/*" onChange={handleCustomBgUpload} className="absolute inset-0 opacity-0 cursor-pointer" />{customBgImage ? <img src={customBgImage} className="h-20 mx-auto object-cover rounded" /> : <span className="text-xs text-gray-400">Upload Background</span>}</div>{customBgImage && <button onClick={handleSaveCustomBg} className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-bold shadow-lg">Set Background</button>}{user.customBackgrounds && user.customBackgrounds.length > 0 && (<div className="grid grid-cols-3 gap-2 mt-4">{user.customBackgrounds.map(bg => (<div key={bg.id} onClick={() => updateUser(prev => ({...prev, resultBackground: bg.imageUrl}))} className={`aspect-square border cursor-pointer relative rounded-lg overflow-hidden ${user.resultBackground === bg.imageUrl ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-gray-800'}`}><div className="absolute inset-0" style={{ backgroundImage: `url(${bg.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div></div>))}</div>)}</div></div>)}
                     {settingsMode === 'STICKER' && (<div className="space-y-4"><button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button><h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Manage Stickers</h3><div className="flex flex-wrap gap-2 mb-4 bg-black/40 p-2 rounded-lg">{user.customStickers?.map((s, i) => (<div key={i} className="w-10 h-10 border border-gray-700 rounded bg-black/60 p-1 relative group"><img src={s} className="w-full h-full object-contain" /><button onClick={() => updateUser(prev => ({...prev, customStickers: prev.customStickers?.filter((_, idx) => idx !== i)}))} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100">✕</button></div>))}{(!user.customStickers || user.customStickers.length === 0) && <span className="text-xs text-gray-500 w-full text-center py-2">No custom stickers yet.</span>}</div><div className="border border-dashed border-purple-500/30 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all relative"><input type="file" accept="image/*" onChange={handleCustomStickerUpload} className="absolute inset-0 opacity-0 cursor-pointer" />{customStickerImage ? <img src={customStickerImage} className="h-20 mx-auto object-contain" /> : <span className="text-xs text-gray-400">{TRANSLATIONS[lang].sticker_upload}</span>}</div>{customStickerImage && <button onClick={handleSaveCustomSticker} className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-bold shadow-lg">Add Sticker</button>}</div>)}
                     {settingsMode === 'SKIN' && (<div className="space-y-4"><button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button><h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Select Card Skin</h3><div className="grid grid-cols-2 gap-4">{SKINS.map(skin => (<div key={skin.id} onClick={() => buySkin(skin)} className={`border rounded-lg p-2 cursor-pointer transition-all ${user.currentSkin === skin.id && !user.activeCustomSkin ? 'border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-gray-800 hover:border-purple-500/50'} ${user.tier === UserTier.BRONZE && skin.cost > 0 && !isGuest ? 'opacity-50 grayscale' : ''}`}><div className={`h-24 rounded-md mb-2 w-full card-back ${skin.cssClass}`}></div><div className="flex justify-between items-center"><span className="text-xs text-gray-300 font-serif">{skin.name}</span>{user.ownedSkins.includes(skin.id) ? <span className="text-[10px] bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded border border-green-800">OWNED</span> : <span className={`text-[10px] ${isGuest ? 'text-green-400' : 'text-purple-300'}`}>{isGuest ? 'Free' : skin.cost + ' C'}</span>}</div></div>))}</div><div className="mt-8 pt-4 border-t border-purple-500/20"><h3 className="text-sm font-bold text-purple-200 mb-4">{TRANSLATIONS[lang].custom_skin_title}</h3><div className="space-y-4"><div className="border border-dashed border-purple-500/30 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all relative"><input type="file" accept="image/*" onChange={handleCustomSkinUpload} className="absolute inset-0 opacity-0 cursor-pointer" />{customSkinImage ? <img src={customSkinImage} className="h-32 mx-auto object-contain rounded" /> : <span className="text-xs text-gray-400">{TRANSLATIONS[lang].upload_skin}</span>}</div>{customSkinImage && (<div className="flex flex-col gap-2"><div className="flex gap-2 text-xs"><button onClick={() => setIsSkinPublic(false)} className={`flex-1 py-2 rounded-lg border transition-all ${!isSkinPublic ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>{TRANSLATIONS[lang].private_option}</button><button onClick={() => setIsSkinPublic(true)} className={`flex-1 py-2 rounded-lg border transition-all ${isSkinPublic ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>{TRANSLATIONS[lang].public_option}</button></div><button onClick={handleSaveCustomSkin} className="w-full py-2.5 bg-white text-black font-bold rounded-lg text-xs hover:bg-gray-200 shadow-lg">Save Custom Skin (-120 Coin)</button></div>)}<div className="mt-4 pt-4 border-t border-purple-500/20"><label className="text-xs text-gray-400 block mb-2">{TRANSLATIONS[lang].skin_code_label}</label><div className="flex gap-2"><input value={inputSkinCode} onChange={e=>setInputSkinCode(e.target.value)} placeholder={TRANSLATIONS[lang].skin_code_placeholder} className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none" /><button onClick={handleApplySkinCode} className="px-4 py-2 bg-purple-900/50 border border-purple-500/50 text-purple-200 text-xs rounded-lg hover:bg-purple-800 transition-colors font-bold">{TRANSLATIONS[lang].skin_code_btn}</button></div></div>{user.customSkins && user.customSkins.length > 0 && (<div className="grid grid-cols-3 gap-2 mt-4">{user.customSkins.map(cs => (<div key={cs.id} onClick={() => { if(checkGuestAction()) return; updateUser(prev => ({...prev, activeCustomSkin: cs})); }} className={`aspect-[2/3] rounded-lg border cursor-pointer bg-cover bg-center transition-all ${user.activeCustomSkin?.id === cs.id ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'border-gray-800 hover:border-purple-500/50'}`} style={{ backgroundImage: `url(${cs.imageUrl})` }}></div>))}<div onClick={() => { if(checkGuestAction()) return; updateUser(prev => ({...prev, activeCustomSkin: null})); }} className="aspect-[2/3] rounded-lg border border-red-900/50 flex items-center justify-center text-red-400 text-xs cursor-pointer hover:bg-red-900/20 hover:border-red-500 transition-all font-bold">Reset</div></div>)}</div></div></div>)}
                     {settingsMode === 'RUG' && (<div className="space-y-4"><button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button><h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Select Rug Color</h3><div className="grid grid-cols-3 gap-4">{RK_COLORS.map(c => (<div key={c.name} onClick={() => handleRugChange(c.color)} className={`aspect-square rounded-full cursor-pointer border-2 transition-transform ${user.rugColor === c.color ? 'border-white shadow-[0_0_15px_white] scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c.color }}></div>))}</div><div className="flex items-center gap-4 mt-4 p-4 bg-white/5 rounded-xl"><span className="text-sm text-gray-300">Custom Color:</span><input type="color" value={user.rugColor || '#2e0b49'} onChange={(e) => handleRugChange(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent" /></div></div>)}
                     {settingsMode === 'BGM' && (<div className="space-y-4"><button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button><h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">Upload Custom BGM</h3><div className="border border-dashed border-purple-500/30 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all relative"><input type="file" accept="audio/*" onChange={handleBgmUpload} className="absolute inset-0 opacity-0 cursor-pointer" /><span className="text-2xl mb-2 block">🎵</span><span className="text-xs text-gray-400">Click to upload MP3/WAV</span></div><p className="text-[10px] text-gray-500 mt-2 text-center">Supported: MP3, WAV. Stored locally.</p></div>)}
                     {settingsMode === 'HISTORY' && (
                        <div className="space-y-4">
                            <button onClick={() => setSettingsMode('MAIN')} className="text-xs text-purple-400 mb-2 hover:text-white transition-colors">← Back</button>
                            <h3 className="text-sm font-bold text-purple-100 mb-4 font-serif">{TRANSLATIONS[lang].history}</h3>
                            {(!Array.isArray(user.history) || user.history.length === 0) ? (
                                <p className="text-gray-500 text-xs text-center py-8">{TRANSLATIONS[lang].no_history}</p>
                            ) : (
                                <div className="space-y-3">
                                    {/* Optimization: Limit to 10 items and ensure safe rendering */}
                                    {user.history.slice(0, 10).map((h, i) => (
                                        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                                            <div className="flex justify-between text-[10px] text-purple-300 mb-2">
                                                <span>{new Date(h.date).toLocaleDateString()}</span>
                                                <span className="font-bold bg-purple-900/50 px-2 py-0.5 rounded">{h.type || 'TAROT'}</span>
                                            </div>
                                            <p className="text-xs text-gray-200 font-bold truncate mb-1">{h.question}</p>
                                            {/* Optimization: Hard truncate string instead of relying on expensive CSS line-clamp */}
                                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                                {(h.interpretation || "").length > 100 
                                                    ? (h.interpretation || "").substring(0, 100) + "..." 
                                                    : (h.interpretation || "")}
                                            </p>
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
