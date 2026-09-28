/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, Flower2, Loader2 } from "lucide-react";
import { findPublishedInvitation, submitRsvp, type RsvpStatus } from "@/lib/rsvp";

export const Route = createFileRoute("/convite/$slug/confirmar")({
  component: ConfirmPresence,
  head: () => ({
    meta: [
      { title: "Confirmar presença | Meu Convite" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ConfirmPresence() {
  const { slug } = Route.useParams();
  const [invitation, setInvitation] = useState<any>();
  const [guestName, setGuestName] = useState("");
  const [status, setStatus] = useState<RsvpStatus>("confirmed");
  const [companions, setCompanions] = useState(0);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  useEffect(() => {
    void findPublishedInvitation(slug)
      .then(setInvitation)
      .catch(() => setError("Convite não encontrado."));
  }, [slug]);
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!invitation || !guestName.trim()) return;
    setState("loading");
    try {
      await submitRsvp({ invitationId: invitation.id, guestName, status, companions, note });
      setState("done");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível enviar sua resposta.",
      );
      setState("error");
    }
  }
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaf7] p-5 text-center text-[#77736b]">
        {error}
      </div>
    );
  if (!invitation)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaf7] text-[#2f5145]">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (state === "done")
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#dce8dd] px-5">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e4f0e5] text-[#2f5145]">
            <Check size={24} />
          </span>
          <h1 className="mt-5 font-serif text-3xl text-[#2f5145]">Resposta enviada!</h1>
          <p className="mt-3 text-sm leading-6 text-[#77736b]">
            Obrigado, {guestName}. Sua resposta foi registrada com carinho.
          </p>
          <Link
            to="/convite/$slug"
            params={{ slug }}
            className="mt-7 inline-flex rounded-full bg-[#2f5145] px-5 py-3 text-sm font-medium text-white"
          >
            Voltar ao convite
          </Link>
        </div>
      </main>
    );
  return (
    <main className="min-h-screen bg-[#fbfaf7] px-5 py-10 text-[#292724] sm:py-16">
      <div className="mx-auto max-w-lg">
        <Link
          to="/convite/$slug"
          params={{ slug }}
          className="flex items-center gap-2 text-sm text-[#77736b]"
        >
          <ArrowLeft size={16} /> Voltar ao convite
        </Link>
        <div className="mt-10 text-center">
          <Flower2 className="mx-auto text-[#bd8051]" size={24} />
          <h1 className="mt-4 font-serif text-4xl text-[#2f5145]">Confirme sua presença</h1>
          <p className="mt-3 text-[#77736b]">{invitation.title || invitation.event_type}</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5 rounded-3xl border border-[#e6e0d7] bg-white p-6 shadow-sm sm:p-8"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4e4a43]">Seu nome</span>
            <input
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Nome completo"
              className="w-full rounded-xl border border-[#dedbd3] px-4 py-3.5 outline-none focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
            />
          </label>
          <div>
            <span className="mb-2 block text-sm font-medium text-[#4e4a43]">
              Você poderá comparecer?
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStatus("confirmed")}
                className={`rounded-xl border p-3 text-sm ${status === "confirmed" ? "border-[#2f5145] bg-[#eaf2eb] text-[#2f5145]" : "border-[#e6e0d7]"}`}
              >
                Sim, estarei presente
              </button>
              <button
                type="button"
                onClick={() => setStatus("declined")}
                className={`rounded-xl border p-3 text-sm ${status === "declined" ? "border-[#9b4e3c] bg-[#f8e5df] text-[#9b4e3c]" : "border-[#e6e0d7]"}`}
              >
                Não poderei comparecer
              </button>
            </div>
          </div>
          {status === "confirmed" && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4e4a43]">Acompanhantes</span>
              <select
                value={companions}
                onChange={(e) => setCompanions(Number(e.target.value))}
                className="w-full rounded-xl border border-[#dedbd3] bg-white px-4 py-3.5 outline-none focus:border-[#6b927c]"
              >
                <option value={0}>Somente eu</option>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} acompanhante{value > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4e4a43]">
              Observação (opcional)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Alguma mensagem para os anfitriões?"
              className="w-full rounded-xl border border-[#dedbd3] px-4 py-3.5 outline-none focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
            />
          </label>
          {state === "error" && (
            <p className="rounded-xl bg-[#f8e5df] p-3 text-sm text-[#9b4e3c]">{error}</p>
          )}
          <button
            disabled={state === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f5145] px-5 py-3.5 font-medium text-white disabled:opacity-60"
          >
            {state === "loading" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Enviar confirmação"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
