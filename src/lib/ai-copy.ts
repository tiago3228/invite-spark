import { supabase } from "@/integrations/supabase/client";

export type InvitationCopyInput = {
  eventType: string;
  name: string;
  style: string;
  animationStyle: string;
  eventDate: string;
  venueName: string;
  tone?: string;
};

export type InvitationCopy = {
  title: string;
  phrase: string;
  message: string;
};

export async function generateInvitationCopy(input: InvitationCopyInput): Promise<InvitationCopy> {
  const { data, error } = await supabase.functions.invoke("generate-invitation-copy", {
    body: input,
  });
  if (error) throw new Error(error.message || "Não foi possível gerar o texto.");
  if (!data?.copy) throw new Error(data?.error || "A IA não retornou um texto válido.");
  return data.copy as InvitationCopy;
}
