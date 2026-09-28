import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, env, json, mercadoPagoRequest } from "../_shared/mercado-pago.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Authentication required" }, 401);
    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Authentication required" }, 401);

    const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    const { data: masterRole } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (masterRole) return json({ alreadyUnlocked: true, checkoutUrl: null, masterAdmin: true });

    const { data: existing } = await admin
      .from("theme_purchases")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("product_key", "premium_theme_pack")
      .eq("status", "approved")
      .maybeSingle();
    if (existing) return json({ alreadyUnlocked: true, checkoutUrl: null });

    const amount = Number(env("PREMIUM_THEMES_PRICE_BRL"));
    if (!Number.isFinite(amount) || amount <= 0)
      return json({ error: "PREMIUM_THEMES_PRICE_BRL inválido." }, 500);
    const origin = request.headers.get("origin") || env("APP_URL");
    const reference = `theme-pack:${user.id}:${crypto.randomUUID()}`;
    const { data: purchase, error: purchaseError } = await admin
      .from("theme_purchases")
      .insert({
        user_id: user.id,
        product_key: "premium_theme_pack",
        amount,
        currency: "BRL",
        status: "pending",
      })
      .select("id")
      .single();
    if (purchaseError) throw purchaseError;

    const response = await mercadoPagoRequest("/checkout/preferences", {
      method: "POST",
      headers: { "X-Idempotency-Key": purchase.id },
      body: JSON.stringify({
        items: [
          {
            id: "premium_theme_pack",
            title: "Pacote de temas premium — Meu Convite",
            description: "Liberação permanente dos temas premium",
            quantity: 1,
            currency_id: "BRL",
            unit_price: amount,
          },
        ],
        payer: user.email ? { email: user.email } : undefined,
        external_reference: reference,
        back_urls: {
          success: `${origin}/painel?payment=success`,
          failure: `${origin}/painel?payment=failure`,
          pending: `${origin}/painel?payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${env("APP_URL")}/functions/v1/mercado-pago-webhook`,
        metadata: { purchase_id: purchase.id, user_id: user.id, product_key: "premium_theme_pack" },
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      await admin
        .from("theme_purchases")
        .update({ status: "rejected", raw_data: result })
        .eq("id", purchase.id);
      return json(
        { error: "Mercado Pago recusou a criação do checkout.", details: result },
        response.status,
      );
    }
    await admin
      .from("theme_purchases")
      .update({ preference_id: result.id, raw_data: result })
      .eq("id", purchase.id);
    const checkoutUrl =
      Deno.env.get("MERCADO_PAGO_ENVIRONMENT") === "test"
        ? (result.sandbox_init_point ?? result.init_point)
        : result.init_point;
    return json({
      alreadyUnlocked: false,
      checkoutUrl,
      sandboxCheckoutUrl: result.sandbox_init_point,
      purchaseId: purchase.id,
    });
  } catch (error) {
    console.error("create-theme-purchase", error);
    return json(
      { error: error instanceof Error ? error.message : "Não foi possível iniciar o pagamento." },
      500,
    );
  }
});
