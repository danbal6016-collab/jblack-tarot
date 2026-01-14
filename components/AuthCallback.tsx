import { useEffect } from "react";
import { supabase } from "../src/lib/supabase";


export default function AuthCallback() {
  useEffect(() => {
    // URL의 code를 세션으로 교환
    supabase.auth.exchangeCodeForSession(window.location.href)
      .then(() => {
        // 세션 생기면 홈으로 보내기
        window.location.replace("/");
      })
      .catch(() => {
        window.location.replace("/");
      });
  }, []);

  return (
    <div style={{ color: "white", padding: 24 }}>
      Signing you in...
    </div>
  );
}
