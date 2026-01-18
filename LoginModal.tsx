import React, { useState } from 'react';
import { supabase } from './supabaseClient'; // 위에서 만든 파일 import

export default function LoginModal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // '비밀번호 찾기' 모드인지 확인하는 상태
  const [isResetMode, setIsResetMode] = useState(false);

  // 1. 로그인 처리 함수
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      alert("운명의 문이 열렸습니다. (로그인 성공)");
      // 여기서 페이지 이동이나 모달 닫기 처리
      // window.location.href = '/dashboard'; 

    } catch (error: any) {
      // 에러 발생 시 메시지 설정
      setErrorMsg("영혼의 주파수가 일치하지 않습니다. (이메일/비번 확인)");
    } finally {
      setLoading(false);
    }
  };

  // 2. 비밀번호 재설정 메일 발송 함수
  const handleResetPassword = async () => {
    if (!email) {
      setErrorMsg("이메일을 먼저 입력해주십시오.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/update-password', // 비번 변경 페이지 URL
      });

      if (error) throw error;

      alert("입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다.");
      setIsResetMode(false); // 다시 로그인 모드로 복귀

    } catch (error: any) {
      setErrorMsg("메일 전송에 실패했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-8 rounded-xl border border-yellow-600/50 bg-[#0f0826] shadow-[0_0_40px_rgba(250,204,21,0.2)]">
        
        {/* 제목: 모드에 따라 변경 */}
        <h2 className="text-3xl font-bold text-center mb-8 font-serif text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-800" style={{ fontFamily: 'Cinzel' }}>
          {isResetMode ? "Reset Password" : "Login"}
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded bg-black/50 border border-purple-900 text-purple-100 placeholder-purple-700 focus:outline-none focus:border-yellow-500 transition-colors"
          />
          
          {/* 로그인 모드일 때만 비밀번호 입력창 표시 */}
          {!isResetMode && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 rounded bg-black/50 border border-purple-900 text-purple-100 placeholder-purple-700 focus:outline-none focus:border-yellow-500 transition-colors"
            />
          )}
          
          {/* 버튼: 모드에 따라 기능 분기 */}
          {!isResetMode ? (
            <button 
              type="submit"
              disabled={loading}
              className="mt-2 py-3 px-6 rounded border border-yellow-600 bg-gradient-to-b from-yellow-900/40 to-black hover:brightness-125 text-yellow-500 font-bold uppercase tracking-widest transition-all disabled:opacity-50"
              style={{ fontFamily: 'Cinzel' }}
            >
              {loading ? "Connecting..." : "Enter"}
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleResetPassword}
              disabled={loading}
              className="mt-2 py-3 px-6 rounded border border-yellow-600 bg-gradient-to-b from-yellow-900/40 to-black hover:brightness-125 text-yellow-500 font-bold uppercase tracking-widest transition-all disabled:opacity-50"
              style={{ fontFamily: 'Cinzel' }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          )}
        </form>

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="mt-6 text-center animate-pulse">
            <p className="text-red-400 text-sm mb-2">{errorMsg}</p>
            
            {/* 로그인 실패 시에만 '비밀번호 찾기' 링크 노출 */}
            {!isResetMode && (
              <button 
                onClick={() => setIsResetMode(true)}
                className="text-yellow-500 underline underline-offset-4 text-sm hover:text-yellow-200 bg-transparent border-none cursor-pointer"
              >
                비밀번호를 잃어버리셨습니까?
              </button>
            )}
          </div>
        )}

        {/* 리셋 모드일 때 '취소' 버튼 */}
        {isResetMode && (
          <div className="mt-4 text-center">
            <button 
              onClick={() => { setIsResetMode(false); setErrorMsg(null); }}
              className="text-purple-400 text-sm hover:text-purple-200"
            >
              로그인으로 돌아가기
            </button>
          </div>
        )}

      </div>
    </div>
  );
}