import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Secret ${name} não configurado.`);
  return value;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Authentication required" }, 401);
    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return json({ error: "Authentication required" }, 401);

    const input = await request.json();
    const eventType = String(input.eventType || "celebração").slice(0, 80);
    const name = String(input.name || "").slice(0, 100);
    const style = String(input.style || "elegante").slice(0, 80);
    const animationStyle = String(input.animationStyle || "envelope").slice(0, 80);
    const eventDate = String(input.eventDate || "").slice(0, 30);
    const venueName = String(input.venueName || "").slice(0, 120);
    const tone = String(input.tone || "emocionante e acolhedor").slice(0, 80);

    const gatewayUrl =
      Deno.env.get("AI_GATEWAY_URL") || "https://ai.gateway.lovable.dev/v1/chat/completions";
    const model = Deno.env.get("AI_GATEWAY_MODEL") || "google/gemini-2.5-flash";
    const gatewayResponse = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        messages: [
          {
            role: "system",
            content:
              "Você é um redator brasileiro especialista em convites digitais premium. Gere textos originais, afetivos e curtos em português do Brasil. Nunca invente data, local ou detalhes não informados. Retorne apenas JSON válido.",
          },
          {
            role: "user",
            content: `Crie o texto de um convite digital com estes dados:\nTipo de evento: ${eventType}\nNome principal: ${name || "não informado"}\nEstilo visual: ${style}\nAbertura: ${animationStyle}\nData: ${eventDate || "não informada"}\nLocal: ${venueName || "não informado"}\nTom: ${tone}\n\nRetorne exatamente um objeto com title (até 60 caracteres), phrase (até 80 caracteres) e message (até 240 caracteres). O title deve valorizar o nome quando informado. A phrase deve ser memorável. A message deve convidar com carinho e não repetir dados ausentes.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "invitation_copy",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                phrase: { type: "string" },
                message: { type: "string" },
              },
              required: ["title", "phrase", "message"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    const result = await gatewayResponse.json();
    if (!gatewayResponse.ok) {
      console.error("AI Gateway error", result);
      return json(
        { error: "O AI Gateway não conseguiu gerar o texto agora." },
        gatewayResponse.status,
      );
    }
    const content = result?.choices?.[0]?.message?.content;
    const copy = typeof content === "string" ? JSON.parse(content) : content;
    if (!copy?.title || !copy?.phrase || !copy?.message) {
      return json({ error: "A resposta da IA veio incompleta." }, 502);
    }
    return json({ copy });
  } catch (error) {
    console.error("generate-invitation-copy", error);
    return json(
      { error: error instanceof Error ? error.message : "Não foi possível gerar o texto." },
      500,
    );
  }
});
