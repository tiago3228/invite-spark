import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Flower2,
  Globe2,
  Loader2,
  MapPin,
  Palette,
  Plus,
  Share2,
  Sparkles,
  Trash2,
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
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [error, setError] = useState("");
  const [showHowWorks, setShowHowWorks] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<
    Array<{
      id: string;
      title: string | null;
      slug: string | null;
      event_type: string;
      status: string;
      updated_at: string;
      content: unknown;
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
      const rpcClient = supabase as typeof supabase & {
        rpc: (fn: string, args: { _user_id: string }) => Promise<{ data: boolean | null }>;
      };
      const { data: masterAdmin } = await rpcClient.rpc("is_master_admin", {
        _user_id: data.session.user.id,
      });
      setIsMasterAdmin(Boolean(masterAdmin));
      const { data: invitationRows } = await supabase
        .from("invitations")
        .select("id, title, event_type, status, updated_at, content, slug")
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

  async function deleteInvitation(invitation: (typeof invitations)[number]) {
    const name = invitation.title || invitation.event_type || "este convite";
    if (!window.confirm(`Excluir ${name}? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(invitation.id);
    const { error: deleteError } = await supabase
      .from("invitations")
      .delete()
      .eq("id", invitation.id);
    setDeletingId(null);
    if (deleteError) {
      setError("Não foi possível excluir o convite. Tente novamente.");
      return;
    }
    setInvitations((current) => current.filter((item) => item.id !== invitation.id));
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaf7] text-[#2c302d]">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (error)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-5">
        <div className="max-w-md rounded-3xl border border-[#e6e0d7] bg-white p-8 text-center shadow-sm">
          <Flower2 className="mx-auto text-[#a76e59]" />
          <h1 className="mt-4 font-serif text-3xl text-[#2c302d]">Conexão necessária</h1>
          <p className="mt-3 text-sm leading-6 text-[#77736b]">{error}</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-[#2c302d] px-5 py-3 text-sm font-medium text-white"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    );

  return (
    <DashboardShell
      userName={userName}
      isMasterAdmin={isMasterAdmin}
      onSignOut={() => void signOut()}
      onHowWorks={() => setShowHowWorks(true)}
    >
      {showHowWorks && <HowItWorksModal onClose={() => setShowHowWorks(false)} />}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#a76e59]">
            Visão geral
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#263d34] sm:text-5xl">
            Olá, {userName}.
          </h1>
          <p className="mt-2 text-[#777a74]">Tudo pronto para criar um convite inesquecível?</p>
        </div>
        <Link
          to="/criar"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2c302d] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#2c302d]/15 transition hover:-translate-y-0.5 hover:bg-[#1d211f]"
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
            className="rounded-2xl border border-[#e8e8e3] bg-white p-5 shadow-[0_8px_24px_rgba(47,81,69,0.04)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-semibold tracking-tight text-[#2c302d]">{value}</div>
                <div className="mt-1 text-sm font-medium text-[#676b64]">{label}</div>
              </div>
              <span className="rounded-lg bg-[#f5eee9] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9a6b58]">
                {hint}
              </span>
            </div>
          </div>
        ))}
      </div>
      <section className="mt-8 rounded-2xl border border-[#e8e8e3] bg-white p-5 shadow-[0_8px_24px_rgba(47,81,69,0.04)] sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#9d9d96]">
              <Sparkles size={14} className="text-[#a76e59]" /> Meus Convites
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#343833]">
              Seus convites
            </h2>
          </div>
          <Link
            to="/criar"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-[#d9e5da] px-3.5 py-2.5 text-xs font-semibold text-[#2c302d] transition hover:bg-[#faf6f2]"
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
                <div
                  className={`relative mb-4 h-36 overflow-hidden rounded-lg ${invitation.event_type.toLowerCase().includes("casamento") ? "theme-essence" : invitation.event_type.toLowerCase().includes("anivers") ? "theme-celebrate" : "theme-garden"}`}
                >
                  {getCoverUrl(invitation.content) ? (
                    <img
                      src={getCoverUrl(invitation.content)}
                      alt={`Capa do convite ${invitation.title || invitation.event_type}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <span className="text-[10px] uppercase tracking-[0.24em] text-[#637667]">
                        Meu Convite
                      </span>
                      <span className="mt-2 max-w-[80%] truncate font-serif text-2xl italic text-[#2f5145]">
                        {invitation.title || invitation.event_type}
                      </span>
                    </div>
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-white/80 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#777a74] backdrop-blur">
                    Preview
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#41443f]">
                      {invitation.title || invitation.event_type}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#a0a19a]">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${invitation.status === "published" ? "bg-[#7e9c86]" : "bg-[#c59475]"}`}
                      />
                      {invitation.status === "draft" ? "Rascunho" : invitation.status}
                    </div>
                  </div>
                  <span className="rounded-lg bg-white px-2 py-1 text-[10px] text-[#a0a19a]">
                    {new Date(invitation.updated_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={`/criar?invitationId=${encodeURIComponent(invitation.id)}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#f3ebe5] px-3 py-2 text-xs font-semibold text-[#2c302d]"
                  >
                    Editar convite <ArrowRight size={14} />
                  </a>
                  <Link
                    to="/painel/$invitationId/rsvp"
                    params={{ invitationId: invitation.id }}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#dce7dd] px-3 py-2 text-xs font-semibold text-[#777a74]"
                  >
                    Ver RSVP
                  </Link>
                  <Link
                    to="/painel/$invitationId/convidados"
                    params={{ invitationId: invitation.id }}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2f5145] px-3 py-2 text-xs font-semibold text-white"
                  >
                    Convidados e links
                  </Link>
                  {invitation.slug && invitation.status === "published" && (
                    <a
                      href={`/convite/${encodeURIComponent(invitation.slug)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-[#dce7dd] px-3 py-2 text-xs font-semibold text-[#2f5145]"
                    >
                      <ExternalLink size={14} /> Ver convite
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => void deleteInvitation(invitation)}
                    disabled={deletingId === invitation.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#f0d4cc] px-3 py-2 text-xs font-semibold text-[#9b4e3c] disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {deletingId === invitation.id ? "Excluindo…" : "Excluir"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-[#dfd5cf] bg-[#fdfbf9] px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3ebe5] text-[#2c302d]">
              <Sparkles size={20} />
            </div>
            <h3 className="mt-4 font-semibold text-[#41443f]">Seu primeiro convite começa aqui</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#777a74]">
              Escolha um modelo, adicione seus detalhes e publique um link pronto para compartilhar.
            </p>
            <Link
              to="/criar"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#2c302d] px-4 py-3 text-xs font-semibold text-white"
            >
              Começar agora <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>
      <div className="mt-5 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl bg-[#2c302d] p-6 text-white shadow-lg shadow-[#2c302d]/10">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d5a487]">
                Seu próximo passo
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Deixe seu convite com a sua cara.
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/65">
                Fotos, música, mapa, confirmação de presença e tudo que seus convidados precisam.
              </p>
            </div>
            <Upload className="hidden text-[#d5a487] sm:block" size={28} strokeWidth={1.5} />
          </div>
          <Link
            to="/criar"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-xs font-semibold text-[#2c302d]"
          >
            Personalizar agora <ArrowRight size={14} />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setShowHowWorks(true)}
          className="rounded-2xl border border-[#e8e8e3] bg-white p-6 text-left shadow-[0_8px_24px_rgba(47,81,69,0.04)] transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <CircleHelp className="text-[#a76e59]" size={22} />
          <h3 className="mt-4 font-semibold text-[#41443f]">Como funciona?</h3>
          <p className="mt-2 text-sm leading-6 text-[#777a74]">
            Veja o passo a passo completo para criar e compartilhar.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2c302d]">
            Abrir guia <ArrowRight size={13} />
          </span>
        </button>
      </div>
    </DashboardShell>
  );
}

function getCoverUrl(content: unknown) {
  if (!content || typeof content !== "object") return "";
  const media = (content as { media?: unknown }).media;
  if (!media || typeof media !== "object") return "";
  const coverUrl = (media as { coverUrl?: unknown }).coverUrl;
  return typeof coverUrl === "string" ? coverUrl : "";
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
          className="absolute right-5 top-5 rounded-full p-2 text-[#89857e] transition hover:bg-[#f3ebe5] hover:text-[#2c302d]"
          aria-label="Fechar Como funciona"
        >
          <X size={20} />
        </button>
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a76e59]">
            Guia Meu Convite
          </p>
          <h2 id="how-it-works-title" className="mt-3 font-serif text-4xl text-[#2c302d]">
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
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3ebe5] text-[#2c302d]">
                <Icon size={19} />
              </span>
              <h3 className="mt-4 font-medium text-[#41443f]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#77736b]">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl bg-[#2c302d] p-5 text-sm leading-6 text-white/80">
          <strong className="text-white">Dica:</strong> você não precisa preencher tudo de uma vez.
          O salvamento automático permite sair e continuar depois sem perder seu trabalho.
        </div>
      </div>
    </div>
  );
}
