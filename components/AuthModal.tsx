
import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../src/lib/supabase";

export function GoogleContinueButton() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
        alert("Backend not configured. Google Login is unavailable.");
        return;
    }

    setLoading(true);

    try {
        const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
        
        // Use root origin as redirect URL to ensure it matches the allowed Redirect URLs in Supabase Dashboard.
        // App.tsx handles the session detection via 'detectSessionInUrl: true'.
        const redirectTo = origin;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          console.error("Google OAuth error:", error.message);
          alert(`로그인 오류: ${error.message}`);
          setLoading(false);
        }
        // Redirect happens automatically if no error
    } catch (e: any) {
        console.error("Login exception:", e);
        alert("로그인 중 오류가 발생했습니다.");
        setLoading(false);
    }
  };

  return (
    <button 
        onClick={signInWithGoogle} 
        disabled={loading}
        className="w-full py-3 bg-white text-black font-bold rounded flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-70 disabled:cursor-wait"
    >
      <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
      {loading ? "Google 로그인 중..." : "Google 계정으로 계속하기"}
    </button>
  );
}
