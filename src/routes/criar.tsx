import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Flower2, Sparkles } from "lucide-react";

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
  "Outro",
];
const themes = [
  { name: "Jardim", description: "Floral delicado", className: "theme-garden" },
  { name: "Essência", description: "Minimalista e elegante", className: "theme-essence" },
  { name: "Celebre", description: "Festa vibrante", className: "theme-celebrate" },
];

function CreateInvitation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState("");
  const [theme, setTheme] = useState("");
  function next() {
    if (step === 1 && eventType) setStep(2);
    else if (step === 2 && theme) {
      localStorage.setItem(
        "meu-convite-draft",
        JSON.stringify({ eventType, theme, updatedAt: new Date().toISOString() }),
      );
      void navigate({ to: "/painel" });
    }
  }
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#292724]">
      <header className="border-b border-[#e6e0d7] bg-white/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/painel" className="flex items-center gap-2 text-sm text-[#77736b]">
            <ArrowLeft size={16} /> Voltar ao painel
          </Link>
          <div className="flex items-center gap-2 text-[#2f5145]">
            <Flower2 size={18} />
            <span className="font-serif text-xl">meu convite</span>
          </div>
          <span className="text-sm text-[#a29d94]">{step} de 2</span>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 lg:py-20">
        <div className="mb-12 flex gap-2">
          <span
            className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-[#2f5145]" : "bg-[#e6e0d7]"}`}
          />
          <span
            className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-[#2f5145]" : "bg-[#e6e0d7]"}`}
          />
        </div>
        {step === 1 ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#bd8051]">
              Comece pelo essencial
            </p>
            <h1 className="mt-4 font-serif text-4xl tracking-tight text-[#2f5145] sm:text-5xl">
              Que tipo de momento você vai celebrar?
            </h1>
            <p className="mt-4 max-w-xl text-[#77736b]">
              Isso nos ajuda a sugerir os melhores modelos para o seu convite.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {eventTypes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setEventType(item)}
                  className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${eventType === item ? "border-[#2f5145] bg-[#eaf2eb] text-[#2f5145] ring-2 ring-[#d7e6d9]" : "border-[#e6e0d7] bg-white hover:border-[#b9cdbb]"}`}
                >
                  <span className="font-medium">{item}</span>
                  {eventType === item && <Check size={18} />}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#bd8051]">
              <Sparkles size={14} /> Seu estilo
            </p>
            <h1 className="mt-4 font-serif text-4xl tracking-tight text-[#2f5145] sm:text-5xl">
              Escolha um modelo para começar.
            </h1>
            <p className="mt-4 max-w-xl text-[#77736b]">
              Você poderá experimentar outros modelos depois sem perder nenhum dado.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {themes.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setTheme(item.name)}
                  className={`group text-left ${theme === item.name ? "" : ""}`}
                >
                  <div
                    className={`relative aspect-[0.82] overflow-hidden rounded-3xl ${item.className} p-5 transition group-hover:-translate-y-1 ${theme === item.name ? "ring-4 ring-[#2f5145] ring-offset-2" : ""}`}
                  >
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <span className="text-xs uppercase tracking-[0.2em] text-[#637667]">
                        convite
                      </span>
                      <span className="mt-3 font-serif text-3xl italic text-[#2f5145]">
                        {item.name}
                      </span>
                      <span className="mt-4 h-px w-8 bg-[#8ca48d]" />
                    </div>
                    {theme === item.name && (
                      <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#2f5145] text-white">
                        <Check size={15} />
                      </span>
                    )}
                  </div>
                  <span className="mt-3 block font-medium text-[#3f4f44]">{item.name}</span>
                  <span className="mt-1 block text-sm text-[#89857e]">{item.description}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <div className="mt-12 flex justify-end">
          <button
            onClick={next}
            disabled={step === 1 ? !eventType : !theme}
            className="inline-flex items-center gap-3 rounded-full bg-[#2f5145] px-6 py-3.5 font-medium text-white transition hover:bg-[#234237] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === 1 ? "Escolher modelo" : "Salvar e continuar"}
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </main>
  );
}
