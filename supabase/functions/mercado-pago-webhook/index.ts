import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { env, mercadoPagoRequest, verifyMercadoPagoSignature } from "../_shared/mercado-pago.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("ok", { status: 200 });
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const dataId = String(
      body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "",
    );
    if (!dataId || !(await verifyMercadoPagoSignature(request, dataId)))
      return new Response("invalid signature", { status: 401 });

    const eventType = String(body.type ?? body.topic ?? "");
    if (eventType !== "payment") return new Response("ok", { status: 200 });

    const paymentResponse = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(dataId)}`);
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok) return new Response("payment lookup failed", { status: 502 });
    const metadata = payment.metadata ?? {};
    const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    const purchaseId = metadata.purchase_id;
    const externalReference = String(payment.external_reference ?? "");
    let query = admin.from("theme_purchases").select("id").limit(1);
    if (purchaseId) query = query.eq("id", purchaseId);
    else if (externalReference.startsWith("theme-pack:"))
      query = query
        .eq("user_id", externalReference.split(":")[1])
        .eq("product_key", "premium_theme_pack")
        .eq("status", "pending");
    else return new Response("ok", { status: 200 });
    const { data: purchases } = await query;
    const purchase = purchases?.[0];
    if (!purchase) return new Response("ok", { status: 200 });

    const status =
      payment.status === "approved"
        ? "approved"
        : payment.status === "rejected"
          ? "rejected"
          : payment.status === "cancelled"
            ? "cancelled"
            : "pending";
    await admin
      .from("theme_purchases")
      .update({
        payment_id: String(payment.id),
        status,
        paid_at: status === "approved" ? (payment.date_approved ?? new Date().toISOString()) : null,
        raw_data: payment,
      })
      .eq("id", purchase.id);
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("mercado-pago-webhook", error);
    return new Response("webhook processing failed", { status: 500 });
  }
});
