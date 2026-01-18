
import { useEffect } from "react";
import { supabase } from "../src/lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      try {
          const url = new URL(window.location.href);
          const code = url.searchParams.get("code");

          if (!code) {
            window.location.replace("/");
            return;
          }

          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          window.location.replace("/");
      } catch(e: any) {
          console.error("Auth callback error:", e);
          alert("로그인에 실패했습니다. 다시 시도해주세요.");
          window.location.replace("/");
      }
    })();
  }, []);

  return <div style={{ color: "white", padding: 24, textAlign: 'center', marginTop: '20vh' }}>Signing you in...</div>;
}
