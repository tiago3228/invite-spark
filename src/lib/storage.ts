import { supabase } from "@/integrations/supabase/client";

export const INVITATION_MEDIA_BUCKET = "invitation-media";
export type UploadKind = "cover" | "image" | "video" | "audio";

const limits: Record<UploadKind, { maxBytes: number; mime: string[] }> = {
  cover: { maxBytes: 8 * 1024 * 1024, mime: ["image/jpeg", "image/png", "image/webp"] },
  image: {
    maxBytes: 8 * 1024 * 1024,
    mime: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  video: { maxBytes: 15 * 1024 * 1024, mime: ["video/mp4", "video/webm"] },
  audio: { maxBytes: 15 * 1024 * 1024, mime: ["audio/mpeg", "audio/ogg", "audio/wav"] },
};

function extension(file: File) {
  const fromName = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName;
  return file.type.split("/")[1]?.replace("jpeg", "jpg") || "bin";
}

export function validateInvitationFile(file: File, kind: UploadKind) {
  const rule = limits[kind];
  if (!rule.mime.includes(file.type))
    throw new Error(
      `Formato não suportado para ${kind === "audio" ? "áudio" : kind === "video" ? "vídeo" : "imagem"}.`,
    );
  if (file.size > rule.maxBytes)
    throw new Error(`O arquivo excede o limite de ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`);
}

export async function uploadInvitationFile(
  file: File,
  userId: string,
  invitationId: string,
  kind: UploadKind,
) {
  validateInvitationFile(file, kind);
  const path = `${userId}/${invitationId}/${kind}/${crypto.randomUUID()}.${extension(file)}`;
  const { error } = await supabase.storage
    .from(INVITATION_MEDIA_BUCKET)
    .upload(path, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(INVITATION_MEDIA_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function removeInvitationFile(publicUrl: string) {
  const marker = `/object/public/${INVITATION_MEDIA_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(publicUrl.slice(index + marker.length));
  const { error } = await supabase.storage.from(INVITATION_MEDIA_BUCKET).remove([path]);
  if (error) throw error;
}
