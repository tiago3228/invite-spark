# Mercado Pago: pagamento único para temas premium

Esta integração **não usa assinatura recorrente**. O cliente paga uma única vez pelo pacote `premium_theme_pack` e recebe acesso permanente aos temas premium.

## Fluxo implementado

1. O cliente escolhe um tema premium no editor.
2. O frontend chama a Edge Function `create-theme-purchase`.
3. A função cria uma preferência no Mercado Pago via `POST /checkout/preferences`.
4. O cliente é redirecionado para o Checkout Pro.
5. O Checkout Pro oferece os meios disponíveis para a conta, incluindo **cartão e Pix** quando habilitados no Mercado Pago.
6. O Mercado Pago envia um webhook de `payment`.
7. A Edge Function `mercado-pago-webhook` valida `x-signature` com HMAC-SHA256.
8. Somente um pagamento consultado diretamente na API e com status `approved` libera o pacote.
9. O acesso fica registrado em `public.theme_purchases`.

O frontend nunca recebe o Access Token nem libera o tema por retorno de navegador. O retorno é apenas informativo; a liberação depende do webhook confirmado.

## 1. Criar aplicação no Mercado Pago

1. Acesse **Mercado Pago Developers > Suas integrações**.
2. Crie ou selecione uma aplicação para o projeto.
3. Copie o **Access Token** do ambiente de teste inicialmente.
4. Em Webhooks, crie/configure a chave secreta da aplicação e copie o `MERCADOPAGO_WEBHOOK_SECRET`.
5. Habilite o evento **Payments / payment**.

O código usa Checkout Pro e não usa `preapproval`, `preapproval_plan` ou qualquer endpoint de assinatura.

## 2. Executar a migração no Lovable/Supabase

Execute no SQL Editor:

```text
supabase/migrations/20260928150000_mercado_pago_theme_purchases.sql
```

Ela:

- marca `Essência` e `Celebre` como premium;
- cria `theme_purchases`;
- cria RLS para o cliente consultar somente suas compras;
- dá escrita somente ao `service_role`, usado pelo webhook;
- registra preferência, pagamento, status e resposta bruta do Mercado Pago.

## 3. Configurar secrets nas Edge Functions

No painel do Supabase, em **Project Settings > Edge Functions > Secrets**, configure:

```text
MERCADOPAGO_PROD_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...
MERCADOPAGO_PROD_PUBLIC_KEY=APP_USR-...
LOVABLE_API_KEY=...
```

O pacote está configurado com preço fixo de **R$ 59,90**. A função usa o Checkout Pro de produção, que apresenta os meios habilitados na conta Mercado Pago, incluindo Pix quando disponível. A chave Pix informada pode ser usada pela conta para receber pagamentos, mas o desbloqueio automático deve ocorrer pelo pagamento criado no Checkout Pro e confirmado pelo webhook; não libere acesso apenas por alguém copiar uma chave Pix.

Não coloque essas chaves em `.env`, no frontend ou no GitHub.

## 4. Publicar as Edge Functions

A pasta contém:

```text
supabase/functions/create-theme-purchase/index.ts
supabase/functions/mercado-pago-webhook/index.ts
supabase/functions/_shared/mercado-pago.ts
```

Se estiver usando o CLI do Supabase:

```bash
supabase functions deploy create-theme-purchase
supabase functions deploy mercado-pago-webhook --no-verify-jwt
```

A URL pública do webhook será:

```text
https://SEU_PROJECT_REF.supabase.co/functions/v1/mercado-pago-webhook
```

O arquivo `supabase/config.toml` já marca o webhook como `verify_jwt = false`, pois o Mercado Pago não possui sessão Supabase.

## 5. Configurar o webhook no Mercado Pago

No painel da aplicação, informe:

```text
https://SEU_PROJECT_REF.supabase.co/functions/v1/mercado-pago-webhook
```

Selecione o evento de pagamentos (`payment`). A função também envia `notification_url` em cada preferência criada.

A assinatura do webhook é validada com:

```text
x-signature
x-request-id
data.id
```

Se a assinatura não for válida, a função retorna `401` e não altera a compra.

## 6. Teste recomendado

1. Use o Access Token de teste.
2. Faça login no Meu Convite.
3. Abra `/criar`.
4. Tente selecionar `Essência` ou `Celebre`.
5. Clique em **Comprar temas premium**.
6. Conclua o Checkout Pro usando credenciais de teste do Mercado Pago.
7. Verifique a entrega do webhook no painel do Mercado Pago.
8. Consulte `theme_purchases` no Supabase.
9. Confirme que o status virou `approved`.
10. Atualize o editor e verifique que os temas foram liberados.

## Observação sobre Pix

O checkout usado é o Checkout Pro do Mercado Pago. Ele pode apresentar Pix e cartão conforme a conta, ambiente, país e meios habilitados no Mercado Pago. Este fluxo não é Pix manual: o Mercado Pago confirma automaticamente o pagamento por webhook.

Se o produto precisar futuramente de um QR Code Pix próprio dentro do Meu Convite, será necessário criar uma segunda integração com a API de pagamentos Pix do Mercado Pago. Isso não é necessário para o fluxo atual.

## Produção

Antes de trocar para produção:

- testar pagamento aprovado;
- testar pagamento pendente;
- testar pagamento rejeitado;
- validar webhook com assinatura inválida;
- confirmar que somente o status `approved` libera os temas;
- trocar o Access Token de teste pelo token de produção;
- atualizar o preço e `APP_URL` de produção;
- conferir as credenciais e a política de reembolso do negócio.
