
import { useEffect } from "react";
import { supabase } from "../src/lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      try {
          // 1. Check if Supabase client has already detected a session from the URL (Hash flow)
          // The Supabase client in ../src/lib/supabase.ts is configured with detectSessionInUrl: true
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
              // Session found (likely Implicit flow or persisted session), redirect to home
              window.location.replace("/");
              return;
          }

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

          // 2. Handle PKCE Code Flow
          if (code) {
              const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
              if (sessionError) throw sessionError;
              
              // Successful exchange, redirect to home
              window.location.replace("/");
              return;
          }

          // 3. Fallback for Hash Fragment manual handling if getSession didn't catch it
          // This usually happens if the component mounts before Supabase parses the hash
          if (window.location.hash && window.location.hash.includes('access_token')) {
             // Redirect to root *with* the hash so App.tsx or Supabase client there can catch it
             window.location.replace("/" + window.location.hash);
             return;
          }

          // No auth code or session found, just go home
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
