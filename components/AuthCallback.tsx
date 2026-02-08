
import { useEffect } from "react";
import { supabase } from "../src/lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      try {
          const url = new URL(window.location.href);
          const code = url.searchParams.get("code");
          const error = url.searchParams.get("error");
          const errorDescription = url.searchParams.get("error_description");

          // Handle provider errors (e.g., user cancelled)
          if (error) {
              console.error("Auth callback error from provider:", error, errorDescription);
              alert(`로그인 실패: ${errorDescription || error}`);
              window.location.replace("/");
              return;
          }

          if (!code) {
            // No code found, redirect to home
            window.location.replace("/");
            return;
          }

          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionError) throw sessionError;

          // Successful exchange, redirect to home
          window.location.replace("/");
      } catch(e: any) {
          console.error("Auth callback exception:", e);
          alert("로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
          window.location.replace("/");
      }
    })();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-sans text-lg">로그인 처리 중...</p>
    </div>
  );
}
