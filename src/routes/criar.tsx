import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flower2,
  Loader2,
  MapPin,
  Save,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { coverLibrary, galleryLibrary, royaltyFreeSources } from "@/data/media-library";
import { hasPremiumThemes, startPremiumThemePurchase } from "@/lib/billing";
import { removeInvitationFile, uploadInvitationFile, type UploadKind } from "@/lib/storage";
import {
  emptyDraft,
  publishInvitation,
  saveInvitationDraft,
  type InvitationDraft,
  type RSVPMode,
} from "@/lib/invitation";

export const Route = createFileRoute("/criar")({
  component: CreateInvitation,
  head: () => ({ meta: [{ title: "Criar convite | Meu Convite" }] }),
});

const eventTypes = [
  "Aniversário",
  "15 anos",
  "Casamento",
  "Noivado",
  "Chá de bebê",
  "Formatura",
  "Festa infantil",
  "Festa temática",
  "Outro",
];
const themes = [
  { name: "Jardim", description: "Floral delicado", className: "theme-garden", premium: false },
  {
    name: "Essência",
    description: "Minimalista e elegante",
    className: "theme-essence",
    premium: true,
  },
  { name: "Celebre", description: "Festa vibrante", className: "theme-celebrate", premium: true },
];
const steps = ["Evento e modelo", "Texto", "Fotos e mídia", "Local", "Confirmação", "Prévia"];

function CreateInvitation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<InvitationDraft>(emptyDraft);
  const [userId, setUserId] = useState<string>();
  const [saveState, setSaveState] = useState("Rascunho local");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setUserId(data.session?.user.id);
        if (data.session?.user.id)
          void hasPremiumThemes(data.session.user.id).then(setPremiumUnlocked);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const draftTimer = window.setTimeout(() => {
      localStorage.setItem("meu-convite-draft", JSON.stringify(draft));
      if (!userId || !draft.eventType) return;
      setSaveState("Salvando…");
      void saveInvitationDraft(draft, userId)
        .then((id) => {
          setDraft((current) => ({ ...current, id }));
          setSaveState("Salvo automaticamente");
        })
        .catch(() => setSaveState("Salvo neste dispositivo"));
    }, 800);
    return () => window.clearTimeout(draftTimer);
  }, [draft, userId]);

  function update<K extends keyof InvitationDraft>(key: K, value: InvitationDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function ensureDraftId() {
    if (!userId || !draft.eventType) return undefined;
    if (draft.id) return draft.id;
    setSaveState("Salvando rascunho…");
    try {
      const id = await saveInvitationDraft(draft, userId);
      setDraft((current) => ({ ...current, id }));
      setSaveState("Rascunho salvo");
      return id;
    } catch {
      setSaveState("Rascunho local");
      return undefined;
    }
  }
  function next() {
    setError("");
    if (step < steps.length) setStep((current) => current + 1);
    else if (draft.id) void navigate({ to: "/painel" });
  }
  async function publish() {
    if (!userId || !draft.id) {
      setError("Aguarde o salvamento automático antes de publicar.");
      return;
    }
    setPublishing(true);
    setError("");
    try {
      const slug = await publishInvitation(draft, userId);
      await navigate({ to: "/convite/$slug", params: { slug } });
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Não foi possível publicar o convite.",
      );
    } finally {
      setPublishing(false);
    }
  }
  async function buyPremiumThemes() {
    setPremiumLoading(true);
    setError("");
    try {
      const result = await startPremiumThemePurchase();
      if (result.alreadyUnlocked) setPremiumUnlocked(true);
      else if (result.checkoutUrl) window.location.assign(result.checkoutUrl);
    } catch (purchaseError) {
      setError(
        purchaseError instanceof Error
          ? purchaseError.message
          : "Não foi possível iniciar o pagamento.",
      );
    } finally {
      setPremiumLoading(false);
    }
  }
  function back() {
    if (step > 1) setStep((current) => current - 1);
    else void navigate({ to: "/painel" });
  }
  const canContinue = useMemo(
    () => (step === 1 ? Boolean(draft.eventType && draft.themeName) : true),
    [draft.eventType, draft.themeName, step],
  );

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-[#232522]">
      <header className="border-b border-[#e8e8e3] bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <button
            onClick={back}
            className="flex items-center gap-2 text-sm text-[#777a74] transition hover:text-[#2c302d]"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="flex items-center gap-2 text-[#2c302d]">
            <Flower2 size={18} />
            <span className="font-serif text-xl">meu convite</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#9d9d96]">
            <Save size={14} className="text-[#7e9c86]" /> {saveState}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <div className="mb-10 grid grid-cols-6 gap-1.5 sm:gap-3">
          {steps.map((label, index) => (
            <div key={label} className="min-w-0">
              <div
                className={`h-1.5 rounded-full ${index + 1 <= step ? "bg-[#2c302d]" : "bg-[#e8e8e3]"}`}
              />
              <span
                className={`mt-2 hidden truncate text-xs sm:block ${index + 1 === step ? "font-semibold text-[#2c302d]" : "text-[#a0a19a]"}`}
              >
                {index + 1}. {label}
              </span>
            </div>
          ))}
        </div>
        {error && (
          <div className="mb-5 rounded-xl bg-[#f8eee9] p-3 text-sm text-[#a45f4e]">{error}</div>
        )}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="min-w-0">
            {step === 1 && (
              <EventStep
                draft={draft}
                update={update}
                premiumUnlocked={premiumUnlocked}
                onPurchase={buyPremiumThemes}
                premiumLoading={premiumLoading}
              />
            )}
            {step === 2 && <MessageStep draft={draft} update={update} />}
            {step === 3 && (
              <MediaStep
                draft={draft}
                update={update}
                userId={userId}
                ensureDraftId={ensureDraftId}
              />
            )}
            {step === 4 && <LocationStep draft={draft} update={update} />}
            {step === 5 && <RsvpStep draft={draft} update={update} />}
            {step === 6 && <PreviewStep draft={draft} />}
          </section>
          <PreviewCard draft={draft} />
        </div>
        <div className="mt-10 flex flex-col justify-end gap-3 sm:flex-row">
          {step === steps.length && (
            <button
              onClick={() => void publish()}
              disabled={publishing || !draft.id}
              className="inline-flex items-center justify-center gap-3 rounded-full border border-[#2c302d] px-6 py-3.5 font-medium text-[#2c302d] transition hover:bg-[#f3ebe5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {publishing ? "Publicando…" : "Publicar convite"}
              <Sparkles size={17} />
            </button>
          )}
          <button
            onClick={next}
            disabled={!canContinue}
            className="inline-flex items-center gap-3 rounded-full bg-[#2c302d] px-6 py-3.5 font-medium text-white transition hover:bg-[#1d211f] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === steps.length
              ? "Voltar ao painel"
              : step === 1
                ? "Continuar"
                : "Salvar e continuar"}
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </main>
  );
}

type EditorProps = {
  draft: InvitationDraft;
  userId?: string | undefined;
  update: <K extends keyof InvitationDraft>(key: K, value: InvitationDraft[K]) => void;
  ensureDraftId?: () => Promise<string | undefined>;
};
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#4e4a43]">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-[#a0a19a]">{hint}</span>}
    </label>
  );
}
function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[#dedbd3] bg-white px-4 py-3.5 outline-none transition placeholder:text-[#b1ada5] focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
    />
  );
}
function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full resize-y rounded-xl border border-[#dedbd3] bg-white px-4 py-3.5 outline-none transition placeholder:text-[#b1ada5] focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
    />
  );
}
function Heading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#bd8051]">{eyebrow}</p>
      <h1 className="mt-4 font-serif text-4xl tracking-tight text-[#2c302d] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-xl leading-7 text-[#777a74]">{text}</p>
    </div>
  );
}

function EventStep({
  draft,
  update,
  premiumUnlocked,
  onPurchase,
  premiumLoading,
}: EditorProps & { premiumUnlocked: boolean; onPurchase: () => void; premiumLoading: boolean }) {
  return (
    <>
      <Heading
        eyebrow="Passo 1 · Evento"
        title="Vamos começar pelo seu momento."
        text="Escolha o tipo de celebração e o estilo que vai guiar o seu convite."
      />
      <div className="mt-9">
        <p className="mb-3 text-sm font-medium text-[#4e4a43]">Tipo de evento</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {eventTypes.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => update("eventType", item)}
              className={`rounded-xl border p-4 text-left text-sm transition ${draft.eventType === item ? "border-[#2c302d] bg-[#f3ebe5] font-medium text-[#2c302d] ring-2 ring-[#d7e6d9]" : "border-[#e8e8e3] bg-white hover:border-[#b9cdbb]"}`}
            >
              {draft.eventType === item && <Check size={15} className="mb-2" />}
              {item}
            </button>
          ))}
        </div>
        {draft.eventType === "Outro" && (
          <div className="mt-4">
            <Input
              value={draft.customEventType}
              onChange={(value) => update("customEventType", value)}
              placeholder="Qual é o seu evento?"
            />
          </div>
        )}
        <p className="mb-3 mt-10 text-sm font-medium text-[#4e4a43]">Escolha um modelo</p>
        <div className="grid gap-5 sm:grid-cols-3">
          {themes.map((item) => (
            <button
              type="button"
              key={item.name}
              onClick={() => (!item.premium || premiumUnlocked) && update("themeName", item.name)}
              className={`text-left ${item.premium && !premiumUnlocked ? "cursor-not-allowed" : ""}`}
            >
              <div
                className={`relative aspect-[0.8] overflow-hidden rounded-3xl ${item.className} p-5 transition ${!item.premium || premiumUnlocked ? "hover:-translate-y-1" : "opacity-60 grayscale"} ${draft.themeName === item.name ? "ring-4 ring-[#2c302d] ring-offset-2" : ""}`}
              >
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Sparkles size={17} className="text-[#587160]" />
                  <span className="mt-3 font-serif text-3xl italic text-[#2c302d]">
                    {item.name}
                  </span>
                  <span className="mt-3 text-xs uppercase tracking-wider text-[#637667]">
                    {item.description}
                  </span>
                </div>
                {item.premium && !premiumUnlocked && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-[#2c302d] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Premium
                  </span>
                )}
                {draft.themeName === item.name && (
                  <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#2c302d] text-white">
                    <Check size={15} />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
        {!premiumUnlocked && (
          <div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-[#e6d3bd] bg-[#fff9f1] p-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium text-[#5f4734]">Desbloqueie todos os temas premium</p>
              <p className="mt-1 text-sm leading-6 text-[#856f5d]">
                Pagamento único via Mercado Pago. Cartão ou Pix, sem assinatura recorrente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void onPurchase()}
              disabled={premiumLoading}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#2c302d] px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {premiumLoading ? "Abrindo pagamento…" : "Comprar temas premium"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
function MessageStep({ draft, update }: EditorProps) {
  const titleSuggestions = [
    "Um dia para celebrar",
    "Nosso momento especial",
    "Vamos comemorar juntos",
  ];
  const phraseSuggestions = [
    "Um dia para lembrar",
    "Uma nova história começa",
    "O amor está no ar",
  ];
  const messageSuggestions = [
    "Será uma alegria ter você conosco para celebrar este momento tão especial.",
    "Preparamos tudo com muito carinho e esperamos compartilhar esse dia inesquecível com você.",
    "Sua presença tornará nossa celebração ainda mais completa. Venha comemorar conosco!",
  ];
  const dressCodeSuggestions = ["Esporte fino", "Traje social", "Traje casual", "Livre"];
  return (
    <>
      <Heading
        eyebrow="Passo 2 · Conteúdo"
        title="Dê voz ao seu convite."
        text="Escreva os detalhes que seus convidados precisam saber e o sentimento que você quer transmitir."
      />
      <div className="mt-9 grid gap-5">
        <Field label="Título do convite">
          <Input
            value={draft.title}
            onChange={(value) => update("title", value)}
            placeholder="Ex.: Marina & Daniel"
          />
          <PresetChips
            suggestions={titleSuggestions}
            onSelect={(value) => update("title", value)}
          />
        </Field>
        <Field label="Frase de abertura">
          <Input
            value={draft.phrase}
            onChange={(value) => update("phrase", value)}
            placeholder="Ex.: Um dia para lembrar"
          />
          <PresetChips
            suggestions={phraseSuggestions}
            onSelect={(value) => update("phrase", value)}
          />
        </Field>
        <Field label="Mensagem especial">
          <Textarea
            value={draft.description}
            onChange={(value) => update("description", value)}
            placeholder="Escreva uma mensagem carinhosa para seus convidados..."
          />
          <PresetChips
            suggestions={messageSuggestions}
            onSelect={(value) => update("description", value)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Data">
            <Input
              type="date"
              value={draft.eventDate}
              onChange={(value) => update("eventDate", value)}
            />
          </Field>
          <Field label="Horário">
            <Input
              type="time"
              value={draft.eventTime}
              onChange={(value) => update("eventTime", value)}
            />
          </Field>
        </div>
        <Field label="Dress code (opcional)">
          <Input
            value={draft.dressCode}
            onChange={(value) => update("dressCode", value)}
            placeholder="Ex.: Esporte fino"
          />
          <PresetChips
            suggestions={dressCodeSuggestions}
            onSelect={(value) => update("dressCode", value)}
          />
        </Field>
      </div>
    </>
  );
}
function PresetChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-2.5">
      <p className="mb-2 text-[11px] font-medium text-[#9d9d96]">
        Não sabe o que escrever? Escolha uma sugestão:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="rounded-full border border-[#e8e8e3] bg-white px-3 py-2 text-left text-xs text-[#777a74] transition hover:border-[#d6c0b3] hover:bg-[#f8eee9] hover:text-[#7f4e40]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
function MediaStep({ draft, update, userId, ensureDraftId }: EditorProps) {
  const [uploading, setUploading] = useState<UploadKind | null>(null);
  const [uploadError, setUploadError] = useState("");
  async function upload(file: File, kind: UploadKind) {
    const invitationId = draft.id ?? (await ensureDraftId?.());
    if (!userId || !invitationId) {
      setUploadError(
        "Escolha o tipo de evento e aguarde o salvamento do rascunho antes de enviar.",
      );
      return;
    }
    setUploading(kind);
    setUploadError("");
    try {
      const { url } = await uploadInvitationFile(file, userId, invitationId, kind);
      if (kind === "cover") update("coverUrl", url);
      else if (kind === "image") update("galleryUrls", [...draft.galleryUrls, url]);
      else if (kind === "video") update("videoUrl", url);
      else update("audioUrl", url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar o arquivo.");
    } finally {
      setUploading(null);
    }
  }
  async function remove(url: string, kind: UploadKind) {
    try {
      await removeInvitationFile(url);
      if (kind === "cover") update("coverUrl", "");
      else if (kind === "image")
        update(
          "galleryUrls",
          draft.galleryUrls.filter((item) => item !== url),
        );
      else if (kind === "video") update("videoUrl", "");
      else update("audioUrl", "");
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Não foi possível remover o arquivo.",
      );
    }
  }
  function FilePicker({
    kind,
    accept,
    label,
    multiple = false,
  }: {
    kind: UploadKind;
    accept: string;
    label: string;
    multiple?: boolean;
  }) {
    return (
      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#d9e4da] bg-white px-4 py-3 text-sm font-medium text-[#2c302d] transition hover:bg-[#f1f6f1]">
        <span>{uploading === kind ? "Enviando…" : label}</span>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          disabled={Boolean(uploading)}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            void files.reduce(
              (chain, file) => chain.then(() => upload(file, kind)),
              Promise.resolve(),
            );
            event.currentTarget.value = "";
          }}
        />
      </label>
    );
  }
  return (
    <>
      <Heading
        eyebrow="Passo 3 · Mídia"
        title="Adicione seus momentos favoritos."
        text="Envie fotos, vídeo e música diretamente para o armazenamento seguro do seu convite."
      />
      <div className="mt-9 grid gap-6">
        {uploadError && (
          <div className="rounded-xl bg-[#f8eee9] p-3 text-sm text-[#a45f4e]">{uploadError}</div>
        )}
        <div className="rounded-2xl border border-[#e8e8e3] bg-white p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium text-[#3f5146]">Imagem de capa</p>
              <p className="mt-1 text-xs text-[#9d9d96]">JPG, PNG ou WebP · até 8 MB</p>
            </div>
            <FilePicker
              kind="cover"
              accept="image/jpeg,image/png,image/webp"
              label={draft.coverUrl ? "Trocar capa" : "Enviar capa"}
            />
          </div>
          <p className="mt-5 text-xs font-medium text-[#777a74]">
            Ou escolha uma capa da nossa biblioteca
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {coverLibrary.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => update("coverUrl", item.url)}
                className={`group overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 ${draft.coverUrl === item.url ? "border-[#a76e59] ring-2 ring-[#ead9cf]" : "border-[#e8e8e3]"}`}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="h-24 w-full object-cover transition group-hover:scale-105"
                />
                <span className="block truncate px-2 py-2 text-[11px] font-medium text-[#777a74]">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
          {draft.coverUrl && (
            <div className="mt-4 flex items-center gap-4">
              <img
                src={draft.coverUrl}
                alt="Prévia da capa"
                className="h-20 w-20 rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={() => void remove(draft.coverUrl, "cover")}
                className="text-sm text-[#a45f4e]"
              >
                Remover
              </button>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-[#e8e8e3] bg-white p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium text-[#3f5146]">Galeria de fotos</p>
              <p className="mt-1 text-xs text-[#9d9d96]">
                JPG, PNG, WebP ou GIF · até 8 MB por foto
              </p>
            </div>
            <FilePicker
              kind="image"
              accept="image/jpeg,image/png,image/webp,image/gif"
              label="Adicionar fotos"
              multiple
            />
          </div>
          <p className="mt-5 text-xs font-medium text-[#777a74]">
            Adicione também imagens prontas à sua galeria
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {galleryLibrary.map((item) => {
              const selected = draft.galleryUrls.includes(item.url);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    update(
                      "galleryUrls",
                      selected
                        ? draft.galleryUrls.filter((url) => url !== item.url)
                        : [...draft.galleryUrls, item.url],
                    )
                  }
                  className={`group overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 ${selected ? "border-[#a76e59] ring-2 ring-[#ead9cf]" : "border-[#e8e8e3]"}`}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="h-24 w-full object-cover transition group-hover:scale-105"
                  />
                  <span className="block truncate px-2 py-2 text-[11px] font-medium text-[#777a74]">
                    {selected ? "Adicionada" : "Adicionar"}
                  </span>
                </button>
              );
            })}
          </div>
          {draft.galleryUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {draft.galleryUrls.map((url) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-xl">
                  <img src={url} alt="Foto da galeria" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => void remove(url, "image")}
                    className="absolute inset-x-1 bottom-1 rounded-lg bg-black/65 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#e8e8e3] bg-white p-5">
            <p className="font-medium text-[#3f5146]">Vídeo</p>
            <p className="mt-1 text-xs text-[#9d9d96]">MP4 ou WebM · até 15 MB</p>
            <a
              href={royaltyFreeSources.video.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-xs font-medium text-[#a76e59] hover:underline"
            >
              Encontrar vídeos gratuitos ↗
            </a>
            <div className="mt-4 flex items-center gap-3">
              <FilePicker
                kind="video"
                accept="video/mp4,video/webm"
                label={draft.videoUrl ? "Trocar vídeo" : "Enviar vídeo"}
              />
              {draft.videoUrl && (
                <div className="mt-4 space-y-3">
                  <video
                    controls
                    className="aspect-video w-full rounded-xl bg-[#232522]"
                    src={draft.videoUrl}
                  />
                  <button
                    type="button"
                    onClick={() => void remove(draft.videoUrl, "video")}
                    className="text-sm text-[#a45f4e]"
                  >
                    Remover vídeo
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e8e8e3] bg-white p-5">
            <p className="font-medium text-[#3f5146]">Música</p>
            <p className="mt-1 text-xs text-[#9d9d96]">MP3, OGG ou WAV · até 15 MB</p>
            <a
              href={royaltyFreeSources.music.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-xs font-medium text-[#a76e59] hover:underline"
            >
              Encontrar músicas gratuitas ↗
            </a>
            <div className="mt-4 flex items-center gap-3">
              <FilePicker
                kind="audio"
                accept="audio/mpeg,audio/ogg,audio/wav"
                label={draft.audioUrl ? "Trocar música" : "Enviar música"}
              />
              {draft.audioUrl && (
                <div className="mt-4 space-y-3">
                  <audio controls className="w-full" src={draft.audioUrl} />
                  <button
                    type="button"
                    onClick={() => void remove(draft.audioUrl, "audio")}
                    className="text-sm text-[#a45f4e]"
                  >
                    Remover música
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function LocationStep({ draft, update }: EditorProps) {
  return (
    <>
      <Heading
        eyebrow="Passo 4 · Local"
        title="Onde a celebração acontece?"
        text="Ajude seus convidados a chegar sem preocupação."
      />
      <div className="mt-9 grid gap-5">
        <Field label="Nome do local">
          <Input
            value={draft.venueName}
            onChange={(value) => update("venueName", value)}
            placeholder="Ex.: Espaço Jardim"
          />
        </Field>
        <Field label="Endereço completo">
          <Textarea
            value={draft.address}
            onChange={(value) => update("address", value)}
            placeholder="Rua, número, bairro, cidade e estado"
          />
        </Field>
        <Field label="Link do Google Maps" hint="Cole o link para o botão Como chegar.">
          <Input
            value={draft.mapsUrl}
            onChange={(value) => update("mapsUrl", value)}
            placeholder="https://maps.google.com/..."
          />
        </Field>
        <Field label="Instruções adicionais">
          <Input
            value={draft.locationNotes}
            onChange={(value) => update("locationNotes", value)}
            placeholder="Ex.: Estacionamento pela entrada lateral"
          />
        </Field>
      </div>
    </>
  );
}
function RsvpStep({ draft, update }: EditorProps) {
  const options: { value: RSVPMode; label: string; text: string }[] = [
    { value: "native", label: "Meu Convite", text: "Respostas organizadas no painel" },
    { value: "google_forms", label: "Google Forms", text: "Usar um formulário existente" },
    { value: "whatsapp", label: "WhatsApp", text: "Confirmar por mensagem" },
    { value: "none", label: "Não usar RSVP", text: "Ocultar confirmação" },
  ];
  return (
    <>
      <Heading
        eyebrow="Passo 5 · Presença"
        title="Como você quer receber as confirmações?"
        text="Escolha o formato que faz mais sentido para o seu evento."
      />
      <div className="mt-9 grid gap-3">
        {options.map((item) => (
          <button
            type="button"
            key={item.value}
            onClick={() => update("rsvpMode", item.value)}
            className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${draft.rsvpMode === item.value ? "border-[#2c302d] bg-[#f3ebe5] ring-2 ring-[#d7e6d9]" : "border-[#e8e8e3] bg-white"}`}
          >
            <span>
              <span className="block font-medium text-[#3c5145]">{item.label}</span>
              <span className="mt-1 block text-sm text-[#9d9d96]">{item.text}</span>
            </span>
            {draft.rsvpMode === item.value && <Check size={18} className="text-[#2c302d]" />}
          </button>
        ))}
      </div>
      {draft.rsvpMode === "google_forms" && (
        <div className="mt-5">
          <Field label="Link do Google Forms">
            <Input
              value={draft.googleFormsUrl}
              onChange={(value) => update("googleFormsUrl", value)}
              placeholder="https://docs.google.com/forms/..."
            />
          </Field>
        </div>
      )}
      {draft.rsvpMode === "whatsapp" && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="WhatsApp">
            <Input
              value={draft.rsvpWhatsapp}
              onChange={(value) => update("rsvpWhatsapp", value)}
              placeholder="5511999999999"
            />
          </Field>
          <Field label="Mensagem">
            <Input
              value={draft.rsvpMessage}
              onChange={(value) => update("rsvpMessage", value)}
              placeholder="Olá! Sou [NOME]..."
            />
          </Field>
        </div>
      )}
      <label className="mt-7 flex items-center gap-3 text-sm text-[#5f5b54]">
        <input
          type="checkbox"
          checked={draft.showCountdown}
          onChange={(e) => update("showCountdown", e.target.checked)}
          className="h-4 w-4 accent-[#2c302d]"
        />{" "}
        Mostrar contagem regressiva no convite
      </label>
    </>
  );
}
function PreviewStep({ draft }: { draft: InvitationDraft }) {
  return (
    <>
      <Heading
        eyebrow="Passo 6 · Prévia"
        title="Seu convite está tomando forma."
        text="Revise os detalhes ao lado. O rascunho já foi salvo automaticamente e você poderá continuar editando depois."
      />
      <div className="mt-8 rounded-2xl border border-[#dbe7dc] bg-[#f1f6f1] p-5 text-sm leading-6 text-[#4c6854]">
        <Check className="mb-2" size={18} /> Tudo certo por aqui? Clique em “Voltar ao painel” para
        continuar acompanhando seu convite.
      </div>
    </>
  );
}
function PreviewCard({ draft }: { draft: InvitationDraft }) {
  return (
    <aside className="lg:sticky lg:top-8 lg:self-start">
      <div className="mx-auto max-w-[380px] overflow-hidden rounded-[2rem] border-[8px] border-white bg-[#dce8dd] shadow-[0_24px_60px_rgba(44,48,45,0.14)]">
        <div
          className={`min-h-[520px] ${draft.themeName === "Essência" ? "theme-essence" : draft.themeName === "Celebre" ? "theme-celebrate" : "theme-garden"} p-7 text-center sm:p-9`}
        >
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#5b7464]">
            {draft.phrase || "um dia para lembrar"}
          </div>
          {draft.coverUrl && (
            <img
              src={draft.coverUrl}
              alt="Capa do convite"
              className="mx-auto mt-5 h-28 w-28 rounded-full object-cover ring-4 ring-white/50"
            />
          )}
          <div className="mt-14 font-serif text-4xl italic leading-tight text-[#2c302d]">
            {draft.title || "Seu evento"}
          </div>
          <div className="mx-auto mt-5 h-px w-12 bg-[#78927e]" />
          <div className="mt-5 text-xs uppercase tracking-[0.2em] text-[#5b7464]">
            {draft.eventType || "celebração"}
          </div>
          {draft.eventDate && (
            <div className="mt-10 text-sm tracking-[0.18em] text-[#5b7464]">
              {new Date(`${draft.eventDate}T00:00:00`).toLocaleDateString("pt-BR")}
              {draft.eventTime ? ` · ${draft.eventTime}` : ""}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-[#9d9d96]">
        <MapPin size={14} /> Prévia atualizada conforme você digita
      </div>
    </aside>
  );
}
