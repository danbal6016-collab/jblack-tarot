import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 상태 관리: 비밀번호 찾기 링크 표시 여부 & 에러 메시지
  const [showResetLink, setShowResetLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. 로그인 함수
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    // Supabase 로그인 요청
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("로그인 에러:", error.message);
      
      // Supabase는 보안상 'Invalid login credentials'라는 뭉뚱그린 에러를 줍니다.
      // 로그인 실패 시 무조건 비밀번호 찾기를 띄우거나, 에러 메시지를 확인해서 띄웁니다.
      setErrorMessage("아이디 또는 비밀번호가 잘못되었습니다.");
      setShowResetLink(true); // 🔥 여기서 비밀번호 찾기 버튼을 활성화!
    } else {
      console.log("로그인 성공!");
      // 로그인 성공 후 페이지 이동 로직 (예: window.location.href = '/')
      alert("로그인 되었습니다!");
    }
    setLoading(false);
  };

  // 2. 비밀번호 재설정 메일 발송 함수
  const handlePasswordReset = async () => {
    if (!email) {
      alert("이메일을 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password', // (선택) 비밀번호 변경 페이지 URL
      });

      if (error) throw error;

      alert(`${email}로 비밀번호 재설정 링크를 보냈습니다! 메일함을 확인해주세요.`);
      setShowResetLink(false); // 다시 숨김
    } catch (error: any) {
      console.error(error);
      alert("메일 전송 실패: 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>로그인</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="이메일" 
          required 
          style={{ padding: '10px' }}
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="비밀번호" 
          required 
          style={{ padding: '10px' }}
        />
        
        <button type="submit" disabled={loading} style={{ padding: '10px', cursor: 'pointer' }}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      {/* 에러 메시지 */}
      {errorMessage && <p style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</p>}

      {/* 🔥 여기가 핵심: 틀렸을 때만 나오는 비밀번호 찾기 UI */}
      {showResetLink && (
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>
            비밀번호를 잊어버리셨습니까?
          </p>
          <button 
            type="button" 
            onClick={handlePasswordReset}
            style={{ 
              fontSize: '13px', 
              cursor: 'pointer', 
              color: '#0070f3', 
              textDecoration: 'underline', 
              background: 'none', 
              border: 'none',
              padding: 0
            }}
          >
            비밀번호 재설정 메일 보내기
          </button>
        </div>
      )}
    </div>
  );
};

export default LoginForm;