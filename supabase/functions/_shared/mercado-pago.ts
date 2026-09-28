export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function mercadoPagoRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${env("MERCADO_PAGO_ACCESS_TOKEN")}`);
  headers.set("Content-Type", "application/json");
  return fetch(`https://api.mercadopago.com${path}`, { ...init, headers });
}

export async function verifyMercadoPagoSignature(request: Request, dataId: string) {
  const secret = env("MERCADO_PAGO_WEBHOOK_SECRET");
  const xSignature = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(xSignature.split(",").map((part) => part.trim().split("=")));
  const timestamp = parts.ts;
  const received = parts.v1;
  if (!timestamp || !received || !requestId || !dataId) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return expected === received;
}
