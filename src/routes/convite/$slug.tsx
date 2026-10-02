/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Flower2,
  MapPin,
  MessageCircle,
  Music2,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import { findPublishedInvitation } from "@/lib/rsvp";
import { playOpeningSound, type OpeningSound } from "@/lib/opening-sound";
import { QuinzeInvite } from "@/components/QuinzeInvite";

export const Route = createFileRoute("/convite/$slug")({
  component: PublicInvitation,
  validateSearch: (s: Record<string, unknown>): { g?: string | undefined } => ({
    g: typeof s["g"] === "string" ? (s["g"] as string) : undefined,
  }),
  head: ({ params }) => {
    const isCecilia = params.slug === "cecilia-15-anos";
    const canonicalUrl = `https://meus-convites.lovable.app/convite/${params.slug}`;
    const title = isCecilia
      ? "Cecília faz 15 anos | Meu Convite"
      : "Você está convidado | Meu Convite";
    const description = isCecilia
      ? "Você está convidado para comemorar os 15 anos da Cecília. Abra o convite virtual para ver todos os detalhes."
      : "Abra seu convite virtual e confirme sua presença.";
    const image = isCecilia
      ? "https://meus-convites.lovable.app/convites/cecilia-15-anos.jpeg?v=2"
      : "https://meus-convites.lovable.app/media-library/capa-jardim.jpg";
    return {
      links: [{ rel: "canonical", href: canonicalUrl }],
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:site_name", content: "Meu Convite" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:width", content: isCecilia ? "1024" : "1200" },
        { property: "og:image:height", content: isCecilia ? "1536" : "630" },
        { property: "og:image:alt", content: "Prévia do convite digital Meu Convite" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
});

function PublicInvitation() {
  const { slug } = Route.useParams();
  const { g } = Route.useSearch();
  const [invitation, setInvitation] = useState<any>();
  const [error, setError] = useState("");
  const [opened, setOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!invitation) return;
    const content = (invitation.content ?? {}) as Record<string, any>;
    const media = (content["media"] ?? {}) as Record<string, any>;
    const title = String(invitation.title || invitation.event_type || "Você está convidado");
    const description = String(
      content["phrase"] || content["description"] || "Abra seu convite e confirme sua presença.",
    );
    document.title = `${title} | Meu Convite`;
    const setMeta = (selector: string, attribute: string, value: string) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      if (element) element.setAttribute(attribute, value);
    };
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    if (media["coverUrl"]) {
      setMeta('meta[property="og:image"]', "content", String(media["coverUrl"]));
      setMeta('meta[name="twitter:image"]', "content", String(media["coverUrl"]));
    }
  }, [invitation]);
  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (active)
        setError("Não foi possível carregar este convite agora. Tente atualizar a página.");
    }, 10000);
    void findPublishedInvitation(slug)
      .then((data) => {
        window.clearTimeout(timeout);
        if (active) setInvitation(data);
      })
      .catch(() => {
        window.clearTimeout(timeout);
        if (active) setError("Este convite não está disponível ou ainda não foi publicado.");
      });
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [slug]);
  if (error) return <EmptyPublic message={error} />;
  if (!invitation)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaf7] text-[#2f5145]">
        <Sparkles className="animate-pulse" />
      </div>
    );
  const content = (invitation.content ?? {}) as Record<string, any>;
  if (content["template"] === "quinze-piscina" || invitation.event_type === "15 anos")
    return <QuinzeInvite invitation={invitation} token={g} />;
  const location = (invitation.location ?? {}) as Record<string, any>;
  const dressCode = String(content["dressCode"] || "").trim();
  const rsvp = (invitation.rsvp_config ?? {}) as Record<string, any>;
  const whatsappNumber = String(rsvp["whatsapp"] || "").replace(/\D/g, "");
  const whatsappMessage = String(rsvp["message"] || "Olá! Gostaria de confirmar minha presença.")
    .replaceAll("[NOME]", "")
    .replaceAll("[EVENTO]", String(invitation.title || invitation.event_type || "seu evento"))
    .replaceAll("[DATA]", invitation.event_date || "");
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage.trim())}`
    : "";
  const openingName = String(content["openingName"] || "").trim();
  const coverUrl = content["media"]?.["coverUrl"] as string | undefined;
  const audioUrl = content["media"]?.["audioUrl"] as string | undefined;
  const openingSound = (content["openingSound"] || "paper") as OpeningSound;
  const customEnvelopeColor = (content["customEnvelopeColor"] || "") as string;
  function handleOpen() {
    setOpened(true);
    playOpeningSound(openingSound);
    void audioRef.current?.play().catch(() => undefined);
  }
  function toggleMusic() {
    if (!audioRef.current) return;
    if (audioRef.current.paused) void audioRef.current.play().catch(() => undefined);
    else audioRef.current.pause();
  }
  return (
    <>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          loop
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
      <OpeningOverlay
        title={invitation.title || invitation.event_type}
        coverUrl={coverUrl}
        animationStyle={content["animationStyle"] || "envelope"}
        openingMotion={content["openingMotion"] || "lift"}
        envelopePalette={content["envelopePalette"] || "terracotta"}
        customEnvelopeColor={customEnvelopeColor}
        opened={opened}
        onOpen={handleOpen}
      />
      {audioUrl && opened && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={isPlaying ? "Pausar música" : "Reproduzir música"}
          title={isPlaying ? "Pausar música" : "Reproduzir música"}
          className={`music-fab ${isPlaying ? "is-playing" : ""}`}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          <span className="sr-only">{isPlaying ? "Pausar música" : "Reproduzir música"}</span>
        </button>
      )}
      <main className="min-h-screen bg-[#fbfaf7] text-[#292724]">
        <section className="relative overflow-hidden bg-[#dce8dd] px-5 py-20 text-center sm:py-28">
          <div className="absolute left-8 top-10 text-[#92ad97]">
            <Flower2 size={45} strokeWidth={1} />
          </div>
          <div className="absolute bottom-8 right-8 text-[#92ad97]">
            <Flower2 size={58} strokeWidth={1} />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <div className="text-xs uppercase tracking-[0.35em] text-[#5b7464]">
              você está convidado
            </div>
            <h1 className="mt-6 font-serif text-5xl italic text-[#2f5145] sm:text-7xl">
              {invitation.title || invitation.event_type}
            </h1>
            {content["phrase"] && (
              <p className="mt-5 font-serif text-xl text-[#5b7464]">{content["phrase"]}</p>
            )}
            {coverUrl && (
              <img
                src={coverUrl}
                alt="Capa do convite"
                className="mx-auto mt-9 h-48 w-48 rounded-full object-cover shadow-xl ring-8 ring-white/40"
              />
            )}
            <div className="mx-auto mt-9 flex flex-wrap items-center justify-center gap-5 text-sm text-[#5b7464]">
              <span className="flex items-center gap-2">
                <CalendarDays size={17} />{" "}
                {invitation.event_date
                  ? new Date(`${invitation.event_date}T00:00:00`).toLocaleDateString("pt-BR")
                  : "Data em breve"}
              </span>
              {invitation.event_time && <span>{invitation.event_time}</span>}
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
          {content["description"] && (
            <p className="text-center font-serif text-xl leading-8 text-[#5d5a53]">
              {content["description"]}
            </p>
          )}
          {dressCode && (
            <div className="mt-8 rounded-2xl border border-[#e6e0d7] bg-[#fff8ed] p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#bd8051]">
                Tipo de traje
              </p>
              <p className="mt-2 font-serif text-xl text-[#4e4a43]">{dressCode}</p>
            </div>
          )}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {location["venueName"] && (
              <div className="rounded-2xl border border-[#e6e0d7] bg-white p-5">
                <MapPin className="text-[#bd8051]" size={19} />
                <h2 className="mt-4 font-medium text-[#3f5146]">{location["venueName"]}</h2>
                <p className="mt-1 text-sm leading-6 text-[#89857e]">{location["address"]}</p>
                {location["mapsUrl"] && (
                  <a
                    href={location["mapsUrl"]}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#2f5145]"
                  >
                    Como chegar <ChevronRight size={15} />
                  </a>
                )}
              </div>
            )}
            {content["media"]?.["videoUrl"] && (
              <div className="rounded-2xl border border-[#e6e0d7] bg-white p-5">
                <Play className="text-[#bd8051]" size={19} />
                <h2 className="mt-4 font-medium text-[#3f5146]">Um vídeo para você</h2>
                <div className="opening-video-frame mt-4">
                  <video
                    controls
                    preload="metadata"
                    className="opening-video-media aspect-video w-full rounded-xl bg-[#232522]"
                    src={content["media"]["videoUrl"]}
                  />
                  {openingName && (
                    <div
                      className="opening-video-name"
                      aria-label={`Nome da aniversariante: ${openingName}`}
                    >
                      {openingName}
                    </div>
                  )}
                </div>
              </div>
            )}
            {content["media"]?.["audioUrl"] && (
              <div className="rounded-2xl border border-[#e6e0d7] bg-white p-5 sm:col-span-2">
                <Music2 className="text-[#bd8051]" size={19} />
                <h2 className="mt-4 font-medium text-[#3f5146]">Uma música especial</h2>
                <audio className="mt-4 w-full" controls src={content["media"]["audioUrl"]} />
              </div>
            )}
          </div>
          {rsvp["mode"] === "native" && (
            <div className="mt-10 rounded-3xl bg-[#2f5145] p-7 text-center text-white">
              <h2 className="font-serif text-3xl">Você vem celebrar com a gente?</h2>
              <p className="mt-2 text-sm text-white/65">
                Confirme sua presença para nos ajudar a preparar tudo.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {location["mapsUrl"] && (
                  <a
                    href={location["mapsUrl"]}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    <MapPin size={16} /> Ver mapa do local
                  </a>
                )}
                <Link
                  to="/convite/$slug/confirmar"
                  params={{ slug }}
                  search={{ status: "confirmed" }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-[#2f5145]"
                >
                  Confirmar presença <ChevronRight size={16} />
                </Link>
              </div>
              <Link
                to="/convite/$slug/confirmar"
                params={{ slug }}
                search={{ status: "declined" }}
                className="mt-3 inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Não poderei comparecer
              </Link>
            </div>
          )}
          {rsvp["mode"] === "google_forms" && rsvp["googleFormsUrl"] && (
            <a
              href={rsvp["googleFormsUrl"]}
              target="_blank"
              rel="noreferrer"
              className="mt-10 flex items-center justify-center rounded-full bg-[#2f5145] px-5 py-4 font-medium text-white"
            >
              Confirmar presença
            </a>
          )}
          {rsvp["mode"] === "whatsapp" && whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-10 flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-4 font-medium text-white shadow-lg shadow-[#25d366]/20"
            >
              <MessageCircle size={19} />
              Confirmar pelo WhatsApp
            </a>
          )}
          <p className="mt-12 text-center text-xs uppercase tracking-[0.25em] text-[#aaa59c]">
            feito com meu convite
          </p>
        </div>
      </main>
    </>
  );
}
function OpeningOverlay({
  title,
  coverUrl,
  animationStyle,
  openingMotion,
  envelopePalette,
  customEnvelopeColor,
  opened,
  onOpen,
}: {
  title: string;
  coverUrl?: string | undefined;
  animationStyle: string;
  openingMotion: string;
  envelopePalette: string;
  customEnvelopeColor: string;
  opened: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      className={`invite-opening style-${animationStyle} motion-${openingMotion} palette-${envelopePalette} ${customEnvelopeColor ? "palette-custom" : ""} ${opened ? "is-opening" : ""}`}
      style={
        customEnvelopeColor
          ? ({ "--custom-envelope-color": customEnvelopeColor } as React.CSSProperties)
          : undefined
      }
      aria-hidden={opened}
    >
      <div
        className="invite-opening-backdrop"
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      />
      <div className="invite-opening-shade" />
      <div className="invite-opening-content">
        <p className="invite-opening-kicker">Você está convidado</p>
        <div className="invite-envelope mt-6">
          <div className="invite-envelope-card">
            {coverUrl && <img src={coverUrl} alt="" />}
            <div className="invite-envelope-card-content">
              <p className="invite-opening-kicker">Um momento especial</p>
              <h1 className="invite-opening-title">{title}</h1>
            </div>
          </div>
        </div>
        <button type="button" className="invite-opening-button" onClick={onOpen}>
          Clique para abrir
        </button>
      </div>
    </div>
  );
}
function EmptyPublic({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-5 text-center">
      <div>
        <Flower2 className="mx-auto text-[#bd8051]" />
        <h1 className="mt-4 font-serif text-3xl text-[#2f5145]">Convite indisponível</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#77736b]">{message}</p>
      </div>
    </main>
  );
}
