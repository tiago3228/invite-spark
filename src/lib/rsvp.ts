/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
export type RsvpStatus = "confirmed" | "declined" | "pending";
export type Rsvp = {
  id: string;
  invitation_id: string;
  guest_name: string;
  whatsapp: string;
  status: RsvpStatus;
  companions: number;
  note: string | null;
  created_at: string;
};

export async function findPublishedInvitation(slug: string) {
  const { data, error } = await db
    .from("invitations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("INVITATION_NOT_FOUND");
  return data;
}

export async function submitRsvp(input: {
  invitationId: string;
  guestName: string;
  whatsapp: string;
  status: RsvpStatus;
  companions: number;
  note: string;
}) {
  const { data, error } = await db.rpc("submit_guest_response", {
    _invitation_id: input.invitationId,
    _name: input.guestName.trim(),
    _whatsapp: input.whatsapp.replace(/\D/g, ""),
    _status: input.status,
    _companions: input.companions,
  });
  if (error) throw error;
  if (!data) throw new Error("Não foi possível registrar sua resposta.");
}

export async function listOwnRsvps(invitationId: string, userId: string): Promise<Rsvp[]> {
  const { data: invitation, error: invitationError } = await db
    .from("invitations")
    .select("id")
    .eq("id", invitationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (invitationError) throw invitationError;
  if (!invitation) return [];
  const { data, error } = await db
    .from("guests")
    .select("id, invitation_id, name, whatsapp, status, companions, created_at, responded_at")
    .eq("invitation_id", invitationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((guest: any) => ({
    id: guest.id,
    invitation_id: guest.invitation_id,
    guest_name: guest.name,
    whatsapp: guest.whatsapp ?? "",
    status: guest.status,
    companions: guest.companions ?? 0,
    note: null,
    created_at: guest.responded_at ?? guest.created_at,
  })) as Rsvp[];
}
