/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export async function hasPremiumThemes(userId: string) {
  const { data: isMasterAdmin, error: roleError } = await supabase.rpc("is_master_admin", {
    _user_id: userId,
  });
  if (!roleError && isMasterAdmin) return true;

  const { data, error } = await db
    .from("theme_purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("product_key", "premium_theme_pack")
    .eq("status", "approved")
    .limit(1);
  if (error) return false;
  return Boolean(data?.length);
}

export async function startPremiumThemePurchase() {
  const { data, error } = await supabase.functions.invoke("create-theme-purchase", { body: {} });
  if (error) throw error;
  if (data?.alreadyUnlocked) return { alreadyUnlocked: true, checkoutUrl: null as string | null };
  if (!data?.checkoutUrl) throw new Error(data?.error ?? "Checkout indisponível no momento.");
  return { alreadyUnlocked: false, checkoutUrl: data.checkoutUrl as string };
}
