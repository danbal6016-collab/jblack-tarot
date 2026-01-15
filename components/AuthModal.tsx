import { supabase } from "../src/lib/supabase";

export function GoogleContinueButton() {
  const signInWithGoogle = async () => {
    // Safe env access for site URL
    let siteUrl = window.location.origin;
    try {
        // @ts-ignore
        if (typeof process !== "undefined" && process.env && process.env.VITE_SITE_URL) {
            siteUrl = process.env.VITE_SITE_URL;
        // @ts-ignore
        } else if (import.meta && import.meta.env && import.meta.env.VITE_SITE_URL) {
            // @ts-ignore
            siteUrl = import.meta.env.VITE_SITE_URL;
        }
    } catch(e) {}

    const redirectTo = `${siteUrl}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error("Google OAuth error:", error.message);
      alert(error.message);
    }
  };

  return (
    <button onClick={signInWithGoogle} className="w-full py-3 bg-white text-black font-bold rounded flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
      Google 계정으로 계속하기
    </button>
  );
}