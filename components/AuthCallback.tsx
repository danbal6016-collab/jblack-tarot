import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    // OAuth redirect로 돌아오면 Supabase가 URL fragment/code를 처리해서 세션을 잡아줌
    // (최신 supabase-js는 자동 처리되는 경우가 많지만, 안전하게 세션 확인)
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error(error);
      // 로그인 성공 후 원하는 곳으로 이동
      window.location.replace("/");
    })();
  }, []);

  return <div>Signing you in...</div>;
}
