
import { supabase, isSupabaseConfigured } from "../src/lib/supabase";

export function GoogleContinueButton() {
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
        alert("Backend not configured. Google Login is unavailable.");
        return;
    }

    // Use window.location.origin to redirect to the root of the site.
    // We avoid /auth/callback because without proper server-side rewrite rules (e.g. vercel.json),
    // visiting /auth/callback directly results in a 404 error from the hosting provider.
    // The Supabase client in App.tsx (initialized in src/lib/supabase.ts) is configured with 
    // detectSessionInUrl: true, so it will automatically handle the hash/code on the root path.
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
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
    }
  };

  return (
    <button onClick={signInWithGoogle} className="w-full py-3 bg-white text-black font-bold rounded flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
      <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
      Google 계정으로 계속하기
    </button>
  );
}
