/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Check, Clock, Heart, MapPin, Volume2, VolumeX, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import introVideo from "@/assets/quinze-intro.mp4.asset.json";

const db = supabase as any;
type Guest = { name: string; status: string; companions: number } | null;

export function QuinzeInvite({ invitation, token }: { invitation: any; token?: string | undefined }) {
  const content = (invitation.content ?? {}) as Record<string, any>;
  const location = (invitation.location ?? {}) as Record<string, any>;
  const name = invitation.title || "Aniversariante";
  const videoUrl = content["media"]?.["videoUrl"] || introVideo.url;
  const [stage, setStage] = useState<"intro" | "card">("intro");
  const [muted, setMuted] = useState(true);
  const [guest, setGuest] = useState<Guest>(null);
  const [companions, setCompanions] = useState(0);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!token) return;
    void db.rpc("get_guest_by_token", { _token: token }).then(({ data }: any) => {
      const g = data?.[0];
      if (g) {
        setGuest(g);
        setCompanions(g.companions ?? 0);
      }
    });
  }, [token]);

  const date = invitation.event_date ? new Date(`${invitation.event_date}T00:00:00`) : null;
  const time = invitation.event_time ? String(invitation.event_time).slice(0, 5) : "";

  async function respond(status: "confirmed" | "declined") {
    if (!token) return;
    setBusy(true);
    const { data, error } = await db.rpc("respond_guest", {
      _token: token,
      _status: status,
      _companions: status === "confirmed" ? companions : 0,
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
      <div className="quinze-theme fixed inset-0 z-50 flex items-center justify-center bg-[var(--q-deep)]">
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted={muted}
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
        <button
          onClick={() => setMuted((m) => !m)}
          className="absolute right-4 top-4 rounded-full bg-[var(--q-paper)]/80 p-3 text-[var(--q-deep)]"
          aria-label={muted ? "Ativar som" : "Desativar som"}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button
          onClick={() => setStage("card")}
          className="absolute bottom-10 rounded-full bg-[var(--q-deep)] px-7 py-3 text-sm font-semibold uppercase tracking-widest text-[var(--q-paper)] shadow-xl"
        >
          Abrir convite
        </button>
      </div>
    );

  const answered = guest && guest.status !== "pending";

  return (
    <main className="quinze-theme quinze-water min-h-screen px-4 py-8">
      <div className="quinze-card quinze-rise mx-auto max-w-md rounded-[28px] px-6 py-10 text-center text-[var(--q-deep)] shadow-2xl">
        {guest && (
          <p className="text-xs uppercase tracking-[0.3em] opacity-70">Querido(a) {guest.name}</p>
        )}
        <h1 className="quinze-script mt-2 text-7xl leading-tight">{name}</h1>
        <Heart className="mx-auto mt-1" size={18} />
        <div className="mt-2 font-serif text-6xl">{content["age"] || "15"}</div>
        <div className="quinze-script -mt-2 text-4xl">anos</div>
        <p className="mx-auto mt-5 max-w-xs text-base leading-6">
          {content["phrase"] || "Será uma alegria enorme compartilhar esse momento com você!"}
        </p>

        <div className="mt-7 grid grid-cols-2 gap-4 border-y border-[var(--q-deep)]/20 py-5 text-left text-sm">
          <div className="flex gap-2">
            <CalendarDays size={22} className="shrink-0" />
            <div>
              <div className="font-serif text-2xl leading-none">
                {date ? date.getDate().toString().padStart(2, "0") : "--"}
              </div>
              <div className="uppercase">
                {date?.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </div>
              <div className="text-xs uppercase tracking-widest opacity-70">
                {date?.toLocaleDateString("pt-BR", { weekday: "long" })}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Clock size={22} className="shrink-0" />
            <div>
              <div className="font-serif text-2xl leading-none">{time || "--"}</div>
              <div className="text-xs uppercase tracking-widest opacity-70">horas</div>
            </div>
          </div>
          {location["venueName"] && (
            <div className="col-span-2 flex gap-2">
              <MapPin size={22} className="shrink-0" />
              <div>
                <div className="font-semibold uppercase">{location["venueName"]}</div>
                <div className="opacity-80">{location["address"]}</div>
              </div>
            </div>
          )}
        </div>

        {content["note"] && (
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em]">{content["note"]}</p>
        )}

        {msg && (
          <div className="mt-6 rounded-2xl bg-[var(--q-paper)] p-4 text-sm font-medium">{msg}</div>
        )}

        {asking && (
          <div className="mt-6 rounded-2xl bg-[var(--q-paper)] p-4 text-sm">
            <label className="block font-medium">Quantos acompanhantes virão com você?</label>
            <select
              value={companions}
              onChange={(e) => setCompanions(Number(e.target.value))}
              className="mt-2 w-full rounded-xl border border-[var(--q-deep)]/30 bg-transparent px-3 py-2"
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Só eu" : `${n} acompanhante(s)`}
                </option>
              ))}
            </select>
            <button
              disabled={busy}
              onClick={() => respond("confirmed")}
              className="mt-3 w-full rounded-xl bg-[var(--q-deep)] py-3 font-semibold text-[var(--q-paper)]"
            >
              {busy ? "Enviando..." : "Confirmar"}
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-3">
          {token && guest ? (
            <button
              disabled={busy}
              onClick={() => setAsking(true)}
              className="quinze-btn"
            >
              <Check size={18} />
              {answered && guest.status === "confirmed" ? "Presença confirmada" : "Confirmar presença"}
            </button>
          ) : (
            <Link
              to="/convite/$slug/confirmar"
              params={{ slug: invitation.slug }}
              className="quinze-btn"
            >
              <Check size={18} /> Confirmar presença
            </Link>
          )}
          {location["mapsUrl"] && (
            <a href={location["mapsUrl"]} target="_blank" rel="noreferrer" className="quinze-btn">
              <MapPin size={18} /> Ver mapa do local
            </a>
          )}
          {token && guest && (
            <button
              disabled={busy}
              onClick={() => respond("declined")}
              className="quinze-btn quinze-btn-outline"
            >
              <X size={18} /> Não poderei comparecer
            </button>
          )}
        </div>

        <p className="quinze-script mt-8 text-3xl leading-tight">
          {content["closing"] || "Sua presença torna esta festa ainda mais especial!"}
        </p>
      </div>
    </main>
  );
}
