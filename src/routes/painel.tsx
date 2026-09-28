import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Flower2,
  Globe2,
  Loader2,
  LogOut,
  MapPin,
  Palette,
  Plus,
  Share2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { isSupabaseConfigured, supabase, getSupabaseSetupMessage } from "@/lib/supabase";
import { PWAInstallButton } from "@/components/PWAInstallButton";

export const Route = createFileRoute("/painel")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Meu painel | Meu Convite" },
      { name: "description", content: "Gerencie seus convites digitais." },
    ],
  }),
});

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [showHowWorks, setShowHowWorks] = useState(false);
  const [invitations, setInvitations] = useState<
    Array<{
      id: string;
      title: string | null;
      event_type: string;
      status: string;
      updated_at: string;
    }>
  >([]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) {
        setLoading(false);
        setError(getSupabaseSetupMessage());
        return;
      }
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError || !data.session) {
        await navigate({ to: "/login" });
        return;
      }
      setUserName(
        (data.session.user.user_metadata?.["full_name"] as string | undefined) ??
          data.session.user.email?.split("@")[0] ??
          "cliente",
      );
      const { data: invitationRows } = await supabase
        .from("invitations")
        .select("id, title, event_type, status, updated_at")
        .eq("user_id", data.session.user.id)
        .order("updated_at", { ascending: false });
      setInvitations((invitationRows ?? []) as typeof invitations);
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function signOut() {
    await supabase?.auth.signOut();
    await navigate({ to: "/" });
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaf7] text-[#2f5145]">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (error)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-5">
        <div className="max-w-md rounded-3xl border border-[#e6e0d7] bg-white p-8 text-center shadow-sm">
          <Flower2 className="mx-auto text-[#bd8051]" />
          <h1 className="mt-4 font-serif text-3xl text-[#2f5145]">Conexão necessária</h1>
          <p className="mt-3 text-sm leading-6 text-[#77736b]">{error}</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-[#2f5145] px-5 py-3 text-sm font-medium text-white"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#292724]">
      <header className="border-b border-[#e6e0d7] bg-white/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <Link to="/" className="flex items-center gap-2.5 text-[#2f5145]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5eee6]">
              <Flower2 size={18} />
            </span>
            <span className="font-serif text-xl">meu convite</span>
          </Link>
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => setShowHowWorks(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5f7564] transition hover:text-[#2f5145]"
            aria-label="Ver como funciona"
          >
            <CircleHelp size={16} /> Como funciona
          </button>
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-2 text-sm text-[#77736b] transition hover:text-[#2f5145]"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>
      {showHowWorks && <HowItWorksModal onClose={() => setShowHowWorks(false)} />}
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#bd8051]">
              Área do contratante
            </p>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-[#2f5145]">
              Olá, {userName}.
            </h1>
            <p className="mt-2 text-[#77736b]">Vamos criar algo especial?</p>
          </div>
          <Link
            to="/criar"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f5145] px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-[#2f5145]/15 transition hover:-translate-y-0.5 hover:bg-[#234237]"
          >
            <Plus size={17} /> Criar novo convite
          </Link>
        </div>
        <section className="mt-12 rounded-3xl border border-[#e6e0d7] bg-white p-6 shadow-sm sm:p-8">
          {invitations.length > 0 ? (
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b968c]">
                    <Sparkles size={14} className="text-[#bd8051]" /> Seus convites
                  </div>
                  <h2 className="mt-3 font-serif text-3xl text-[#3c5145]">Seus rascunhos</h2>
                </div>
                <Link
                  to="/criar"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d9e4da] px-4 py-3 text-sm font-medium text-[#2f5145]"
                >
                  Novo <Plus size={15} />
                </Link>
              </div>
              <div className="mt-6 divide-y divide-[#eeeae3]">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-medium text-[#3f5146]">
                        {invitation.title || invitation.event_type}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-wider text-[#9b968c]">
                        {invitation.status === "draft" ? "Rascunho" : invitation.status}
                      </div>
                    </div>
                    <Link
                      to="/painel/$invitationId/rsvp"
                      params={{ invitationId: invitation.id }}
                      className="inline-flex items-center gap-2 self-start rounded-xl border border-[#d9e4da] px-4 py-2.5 text-sm font-medium text-[#2f5145]"
                    >
                      Ver RSVP <ArrowRight size={15} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b968c]">
                    <Sparkles size={14} className="text-[#bd8051]" /> Seus convites
                  </div>
                  <h2 className="mt-3 font-serif text-3xl text-[#3c5145]">
                    Ainda não há convites.
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[#77736b]">
                    Comece escolhendo um modelo e transforme os detalhes do seu evento em uma
                    experiência inesquecível.
                  </p>
                </div>
                <Link
                  to="/criar"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d9e4da] px-4 py-3 text-sm font-medium text-[#2f5145] transition hover:bg-[#f1f6f1]"
                >
                  Começar agora <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
        </section>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            [String(invitations.length), "Convites criados"],
            [
              String(invitations.filter((item) => item.status === "published").length),
              "Publicados",
            ],
            ["—", "Confirmações"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-[#e6e0d7] bg-white p-5">
              <div className="font-serif text-3xl text-[#2f5145]">{value}</div>
              <div className="mt-1 text-sm text-[#89857e]">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function HowItWorksModal({ onClose }: { onClose: () => void }) {
  const steps = [
    {
      Icon: CalendarDays,
      title: "1. Escolha o tipo de evento",
      text: "Comece escolhendo aniversário, casamento, 15 anos, chá de bebê, formatura, festa infantil ou outro momento especial.",
    },
    {
      Icon: Palette,
      title: "2. Escolha o seu modelo",
      text: "Selecione entre os estilos Jardim, Essência ou Celebre. Você poderá trocar o modelo enquanto estiver editando.",
    },
    {
      Icon: Sparkles,
      title: "3. Personalize o conteúdo",
      text: "Adicione título, frase de abertura, mensagem, data, horário, dress code e todos os detalhes que seus convidados precisam saber.",
    },
    {
      Icon: Upload,
      title: "4. Envie suas fotos e arquivos",
      text: "Faça upload da capa, galeria de fotos, vídeo e música. Os arquivos são armazenados no Supabase Storage com limite e formato validados.",
    },
    {
      Icon: MapPin,
      title: "5. Informe o local",
      text: "Cadastre o nome do espaço, endereço, link do Google Maps e instruções especiais para facilitar a chegada.",
    },
    {
      Icon: CheckCircle2,
      title: "6. Configure as confirmações",
      text: "Escolha RSVP nativo, Google Forms, WhatsApp ou desative a confirmação. No RSVP nativo, você acompanha nomes, status e acompanhantes.",
    },
    {
      Icon: Globe2,
      title: "7. Revise a prévia",
      text: "Veja o convite atualizado em tempo real. O rascunho é salvo automaticamente enquanto você preenche os dados.",
    },
    {
      Icon: Share2,
      title: "8. Publique e compartilhe",
      text: "Clique em Publicar convite para gerar seu link público. Depois, compartilhe pelo WhatsApp, redes sociais ou onde preferir.",
    },
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#293c32]/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-[#fbfaf7] p-6 shadow-2xl sm:p-9">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-[#89857e] transition hover:bg-[#eaf2eb] hover:text-[#2f5145]"
          aria-label="Fechar Como funciona"
        >
          <X size={20} />
        </button>
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#bd8051]">
            Guia Meu Convite
          </p>
          <h2 id="how-it-works-title" className="mt-3 font-serif text-4xl text-[#2f5145]">
            Como funciona?
          </h2>
          <p className="mt-3 leading-7 text-[#77736b]">
            Do primeiro detalhe ao link compartilhável, veja tudo o que você pode fazer dentro do
            Meu Convite.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {steps.map(({ Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-[#e6e0d7] bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf2eb] text-[#2f5145]">
                <Icon size={19} />
              </span>
              <h3 className="mt-4 font-medium text-[#3f5146]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#77736b]">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl bg-[#2f5145] p-5 text-sm leading-6 text-white/80">
          <strong className="text-white">Dica:</strong> você não precisa preencher tudo de uma vez.
          O salvamento automático permite sair e continuar depois sem perder seu trabalho.
        </div>
      </div>
    </div>
  );
}
