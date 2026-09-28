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
  MapPin,
  Palette,
  Plus,
  Share2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { supabase, getSupabaseSetupMessage } from "@/lib/supabase";
import { DashboardShell } from "@/components/DashboardShell";

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
    <DashboardShell
      userName={userName}
      onSignOut={() => void signOut()}
      onHowWorks={() => setShowHowWorks(true)}
    >
      {showHowWorks && <HowItWorksModal onClose={() => setShowHowWorks(false)} />}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#bd8051]">
            Visão geral
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#263d34] sm:text-5xl">
            Olá, {userName}.
          </h1>
          <p className="mt-2 text-[#7b887f]">Tudo pronto para criar um convite inesquecível?</p>
        </div>
        <Link
          to="/criar"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f5145] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#2f5145]/15 transition hover:-translate-y-0.5 hover:bg-[#234237]"
        >
          <Plus size={17} /> Criar novo convite
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          [String(invitations.length), "Convites criados", "Seus projetos"],
          [
            String(invitations.filter((item) => item.status === "published").length),
            "Publicados",
            "Links ativos",
          ],
          ["—", "Confirmações", "Em breve"],
        ].map(([value, label, hint]) => (
          <div
            key={label}
            className="rounded-2xl border border-[#e4ebe4] bg-white p-5 shadow-[0_8px_24px_rgba(47,81,69,0.04)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-semibold tracking-tight text-[#2f5145]">{value}</div>
                <div className="mt-1 text-sm font-medium text-[#506258]">{label}</div>
              </div>
              <span className="rounded-lg bg-[#edf5ee] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6a8270]">
                {hint}
              </span>
            </div>
          </div>
        ))}
      </div>
      <section className="mt-8 rounded-2xl border border-[#e4ebe4] bg-white p-5 shadow-[0_8px_24px_rgba(47,81,69,0.04)] sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#9aa69d]">
              <Sparkles size={14} className="text-[#bd8051]" /> Seus convites
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#33493d]">
              Projetos recentes
            </h2>
          </div>
          <Link
            to="/criar"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-[#d9e5da] px-3.5 py-2.5 text-xs font-semibold text-[#2f5145] transition hover:bg-[#f2f7f2]"
          >
            Novo projeto <Plus size={14} />
          </Link>
        </div>
        {invitations.length > 0 ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="group rounded-xl border border-[#edf1ed] bg-[#fbfcfb] p-4 transition hover:border-[#cbdccc] hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#3f5146]">
                      {invitation.title || invitation.event_type}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#98a39b]">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${invitation.status === "published" ? "bg-[#6c9476]" : "bg-[#d1a06e]"}`}
                      />
                      {invitation.status === "draft" ? "Rascunho" : invitation.status}
                    </div>
                  </div>
                  <span className="rounded-lg bg-white px-2 py-1 text-[10px] text-[#98a39b]">
                    {new Date(invitation.updated_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to="/criar"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#eaf2eb] px-3 py-2 text-xs font-semibold text-[#2f5145]"
                  >
                    Editar convite <ArrowRight size={14} />
                  </Link>
                  <Link
                    to="/painel/$invitationId/rsvp"
                    params={{ invitationId: invitation.id }}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#dce7dd] px-3 py-2 text-xs font-semibold text-[#63736a]"
                  >
                    Ver RSVP
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-[#d7e2d8] bg-[#f9fbf9] px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf2eb] text-[#2f5145]">
              <Sparkles size={20} />
            </div>
            <h3 className="mt-4 font-semibold text-[#3f5146]">Seu primeiro convite começa aqui</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7b887f]">
              Escolha um modelo, adicione seus detalhes e publique um link pronto para compartilhar.
            </p>
            <Link
              to="/criar"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#2f5145] px-4 py-3 text-xs font-semibold text-white"
            >
              Começar agora <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>
      <div className="mt-5 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl bg-[#2f5145] p-6 text-white shadow-lg shadow-[#2f5145]/10">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e8b58b]">
                Seu próximo passo
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Deixe seu convite com a sua cara.
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/65">
                Fotos, música, mapa, confirmação de presença e tudo que seus convidados precisam.
              </p>
            </div>
            <Upload className="hidden text-[#e8b58b] sm:block" size={28} strokeWidth={1.5} />
          </div>
          <Link
            to="/criar"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-xs font-semibold text-[#2f5145]"
          >
            Personalizar agora <ArrowRight size={14} />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setShowHowWorks(true)}
          className="rounded-2xl border border-[#e4ebe4] bg-white p-6 text-left shadow-[0_8px_24px_rgba(47,81,69,0.04)] transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <CircleHelp className="text-[#bd8051]" size={22} />
          <h3 className="mt-4 font-semibold text-[#3f5146]">Como funciona?</h3>
          <p className="mt-2 text-sm leading-6 text-[#7b887f]">
            Veja o passo a passo completo para criar e compartilhar.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2f5145]">
            Abrir guia <ArrowRight size={13} />
          </span>
        </button>
      </div>
    </DashboardShell>
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
