/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Loader2,
  MessageCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export const Route = createFileRoute("/painel/$invitationId/convidados")({
  component: GuestsPage,
  head: () => ({
    meta: [
      { title: "Convidados | Meu Convite" },
      { name: "description", content: "Acompanhe quem confirmou presença no seu convite." },
      { property: "og:title", content: "Convidados | Meu Convite" },
      { property: "og:description", content: "Acompanhe quem confirmou presença no seu convite." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Guest = {
  id: string;
  name: string;
  whatsapp: string;
  token: string;
  status: "pending" | "confirmed" | "declined";
  companions: number;
};

function GuestsPage() {
  const { invitationId } = Route.useParams();
  const [invitation, setInvitation] = useState<any>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [filter, setFilter] = useState<"all" | Guest["status"]>("all");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const [{ data: inv }, { data: g }] = await Promise.all([
      db.from("invitations").select("id,title,slug,status").eq("id", invitationId).maybeSingle(),
      db.from("guests").select("*").eq("invitation_id", invitationId).order("created_at"),
    ]);
    setInvitation(inv);
    setGuests(g ?? []);
    setLoading(false);
  }, [invitationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = db
      .channel(`invitation-guests-${invitationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guests",
          filter: `invitation_id=eq.${invitationId}`,
        },
        () => void load(),
      )
      .subscribe();

    return () => {
      void db.removeChannel(channel);
    };
  }, [invitationId, load]);

  const linkFor = (g: Guest) =>
    `${window.location.origin}/convite/${invitation?.slug}?g=${g.token}`;

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await db.from("guests").insert({
      invitation_id: invitationId,
      name: name.trim(),
      whatsapp: phone.replace(/\D/g, ""),
    });
    setName("");
    setPhone("");
    void load();
  }
  async function remove(id: string) {
    await db.from("guests").delete().eq("id", id);
    void load();
  }
  function sendWhatsapp(g: Guest, reminder: boolean) {
    const text = reminder
      ? `Olá ${g.name}! Ainda não recebemos sua resposta para o convite de ${invitation?.title}. Pode confirmar por aqui? ${linkFor(g)}`
      : `Olá ${g.name}! Você está convidado(a) para ${invitation?.title}. Abra seu convite: ${linkFor(g)}`;
    const num = g.whatsapp.length <= 11 ? `55${g.whatsapp}` : g.whatsapp;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
    if (reminder)
      void db.from("guests").update({ reminded_at: new Date().toISOString() }).eq("id", g.id);
  }
  function copy(g: Guest) {
    void navigator.clipboard.writeText(linkFor(g));
    setCopied(g.id);
    setTimeout(() => setCopied(""), 1500);
  }

  const counts = useMemo(
    () => ({
      confirmed: guests.filter((g) => g.status === "confirmed").length,
      declined: guests.filter((g) => g.status === "declined").length,
      pending: guests.filter((g) => g.status === "pending").length,
      companions: guests.reduce((t, g) => t + (g.status === "confirmed" ? g.companions : 0), 0),
    }),
    [guests],
  );
  const shown = guests.filter((g) => filter === "all" || g.status === filter);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link to="/painel" className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft size={16} /> Voltar ao painel
        </Link>
        <h1 className="mt-4 font-serif text-4xl">Convidados · {invitation?.title}</h1>
        {invitation?.status !== "published" && (
          <p className="mt-3 rounded-xl bg-muted p-3 text-sm">
            Este convite ainda não foi publicado. Os links só funcionam depois da publicação.
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "confirmed", label: "Confirmados", v: counts.confirmed, I: Check },
            { k: "declined", label: "Não vão", v: counts.declined, I: X },
            { k: "pending", label: "Sem resposta", v: counts.pending, I: Clock },
            { k: "all", label: "Acompanhantes", v: counts.companions, I: Plus },
          ].map(({ k, label, v, I }) => (
            <button
              key={label}
              onClick={() => setFilter(k as any)}
              className={`rounded-2xl border p-4 text-left ${filter === k ? "border-primary" : "border-border"} bg-card`}
            >
              <I size={18} className="text-primary" />
              <div className="mt-2 font-serif text-3xl">{v}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </button>
          ))}
        </div>

        <form onSubmit={addGuest} className="mt-6 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do convidado"
            className="flex-1 rounded-xl border border-input bg-card px-4 py-3"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp com DDD"
            className="rounded-xl border border-input bg-card px-4 py-3 sm:w-56"
          />
          <button className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">
            Adicionar
          </button>
        </form>

        <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
          {shown.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">Nenhum convidado aqui.</p>
          )}
          {shown.map((g) => (
            <div key={g.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="font-medium">{g.name}</div>
                <div className="text-sm text-muted-foreground">
                  {g.status === "confirmed"
                    ? `Confirmado${g.companions ? ` · +${g.companions}` : ""}`
                    : g.status === "declined"
                      ? "Não poderá comparecer"
                      : "Ainda não respondeu"}
                  {g.whatsapp && ` · ${g.whatsapp}`}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copy(g)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs"
                >
                  <Copy size={14} /> {copied === g.id ? "Copiado!" : "Copiar link"}
                </button>
                {g.whatsapp && (
                  <button
                    onClick={() => sendWhatsapp(g, false)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs"
                  >
                    <MessageCircle size={14} /> Enviar convite
                  </button>
                )}
                {g.whatsapp && g.status === "pending" && (
                  <button
                    onClick={() => sendWhatsapp(g, true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    <MessageCircle size={14} /> Lembrar
                  </button>
                )}
                <button
                  onClick={() => remove(g.id)}
                  aria-label="Remover"
                  className="rounded-lg border border-border px-2 py-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
