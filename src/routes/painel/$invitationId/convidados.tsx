/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Download,
  FileSpreadsheet,
  Loader2,
  MessageCircle,
  Plus,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

const db = supabase as any;
const DEFAULT_GUEST_INVITE_MESSAGE =
  "Olá, [NOME]! Você está convidado(a) para [EVENTO]. Abra seu convite: [LINK]";

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
  party_limit: number;
};

function GuestsPage() {
  const { invitationId } = Route.useParams();
  const [invitation, setInvitation] = useState<any>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partyLimit, setPartyLimit] = useState(1);
  const [inviteMessage, setInviteMessage] = useState(DEFAULT_GUEST_INVITE_MESSAGE);
  const [messageSaved, setMessageSaved] = useState(false);
  const [filter, setFilter] = useState<"all" | Guest["status"]>("all");
  const [copied, setCopied] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [{ data: inv }, { data: g }] = await Promise.all([
      db
        .from("invitations")
        .select("id,title,slug,status,event_date,event_time,rsvp_config")
        .eq("id", invitationId)
        .maybeSingle(),
      db.from("guests").select("*").eq("invitation_id", invitationId).order("created_at"),
    ]);
    setInvitation(inv);
    setInviteMessage(inv?.rsvp_config?.guestInviteMessage || DEFAULT_GUEST_INVITE_MESSAGE);
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

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const interval = window.setInterval(refreshIfVisible, 5000);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [load]);

  const linkFor = (g: Guest) =>
    `${window.location.origin}/convite/${invitation?.slug}?g=${g.token}`;

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await db.from("guests").insert({
      invitation_id: invitationId,
      name: name.trim(),
      whatsapp: phone.replace(/\D/g, ""),
      party_limit: Math.max(1, Math.min(20, partyLimit)),
    });
    setName("");
    setPhone("");
    setPartyLimit(1);
    void load();
  }
  async function remove(id: string) {
    await db.from("guests").delete().eq("id", id);
    void load();
  }
  async function updatePartyLimit(id: string, value: string) {
    const next = Math.max(1, Math.min(20, Number(value) || 1));
    await db.from("guests").update({ party_limit: next }).eq("id", id);
    void load();
  }
  async function saveInviteMessage() {
    if (!invitation) return;
    const rsvpConfig = {
      ...(invitation.rsvp_config ?? {}),
      guestInviteMessage: inviteMessage.trim() || DEFAULT_GUEST_INVITE_MESSAGE,
    };
    const { error } = await db
      .from("invitations")
      .update({ rsvp_config: rsvpConfig })
      .eq("id", invitationId);
    if (!error) {
      setInvitation((current: any) => ({ ...current, rsvp_config: rsvpConfig }));
      setMessageSaved(true);
      window.setTimeout(() => setMessageSaved(false), 1800);
    }
  }
  function sendWhatsapp(g: Guest, reminder: boolean) {
    const customMessage = inviteMessage
      .replaceAll("[NOME]", g.name)
      .replaceAll("[EVENTO]", invitation?.title || "nosso evento")
      .replaceAll("[LINK]", linkFor(g))
      .replaceAll("[LIMITE]", String(g.party_limit ?? 1));
    const text = reminder
      ? `Olá ${g.name}! Ainda não recebemos sua resposta para o convite de ${invitation?.title}. Pode confirmar por aqui? ${linkFor(g)}`
      : g.status === "confirmed"
        ? `Olá, ${g.name}! Confirmamos sua presença em ${invitation?.title}. Serão ${g.companions + 1} pessoa(s) no total. Será uma alegria receber vocês!`
        : customMessage;
    const num = g.whatsapp.length <= 11 ? `55${g.whatsapp}` : g.whatsapp;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
    if (reminder)
      void db.from("guests").update({ reminded_at: new Date().toISOString() }).eq("id", g.id);
  }
  function sendEventReminder(g: Guest) {
    const date = invitation?.event_date
      ? new Date(`${invitation.event_date}T00:00:00`).toLocaleDateString("pt-BR")
      : "em breve";
    const time = invitation?.event_time ? ` às ${String(invitation.event_time).slice(0, 5)}` : "";
    const text = `Olá, ${g.name}! Lembrete: o evento será em ${date}${time}. Confirmamos ${g.companions + 1} pessoa(s) da sua família. Esperamos vocês!`;
    const num = g.whatsapp.length <= 11 ? `55${g.whatsapp}` : g.whatsapp;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
    void db.from("guests").update({ reminded_at: new Date().toISOString() }).eq("id", g.id);
  }
  function copy(g: Guest) {
    void navigator.clipboard.writeText(linkFor(g));
    setCopied(g.id);
    setTimeout(() => setCopied(""), 1500);
  }

  function exportGuests(format: "csv" | "xlsx") {
    const rows = guests.map((guest) => ({
      Nome: guest.name,
      WhatsApp: guest.whatsapp,
      Status:
        guest.status === "confirmed"
          ? "Confirmado"
          : guest.status === "declined"
            ? "Não poderá comparecer"
            : "Pendente",
      Acompanhantes: guest.companions,
      Total_de_pessoas: guest.companions + (guest.status === "confirmed" ? 1 : 0),
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 26 }, { wch: 16 }, { wch: 18 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Convidados");
    const baseName = (invitation?.title || "lista-de-convidados")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/(^-|-$)/g, "")
      .toLowerCase();
    XLSX.writeFile(workbook, `${baseName || "convidados"}.${format === "csv" ? "csv" : "xlsx"}`, {
      bookType: format === "csv" ? "csv" : "xlsx",
    });
  }

  async function importGuests(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImporting(true);
    setImportMessage("");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("A planilha não possui nenhuma aba.");
      const firstSheet = workbook.Sheets[firstSheetName];
      if (!firstSheet) throw new Error("Não foi possível ler a primeira aba da planilha.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      const records = rows
        .map((row) => {
          const value = (keys: string[]) => {
            const key = Object.keys(row).find((candidate) =>
              keys.includes(candidate.trim().toLowerCase()),
            );
            return key ? String(row[key] ?? "").trim() : "";
          };
          const statusText = value(["status", "situação", "situacao"]);
          const normalizedStatus = statusText.toLowerCase();
          const status: Guest["status"] =
            normalizedStatus.includes("não") ||
            normalizedStatus.includes("nao") ||
            normalizedStatus.includes("declin")
              ? "declined"
              : normalizedStatus.includes("confirm")
                ? "confirmed"
                : "pending";
          const companionsText = value(["acompanhantes", "acompanhante", "companions"]);
          const companions = Math.max(0, Math.min(20, Number.parseInt(companionsText, 10) || 0));
          return {
            invitation_id: invitationId,
            name: value(["nome", "name"]).slice(0, 160),
            whatsapp: value(["whatsapp", "telefone", "phone"]).replace(/\D/g, ""),
            status,
            companions: status === "confirmed" ? companions : 0,
            responded_at: status === "pending" ? null : new Date().toISOString(),
          };
        })
        .filter((record) => record.name);
      if (!records.length) throw new Error("Nenhuma linha com a coluna Nome foi encontrada.");
      if (records.length > 500) throw new Error("Importe no máximo 500 convidados por vez.");
      const { error } = await db.from("guests").insert(records);
      if (error) throw error;
      setImportMessage(`${records.length} convidado(s) importado(s) com sucesso.`);
      await load();
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : "Não foi possível importar o arquivo.",
      );
    } finally {
      setImporting(false);
    }
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e4f0e5]">
              <Users size={16} />
            </span>
            <span className="font-serif text-xl">meu convite</span>
          </div>
          <span className="hidden text-sm text-[#89857e] sm:block">Área do contratante</span>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#bd8051]">
          Lista do evento
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#2f5145] sm:text-5xl">
          Convidados · {invitation?.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[#77736b]">
          Cadastre os responsáveis, defina o limite da família e acompanhe cada resposta.
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportGuests("csv")}
            disabled={!guests.length}
            className="inline-flex items-center gap-2 rounded-full border border-[#dce7dd] bg-white px-4 py-2.5 text-xs font-semibold text-[#4e4a43] transition hover:border-[#6b927c] disabled:opacity-50"
          >
            <Download size={15} /> Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => exportGuests("xlsx")}
            disabled={!guests.length}
            className="inline-flex items-center gap-2 rounded-full border border-[#dce7dd] bg-white px-4 py-2.5 text-xs font-semibold text-[#4e4a43] transition hover:border-[#6b927c] disabled:opacity-50"
          >
            <FileSpreadsheet size={15} /> Exportar Excel
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-full bg-[#2f5145] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#244238] disabled:opacity-50"
          >
            <Upload size={15} /> {importing ? "Importando…" : "Importar CSV/Excel"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(event) => void importGuests(event)}
            className="hidden"
          />
        </div>
        {importMessage && <p className="mt-3 text-sm text-[#5d7a67]">{importMessage}</p>}
        {invitation?.status !== "published" && (
          <p className="mt-4 rounded-2xl bg-[#fff3dc] p-4 text-sm text-[#8a6a3e]">
            Este convite ainda não foi publicado. Os links só funcionam depois da publicação.
          </p>
        )}

        <section className="mt-8 rounded-3xl border border-[#e6e0d7] bg-white p-5 shadow-[0_10px_30px_rgba(47,81,69,0.04)] sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="font-serif text-2xl text-[#2f5145]">Mensagem do convite</p>
              <p className="mt-1 text-sm text-[#89857e]">
                Personalize o texto que será aberto no WhatsApp com o link de cada convidado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void saveInviteMessage()}
              className="rounded-full bg-[#2f5145] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#244238]"
            >
              {messageSaved ? "Mensagem salva" : "Salvar mensagem"}
            </button>
          </div>
          <textarea
            value={inviteMessage}
            onChange={(event) => setInviteMessage(event.target.value)}
            rows={4}
            className="mt-5 w-full rounded-2xl border border-[#dedbd3] bg-[#fffefa] px-4 py-3 text-sm leading-6 text-[#4e4a43] outline-none focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
          />
          <p className="mt-2 text-xs leading-5 text-[#89857e]">
            Use <strong>[NOME]</strong>, <strong>[EVENTO]</strong>, <strong>[LINK]</strong> e{" "}
            <strong>[LIMITE]</strong> para preencher automaticamente.
          </p>
        </section>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "confirmed", label: "Confirmados", v: counts.confirmed, I: Check },
            { k: "declined", label: "Não vão", v: counts.declined, I: X },
            { k: "pending", label: "Sem resposta", v: counts.pending, I: Clock },
            { k: "all", label: "Acompanhantes", v: counts.companions, I: Plus },
          ].map(({ k, label, v, I }) => (
            <button
              key={label}
              onClick={() => setFilter(k as any)}
              className={`rounded-2xl border p-4 text-left transition ${filter === k ? "border-[#2f5145] bg-[#eaf2eb]" : "border-[#e6e0d7] bg-white hover:border-[#a8c2ad]"}`}
            >
              <I size={18} className="text-[#4d8060]" />
              <div className="mt-2 font-serif text-3xl text-[#2f5145]">{v}</div>
              <div className="text-sm text-[#89857e]">{label}</div>
            </button>
          ))}
        </div>

        <form
          onSubmit={addGuest}
          className="mt-8 rounded-3xl border border-[#e6e0d7] bg-white p-5 shadow-[0_10px_30px_rgba(47,81,69,0.04)] sm:p-6"
        >
          <div className="mb-4">
            <p className="font-serif text-2xl text-[#2f5145]">Adicionar convidado</p>
            <p className="mt-1 text-sm text-[#89857e]">
              O limite define quantas pessoas poderão confirmar neste link.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_150px_auto] sm:items-end">
            <label className="text-xs font-medium text-[#4e4a43]">
              Nome do responsável
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: José da Silva"
                className="mt-1.5 w-full rounded-xl border border-[#dedbd3] bg-[#fffefa] px-4 py-3 text-sm outline-none focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
              />
            </label>
            <label className="text-xs font-medium text-[#4e4a43]">
              WhatsApp com DDD
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="31-99999-9999"
                className="mt-1.5 w-full rounded-xl border border-[#dedbd3] bg-[#fffefa] px-4 py-3 text-sm outline-none focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
              />
            </label>
            <label className="text-xs font-medium text-[#4e4a43]">
              Limite familiar
              <input
                type="number"
                min={1}
                max={20}
                value={partyLimit}
                onChange={(e) =>
                  setPartyLimit(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                }
                className="mt-1.5 w-full rounded-xl border border-[#dedbd3] bg-[#fffefa] px-4 py-3 text-sm outline-none focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
              />
            </label>
            <button className="rounded-xl bg-[#2f5145] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244238]">
              <Plus className="mr-1 inline" size={16} /> Adicionar
            </button>
          </div>
        </form>

        <div className="mt-8 overflow-hidden rounded-3xl border border-[#e6e0d7] bg-white shadow-[0_10px_30px_rgba(47,81,69,0.04)]">
          {shown.length === 0 && (
            <p className="p-10 text-center text-sm text-[#89857e]">Nenhum convidado aqui.</p>
          )}
          {shown.map((g) => (
            <div
              key={g.id}
              className="flex flex-col gap-4 border-b border-[#eeeae3] p-5 last:border-b-0 sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <div className="font-serif text-xl text-[#2f5145]">{g.name}</div>
                <div className="mt-1 text-sm text-[#89857e]">
                  {g.status === "confirmed"
                    ? `Confirmado${g.companions ? ` · +${g.companions}` : ""}`
                    : g.status === "declined"
                      ? "Não poderá comparecer"
                      : "Ainda não respondeu"}
                  {g.whatsapp && ` · ${g.whatsapp}`}
                </div>
                <div className="mt-3 max-w-xs">
                  <div className="flex items-center justify-between text-xs font-medium text-[#5d7a67]">
                    <span>Membros cadastrados</span>
                    <span>
                      {g.status === "confirmed" ? g.companions + 1 : 0} de {g.party_limit ?? 1}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eaf2eb]">
                    <div
                      className="h-full rounded-full bg-[#6b927c] transition-all"
                      style={{
                        width: `${Math.min(100, ((g.status === "confirmed" ? g.companions + 1 : 0) / (g.party_limit || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1 rounded-full border border-[#dce7dd] px-3 py-2 text-xs text-[#77736b]">
                  Limite
                  <input
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={g.party_limit ?? 1}
                    onBlur={(event) => void updatePartyLimit(g.id, event.target.value)}
                    className="w-8 bg-transparent text-center text-[#2f5145] outline-none"
                    aria-label={`Limite de pessoas para ${g.name}`}
                  />
                </label>
                <button
                  onClick={() => copy(g)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#dce7dd] px-3 py-2 text-xs text-[#4e4a43] transition hover:border-[#6b927c]"
                >
                  <Copy size={14} /> {copied === g.id ? "Copiado!" : "Copiar link"}
                </button>
                {g.whatsapp && (
                  <button
                    onClick={() => sendWhatsapp(g, false)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#dce7dd] px-3 py-2 text-xs text-[#4e4a43] transition hover:border-[#6b927c]"
                  >
                    <MessageCircle size={14} /> Enviar convite
                  </button>
                )}
                {g.whatsapp && g.status === "confirmed" && (
                  <button
                    onClick={() => sendEventReminder(g)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#cfe0d2] bg-[#eaf2eb] px-3 py-2 text-xs text-[#4d8060]"
                  >
                    <MessageCircle size={14} /> Lembrete manual
                  </button>
                )}
                {g.whatsapp && g.status === "pending" && (
                  <button
                    onClick={() => sendWhatsapp(g, true)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#2f5145] px-3 py-2 text-xs font-semibold text-white"
                  >
                    <MessageCircle size={14} /> Lembrar
                  </button>
                )}
                <button
                  onClick={() => remove(g.id)}
                  aria-label="Remover"
                  className="rounded-full border border-[#ead9d3] px-2.5 py-2 text-[#9b4e3c] transition hover:bg-[#f8e5df]"
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
