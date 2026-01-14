import { supabase } from "../lib/supabase";

export function GoogleContinueButton() {
  const signInWithGoogle = async () => {
    const redirectTo = `${import.meta.env.VITE_SITE_URL}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        // 필요하면 scope 추가 가능:
        // scopes: "email profile",
        // queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (error) {
      console.error("Google OAuth error:", error.message);
      alert(error.message);
    }
  };

  return (
    <button onClick={signInWithGoogle}>
      Google 계정으로 계속하기
    </button>
  );
}
