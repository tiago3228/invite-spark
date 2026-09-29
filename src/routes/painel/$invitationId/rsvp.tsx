import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Flower2,
  Loader2,
  MessageCircle,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listOwnRsvps, type Rsvp, type RsvpStatus } from "@/lib/rsvp";

export const Route = createFileRoute("/painel/$invitationId/rsvp")({
  component: RsvpDashboard,
  head: () => ({ meta: [{ title: "Confirmações | Meu Convite" }] }),
});

type SummaryCard = { label: string; value: number; Icon: typeof Check; color: string };

function RsvpDashboard() {
  const { invitationId } = Route.useParams();
  const [rows, setRows] = useState<Rsvp[]>([]);
  const [filter, setFilter] = useState<"all" | RsvpStatus>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setLoading(false);
        return;
      }
      try {
        const result = await listOwnRsvps(invitationId, data.session.user.id);
        if (active) setRows(result);
      } catch (loadError) {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível carregar as confirmações.",
          );
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [invitationId]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (filter === "all" || row.status === filter) &&
          row.guest_name.toLowerCase().includes(search.toLowerCase()),
      ),
    [filter, rows, search],
  );
  const count = (status: RsvpStatus) => rows.filter((row) => row.status === status).length;
  const cards: SummaryCard[] = [
    {
      label: "Confirmados",
      value: count("confirmed"),
      Icon: Check,
      color: "text-[#4d8060] bg-[#e4f0e5]",
    },
    {
      label: "Não poderão ir",
      value: count("declined"),
      Icon: X,
      color: "text-[#9b4e3c] bg-[#f8e5df]",
    },
    {
      label: "Acompanhantes",
      value: rows.reduce((total, row) => total + row.companions, 0),
      Icon: Users,
      color: "text-[#8a6a3e] bg-[#fff3dc]",
    },
  ];

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaf7] text-[#2f5145]">
        <Loader2 className="animate-spin" />
      </div>
    );
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#292724]">
      <header className="border-b border-[#e6e0d7] bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/painel" className="flex items-center gap-2 text-sm text-[#77736b]">
            <ArrowLeft size={16} /> Voltar ao painel
          </Link>
          <div className="flex items-center gap-2 text-[#2f5145]">
            <Flower2 size={18} />
            <span className="font-serif text-xl">meu convite</span>
          </div>
          <span className="text-sm text-[#89857e]">{rows.length} respostas</span>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#bd8051]">
          Área do contratante
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#2f5145]">Confirmações de presença</h1>
        <p className="mt-2 text-[#77736b]">
          As respostas são privadas e visíveis apenas para você.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {cards.map(({ label, value, Icon, color }) => (
            <div key={label} className="rounded-2xl border border-[#e6e0d7] bg-white p-5">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                <Icon size={17} />
              </span>
              <div className="mt-4 font-serif text-3xl text-[#2f5145]">{value}</div>
              <div className="mt-1 text-sm text-[#89857e]">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="relative block flex-1">
            <Search className="absolute left-3 top-3.5 text-[#a29d94]" size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome"
              className="w-full rounded-xl border border-[#dedbd3] bg-white px-10 py-3 outline-none focus:border-[#6b927c]"
            />
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | RsvpStatus)}
            className="rounded-xl border border-[#dedbd3] bg-white px-4 py-3 outline-none focus:border-[#6b927c]"
          >
            <option value="all">Todas as respostas</option>
            <option value="confirmed">Confirmados</option>
            <option value="declined">Não poderão ir</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>
        {error ? (
          <div className="mt-6 rounded-xl bg-[#f8e5df] p-4 text-sm text-[#9b4e3c]">{error}</div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#e6e0d7] bg-white">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#89857e]">
                <UserRound className="mx-auto mb-3 text-[#bd8051]" size={22} />
                Nenhuma resposta encontrada.
              </div>
            ) : (
              <div className="divide-y divide-[#eeeae3]">
                {filtered.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-medium text-[#3f5146]">{row.guest_name}</div>
                      <div className="mt-1 text-sm text-[#89857e]">
                        {row.companions > 0
                          ? `${row.companions} acompanhante(s)`
                          : "Sem acompanhantes"}
                        {row.whatsapp && ` · WhatsApp: ${row.whatsapp}`}
                        {row.note ? ` · ${row.note}` : ""}
                      </div>
                      {row.member_names.length > 0 && (
                        <div className="mt-2 text-xs text-[#5d7a67]">
                          Pessoas: {row.member_names.join(", ")}
                        </div>
                      )}
                    </div>
                    <span
                      className={`self-start rounded-full px-3 py-1 text-xs font-medium ${row.status === "confirmed" ? "bg-[#e4f0e5] text-[#4d8060]" : row.status === "declined" ? "bg-[#f8e5df] text-[#9b4e3c]" : "bg-[#fff3dc] text-[#8a6a3e]"}`}
                    >
                      {row.status === "confirmed"
                        ? "Confirmado"
                        : row.status === "declined"
                          ? "Não poderá ir"
                          : "Pendente"}
                    </span>
                    {row.whatsapp && (
                      <a
                        href={`https://wa.me/55${row.whatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Conversar com ${row.guest_name} no WhatsApp`}
                        className="self-start rounded-full border border-[#dce7dd] p-2 text-[#4d8060]"
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
