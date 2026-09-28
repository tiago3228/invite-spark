import { supabase } from "@/integrations/supabase/client";

export { supabase };

export const isSupabaseConfigured = Boolean(
  import.meta.env["VITE_SUPABASE_URL"] && import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
);

export function getSupabaseSetupMessage() {
  return "Conecte o projeto a um projeto Supabase no Lovable Cloud para ativar este recurso.";
}
