/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Check, Clock, Heart, MapPin, MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import introVideo from "@/assets/quinze-intro.mp4.asset.json";
import ceciliaFinalArt from "@/assets/cecilia-final.jpeg";

const db = supabase as any;
const CECILIA_UPLOADED_AUDIO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663957888440/ahknbJwbQtzvQXtv.mp3";
type Guest = {
  id: string;
  name: string;
  whatsapp: string;
  status: string;
  companions: number;
  party_limit: number;
} | null;

export function QuinzeInvite({
  invitation,
  token,
}: {
  invitation: any;
  token?: string | undefined;
}) {
  const content = (invitation.content ?? {}) as Record<string, any>;
  const location = (invitation.location ?? {}) as Record<string, any>;
  const name = invitation.title || "Aniversariante";
  const rsvp = (invitation.rsvp_config ?? {}) as Record<string, any>;
  const whatsappNumber = String(rsvp["whatsapp"] || "").replace(/\D/g, "");
  const whatsappMessage = String(rsvp["message"] || "Olá! Gostaria de confirmar minha presença.")
    .replaceAll("[NOME]", "")
    .replaceAll("[EVENTO]", String(invitation.title || invitation.event_type || "seu evento"))
    .replaceAll("[DATA]", invitation.event_date || "");
  const whatsappUrl =
    rsvp["mode"] === "whatsapp" && whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage.trim())}`
      : "";
  const videoUrl = content["media"]?.["videoUrl"] || introVideo.url;
  const audioUrl =
    content["media"]?.["audioUrl"] ||
    (invitation.slug === "cecilia-15-anos" ? CECILIA_UPLOADED_AUDIO_URL : "");
  const [stage, setStage] = useState<"intro" | "card">("intro");
  const [introStarted, setIntroStarted] = useState(false);
  const [guest, setGuest] = useState<Guest>(null);
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  function startIntro() {
    if (introStarted) return;
    setIntroStarted(true);
    void audioRef.current?.play().catch(() => undefined);
    window.requestAnimationFrame(() => void videoRef.current?.play().catch(() => undefined));
  }

  useEffect(() => {
    if (stage === "card") void audioRef.current?.play().catch(() => undefined);
  }, [audioUrl, stage]);

  useEffect(() => {
    if (!token) return;
    void db.rpc("get_guest_by_token", { _token: token }).then(({ data }: any) => {
      const g = data?.[0];
      if (g) {
        setGuest(g);
        setMemberNames([g.name]);
      }
    });
  }, [token]);

  const date = invitation.event_date ? new Date(`${invitation.event_date}T00:00:00`) : null;
  const time = invitation.event_time ? String(invitation.event_time).slice(0, 5) : "";

  async function respond(status: "confirmed" | "declined") {
    if (!token) return;
    if (status === "confirmed" && memberNames.filter((value) => value.trim()).length === 0) {
      setMsg("Informe pelo menos um nome para confirmar a presença.");
      return;
    }
    setBusy(true);
    const { data, error } = await db.rpc("respond_guest", {
      _token: token,
      _status: status,
      _companions: status === "confirmed" ? Math.max(0, memberNames.length - 1) : 0,
      _member_names: status === "confirmed" ? memberNames : [],
      _whatsapp: guest?.whatsapp ?? "",
    });
    setBusy(false);
    setAsking(false);
    if (error || !data) return setMsg("Não foi possível registrar sua resposta. Tente novamente.");
    setGuest((g) => (g ? { ...g, status } : g));
    setMsg(
      status === "confirmed"
        ? "Presença confirmada! Mal podemos esperar para te ver. 💖"
        : "Obrigado por avisar! Sentiremos sua falta.",
    );
  }

  if (stage === "intro")
    return (
      <>
        {audioUrl && <audio ref={audioRef} src={audioUrl} loop preload="auto" />}
        <div className="quinze-theme fixed inset-0 z-50 flex items-center justify-center bg-[var(--q-deep)]">
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay={introStarted}
            muted
            playsInline
            onEnded={() => setStage("card")}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-transparent to-[var(--q-deep)]/60">
            <h1 className="quinze-script quinze-rise text-7xl text-[var(--q-paper)] drop-shadow-lg sm:text-8xl">
              {name}
            </h1>
            <p className="quinze-rise-late mt-2 font-serif text-2xl text-[var(--q-paper)] drop-shadow">
              {content["age"] || "15"} anos
            </p>
          </div>
          {!introStarted && (
            <button
              onClick={startIntro}
              className="absolute bottom-10 rounded-full bg-[var(--q-deep)] px-7 py-3 text-sm font-semibold uppercase tracking-widest text-[var(--q-paper)] shadow-xl"
            >
              ABRA SEU CONVITE
            </button>
          )}
        </div>
      </>
    );

  return (
    <>
      {audioUrl && <audio ref={audioRef} src={audioUrl} loop preload="auto" />}
      <main className="min-h-screen bg-[#f7c4dc]">
        <div className="relative mx-auto w-full max-w-[1024px]">
          <img
            src={ceciliaFinalArt}
            alt="Convite de 15 anos da Cecília"
            className="block h-auto w-full"
          />
          <div className="absolute inset-0">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Presença confirmada pelo WhatsApp"
                className="absolute left-[15%] top-[75%] h-[7.2%] w-[36%] rounded-[18px] focus:outline-none focus:ring-4 focus:ring-white/80"
              />
            ) : token && guest ? (
              <button
                disabled={busy}
                onClick={() => setAsking(true)}
                aria-label="Presença confirmada"
                className="absolute left-[15%] top-[75%] h-[7.2%] w-[36%] rounded-[18px] focus:outline-none focus:ring-4 focus:ring-white/80"
              />
            ) : (
              <Link
                to="/convite/$slug/confirmar"
                params={{ slug: invitation.slug }}
                search={{ status: "confirmed" }}
                aria-label="Presença confirmada"
                className="absolute left-[15%] top-[75%] h-[7.2%] w-[36%] rounded-[18px] focus:outline-none focus:ring-4 focus:ring-white/80"
              />
            )}
            {location["mapsUrl"] && (
              <a
                href={location["mapsUrl"]}
                target="_blank"
                rel="noreferrer"
                aria-label="Ver mapa do local"
                className="absolute left-[52.8%] top-[75%] h-[7.2%] w-[33%] rounded-[18px] focus:outline-none focus:ring-4 focus:ring-white/80"
              />
            )}
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[1024px] flex-col items-center gap-3 px-5 pb-8 pt-4">
          {token && guest ? (
            <button
              disabled={busy}
              onClick={() => respond("declined")}
              className="w-full max-w-sm rounded-full bg-[#8e145b] px-3 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-[#76104e] focus:outline-none focus:ring-4 focus:ring-white/80 sm:text-sm"
            >
              Não poderei comparecer
            </button>
          ) : (
            <Link
              to="/convite/$slug/confirmar"
              params={{ slug: invitation.slug }}
              search={{ status: "declined" }}
              className="flex w-full max-w-sm items-center justify-center rounded-full bg-[#8e145b] px-3 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-[#76104e] focus:outline-none focus:ring-4 focus:ring-white/80 sm:text-sm"
            >
              Não poderei comparecer
            </Link>
          )}
          {msg && (
            <div className="w-full max-w-md rounded-2xl bg-white/95 p-3 text-center text-sm font-semibold text-[#76104e] shadow-lg">
              {msg}
            </div>
          )}
        </div>
        {asking && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-[#fff0f7] p-5 text-[#76104e] shadow-2xl">
              <label className="block font-semibold">Informe os nomes de quem vai comparecer</label>
              <p className="mt-1 text-xs opacity-70">
                Este convite permite até {guest?.party_limit ?? 1} pessoa(s).
              </p>
              <div className="mt-3 space-y-2">
                {memberNames.map((memberName, index) => (
                  <input
                    key={index}
                    required
                    value={memberName}
                    onChange={(event) =>
                      setMemberNames((current) =>
                        current.map((value, currentIndex) =>
                          currentIndex === index ? event.target.value : value,
                        ),
                      )
                    }
                    placeholder={index === 0 ? "Seu nome completo" : `Nome da pessoa ${index + 1}`}
                    className="w-full rounded-xl border border-[#8e145b]/30 bg-white px-3 py-2"
                  />
                ))}
              </div>
              {(guest?.party_limit ?? 1) > memberNames.length && (
                <button
                  type="button"
                  onClick={() => setMemberNames((current) => [...current, ""])}
                  className="mt-2 text-sm font-semibold underline"
                >
                  + Adicionar outra pessoa
                </button>
              )}
              <button
                disabled={busy}
                onClick={() => respond("confirmed")}
                className="mt-4 w-full rounded-xl bg-[#8e145b] py-3 font-semibold text-white"
              >
                {busy ? "Enviando..." : "Confirmar presença"}
              </button>
              <button
                type="button"
                onClick={() => setAsking(false)}
                className="mt-2 w-full py-2 text-sm underline"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
