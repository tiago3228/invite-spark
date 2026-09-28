/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
export type RsvpStatus = "confirmed" | "declined" | "pending";
export type Rsvp = {
  id: string;
  invitation_id: string;
  guest_name: string;
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
  status: RsvpStatus;
  companions: number;
  note: string;
}) {
  const { error } = await db.from("rsvps").insert({
    invitation_id: input.invitationId,
    guest_name: input.guestName.trim(),
    status: input.status,
    companions: input.companions,
    note: input.note.trim() || null,
  });
  if (error) throw error;
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
    .from("rsvps")
    .select("id, invitation_id, guest_name, status, companions, note, created_at")
    .eq("invitation_id", invitationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Rsvp[];
}
