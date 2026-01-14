import { useEffect } from "react";
import { supabase } from "../src/lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        // code가 없으면 그냥 홈으로
        window.location.replace("/");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        alert(error.message);
      }

      // 세션 교환 완료 후 홈으로
      window.location.replace("/");
    })();
  }, []);

  return (
    <div style={{ color: "white", padding: 24 }}>
      Signing you in...
    </div>
  );
}
