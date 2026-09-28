/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

export type RSVPMode = "native" | "google_forms" | "whatsapp" | "none";

export type InvitationDraft = {
  id?: string;
  userId?: string;
  eventType: string;
  customEventType: string;
  title: string;
  phrase: string;
  description: string;
  eventDate: string;
  eventTime: string;
  eventEndTime: string;
  dressCode: string;
  venueName: string;
  address: string;
  mapsUrl: string;
  locationNotes: string;
  coverUrl: string;
  galleryUrls: string[];
  videoUrl: string;
  audioUrl: string;
  themeName: string;
  rsvpMode: RSVPMode;
  rsvpWhatsapp: string;
  rsvpMessage: string;
  googleFormsUrl: string;
  showCountdown: boolean;
  status?: string;
};

export const emptyDraft: InvitationDraft = {
  eventType: "",
  customEventType: "",
  title: "",
  phrase: "",
  description: "",
  eventDate: "",
  eventTime: "",
  eventEndTime: "",
  dressCode: "",
  venueName: "",
  address: "",
  mapsUrl: "",
  locationNotes: "",
  coverUrl: "",
  galleryUrls: [],
  videoUrl: "",
  audioUrl: "",
  themeName: "Jardim",
  rsvpMode: "native",
  rsvpWhatsapp: "",
  rsvpMessage: "Olá! Sou [NOME] e gostaria de confirmar minha presença.",
  googleFormsUrl: "",
  showCountdown: true,
};

const db = supabase as any;

function toRow(draft: InvitationDraft, userId: string) {
  return {
    user_id: userId,
    event_type: draft.eventType || "Outro",
    custom_event_type: draft.customEventType || null,
    title: draft.title || null,
    theme_id: null,
    event_date: draft.eventDate || null,
    event_time: draft.eventTime || null,
    event_end_time: draft.eventEndTime || null,
    status: draft.status ?? "draft",
    content: {
      phrase: draft.phrase,
      description: draft.description,
      dressCode: draft.dressCode,
      media: {
        coverUrl: draft.coverUrl,
        galleryUrls: draft.galleryUrls,
        videoUrl: draft.videoUrl,
        audioUrl: draft.audioUrl,
      },
      countdown: draft.showCountdown,
    },
    location: {
      venueName: draft.venueName,
      address: draft.address,
      mapsUrl: draft.mapsUrl,
      notes: draft.locationNotes,
    },
    rsvp_config: {
      mode: draft.rsvpMode,
      whatsapp: draft.rsvpWhatsapp,
      message: draft.rsvpMessage,
      googleFormsUrl: draft.googleFormsUrl,
    },
  };
}

export async function createInvitationDraft(draft: InvitationDraft, userId: string) {
  const { data, error } = await db
    .from("invitations")
    .insert(toRow(draft, userId))
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function saveInvitationDraft(draft: InvitationDraft, userId: string) {
  if (!draft.id) return createInvitationDraft(draft, userId);
  const { error } = await db
    .from("invitations")
    .update(toRow(draft, userId))
    .eq("id", draft.id)
    .eq("user_id", userId);
  if (error) throw error;
  return draft.id;
}

export async function loadInvitation(id: string, userId: string): Promise<InvitationDraft | null> {
  const { data, error } = await db
    .from("invitations")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const content = (data.content ?? {}) as Record<string, any>;
  const location = (data.location ?? {}) as Record<string, any>;
  const rsvp = (data.rsvp_config ?? {}) as Record<string, any>;
  const media = (content["media"] ?? {}) as Record<string, any>;
  return {
    ...emptyDraft,
    id: data.id,
    userId: data.user_id,
    eventType: data.event_type ?? "",
    customEventType: data.custom_event_type ?? "",
    title: data.title ?? "",
    eventDate: data.event_date ?? "",
    eventTime: data.event_time ?? "",
    eventEndTime: data.event_end_time ?? "",
    themeName: "Jardim",
    phrase: content["phrase"] ?? "",
    description: content["description"] ?? "",
    dressCode: content["dressCode"] ?? "",
    showCountdown: content["countdown"] !== false,
    coverUrl: media["coverUrl"] ?? "",
    galleryUrls: Array.isArray(media["galleryUrls"]) ? media["galleryUrls"] : [],
    videoUrl: media["videoUrl"] ?? "",
    audioUrl: media["audioUrl"] ?? "",
    venueName: location["venueName"] ?? "",
    address: location["address"] ?? "",
    mapsUrl: location["mapsUrl"] ?? "",
    locationNotes: location["notes"] ?? "",
    rsvpMode: rsvp["mode"] ?? "native",
    rsvpWhatsapp: rsvp["whatsapp"] ?? "",
    rsvpMessage: rsvp["message"] ?? emptyDraft.rsvpMessage,
    googleFormsUrl: rsvp["googleFormsUrl"] ?? "",
    status: data.status,
  };
}
