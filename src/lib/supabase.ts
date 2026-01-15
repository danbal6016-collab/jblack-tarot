// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const getEnv = (key: string) => {
  // Check process.env first (often used in these environments)
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  // Check import.meta.env (Vite standard)
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore
  }
  return undefined;
};

const supabaseUrl = getEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY");

// Fallback to avoid crash if env vars are missing (though auth won't work)
const safeUrl = supabaseUrl || "https://placeholder.supabase.co";
const safeKey = supabaseAnonKey || "placeholder";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing.");
}

export const supabase = createClient(safeUrl, safeKey);