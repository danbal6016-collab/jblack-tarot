import { useEffect } from "react";
import { supabase } from "../src/lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (!code) {
        window.location.replace("/");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) alert(error.message);

      window.location.replace("/");
    })();
  }, []);

  return <div style={{ color: "white", padding: 24 }}>Signing you in...</div>;
}