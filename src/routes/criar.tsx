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
import {
  emptyDraft,
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
  { name: "Jardim", description: "Floral delicado", className: "theme-garden" },
  { name: "Essência", description: "Minimalista e elegante", className: "theme-essence" },
  { name: "Celebre", description: "Festa vibrante", className: "theme-celebrate" },
];
const steps = ["Evento", "Mensagem", "Mídia", "Local", "RSVP", "Prévia"];

function CreateInvitation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<InvitationDraft>(emptyDraft);
  const [userId, setUserId] = useState<string>();
  const [saveState, setSaveState] = useState("Rascunho local");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setUserId(data.session?.user.id);
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
  function next() {
    setError("");
    if (step < steps.length) setStep((current) => current + 1);
    else if (draft.id) void navigate({ to: "/painel" });
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
    <main className="min-h-screen bg-[#fbfaf7] text-[#292724]">
      <header className="border-b border-[#e6e0d7] bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <button
            onClick={back}
            className="flex items-center gap-2 text-sm text-[#77736b] transition hover:text-[#2f5145]"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="flex items-center gap-2 text-[#2f5145]">
            <Flower2 size={18} />
            <span className="font-serif text-xl">meu convite</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#89857e]">
            <Save size={14} className="text-[#6c9476]" /> {saveState}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <div className="mb-10 grid grid-cols-6 gap-1.5 sm:gap-3">
          {steps.map((label, index) => (
            <div key={label} className="min-w-0">
              <div
                className={`h-1.5 rounded-full ${index + 1 <= step ? "bg-[#2f5145]" : "bg-[#e6e0d7]"}`}
              />
              <span
                className={`mt-2 hidden truncate text-xs sm:block ${index + 1 === step ? "font-semibold text-[#2f5145]" : "text-[#a29d94]"}`}
              >
                {index + 1}. {label}
              </span>
            </div>
          ))}
        </div>
        {error && (
          <div className="mb-5 rounded-xl bg-[#f8e5df] p-3 text-sm text-[#9b4e3c]">{error}</div>
        )}
        <div className="grid gap-10 lg:grid-cols-[1fr_330px]">
          <section className="min-w-0">
            {step === 1 && <EventStep draft={draft} update={update} />}
            {step === 2 && <MessageStep draft={draft} update={update} />}
            {step === 3 && <MediaStep draft={draft} update={update} />}
            {step === 4 && <LocationStep draft={draft} update={update} />}
            {step === 5 && <RsvpStep draft={draft} update={update} />}
            {step === 6 && <PreviewStep draft={draft} />}
          </section>
          <PreviewCard draft={draft} />
        </div>
        <div className="mt-10 flex justify-end">
          <button
            onClick={next}
            disabled={!canContinue}
            className="inline-flex items-center gap-3 rounded-full bg-[#2f5145] px-6 py-3.5 font-medium text-white transition hover:bg-[#234237] disabled:cursor-not-allowed disabled:opacity-40"
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
  update: <K extends keyof InvitationDraft>(key: K, value: InvitationDraft[K]) => void;
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
      {hint && <span className="mt-1.5 block text-xs text-[#a29d94]">{hint}</span>}
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
      <h1 className="mt-4 font-serif text-4xl tracking-tight text-[#2f5145] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-xl leading-7 text-[#77736b]">{text}</p>
    </div>
  );
}

function EventStep({ draft, update }: EditorProps) {
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
              className={`rounded-xl border p-4 text-left text-sm transition ${draft.eventType === item ? "border-[#2f5145] bg-[#eaf2eb] font-medium text-[#2f5145] ring-2 ring-[#d7e6d9]" : "border-[#e6e0d7] bg-white hover:border-[#b9cdbb]"}`}
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
              onClick={() => update("themeName", item.name)}
              className="text-left"
            >
              <div
                className={`relative aspect-[0.8] overflow-hidden rounded-3xl ${item.className} p-5 transition hover:-translate-y-1 ${draft.themeName === item.name ? "ring-4 ring-[#2f5145] ring-offset-2" : ""}`}
              >
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Sparkles size={17} className="text-[#587160]" />
                  <span className="mt-3 font-serif text-3xl italic text-[#2f5145]">
                    {item.name}
                  </span>
                  <span className="mt-3 text-xs uppercase tracking-wider text-[#637667]">
                    {item.description}
                  </span>
                </div>
                {draft.themeName === item.name && (
                  <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#2f5145] text-white">
                    <Check size={15} />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
function MessageStep({ draft, update }: EditorProps) {
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
        </Field>
        <Field label="Frase de abertura">
          <Input
            value={draft.phrase}
            onChange={(value) => update("phrase", value)}
            placeholder="Ex.: Um dia para lembrar"
          />
        </Field>
        <Field label="Mensagem especial">
          <Textarea
            value={draft.description}
            onChange={(value) => update("description", value)}
            placeholder="Escreva uma mensagem carinhosa para seus convidados..."
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
        </Field>
      </div>
    </>
  );
}
function MediaStep({ draft, update }: EditorProps) {
  return (
    <>
      <Heading
        eyebrow="Passo 3 · Mídia"
        title="Adicione seus momentos favoritos."
        text="Cole links públicos das suas fotos, vídeo ou música. O armazenamento de arquivos será conectado na próxima etapa."
      />
      <div className="mt-9 grid gap-5">
        <Field label="Imagem de capa" hint="Use uma URL de imagem pública (JPG, PNG ou WebP).">
          <Input
            value={draft.coverUrl}
            onChange={(value) => update("coverUrl", value)}
            placeholder="https://..."
          />
        </Field>
        <Field label="Galeria de fotos" hint="Separe múltiplos links por vírgula.">
          <Textarea
            value={draft.galleryUrls.join(", ")}
            onChange={(value) =>
              update(
                "galleryUrls",
                value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
            placeholder="https://foto-1.jpg, https://foto-2.jpg"
          />
        </Field>
        <Field label="Vídeo">
          <Input
            value={draft.videoUrl}
            onChange={(value) => update("videoUrl", value)}
            placeholder="https://youtube.com/... ou https://..."
          />
        </Field>
        <Field label="Música">
          <Input
            value={draft.audioUrl}
            onChange={(value) => update("audioUrl", value)}
            placeholder="https://.../musica.mp3"
          />
        </Field>
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
            className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${draft.rsvpMode === item.value ? "border-[#2f5145] bg-[#eaf2eb] ring-2 ring-[#d7e6d9]" : "border-[#e6e0d7] bg-white"}`}
          >
            <span>
              <span className="block font-medium text-[#3c5145]">{item.label}</span>
              <span className="mt-1 block text-sm text-[#89857e]">{item.text}</span>
            </span>
            {draft.rsvpMode === item.value && <Check size={18} className="text-[#2f5145]" />}
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
          className="h-4 w-4 accent-[#2f5145]"
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
      <div className="overflow-hidden rounded-[2rem] border-[7px] border-white bg-[#dce8dd] shadow-xl shadow-[#2f5145]/10">
        <div
          className={`min-h-[430px] ${draft.themeName === "Essência" ? "theme-essence" : draft.themeName === "Celebre" ? "theme-celebrate" : "theme-garden"} p-7 text-center sm:p-9`}
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
          <div className="mt-14 font-serif text-4xl italic leading-tight text-[#2f5145]">
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
      <div className="mt-4 flex items-center gap-2 text-xs text-[#89857e]">
        <MapPin size={14} /> Prévia atualizada conforme você digita
      </div>
    </aside>
  );
}
