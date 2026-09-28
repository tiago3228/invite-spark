# Assistente de textos com AI Gateway

O editor do Meu Convite possui o botão **Criar com IA** no Passo 2 · Conteúdo. Ele gera um título, uma frase de abertura e uma mensagem especial com base no evento, nome, estilo, data e local informados.

## Fluxo

1. O organizador informa os dados do evento e, opcionalmente, o nome da aniversariante.
2. O frontend chama a Edge Function `generate-invitation-copy`.
3. A função valida a sessão do Supabase.
4. A função chama o AI Gateway no servidor, sem expor a chave ao navegador.
5. O resultado é aplicado aos campos editáveis do convite.
6. O organizador pode revisar e alterar o texto antes do salvamento automático.

## Secrets da Edge Function

No Supabase, em **Project Settings → Edge Functions → Secrets**, configure:

```text
LOVABLE_API_KEY=...
AI_GATEWAY_URL=https://ai.gateway.lovable.dev/v1/chat/completions
AI_GATEWAY_MODEL=google/gemini-2.5-flash
```

`AI_GATEWAY_URL` e `AI_GATEWAY_MODEL` são opcionais porque possuem valores padrão. Nunca coloque `LOVABLE_API_KEY` no frontend ou no GitHub.

## Deploy

Depois de configurar os secrets, publique a função:

```bash
supabase functions deploy generate-invitation-copy
```

O projeto já contém:

```text
supabase/functions/generate-invitation-copy/index.ts
src/lib/ai-copy.ts
```

## Segurança e comportamento

- A chamada exige usuário autenticado;
- O prompt limita o tamanho dos campos enviados;
- A IA não deve inventar data, local ou informações não fornecidas;
- O retorno usa JSON estruturado com `title`, `phrase` e `message`;
- O texto gerado não é publicado automaticamente: o organizador sempre pode revisar;
- Os dados são salvos pelo autosave normal do convite.
