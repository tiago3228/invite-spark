import { FormEvent, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flower2,
  Loader2,
  Mail,
  Lock,
  Phone,
  UserRound,
} from "lucide-react";
import { isSupabaseConfigured, supabase, getSupabaseSetupMessage } from "@/lib/supabase";

type AuthMode = "signup" | "login";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string }>();
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);
    if (!isSupabaseConfigured || !supabase) {
      setMessage({ type: "error", text: getSupabaseSetupMessage() });
      return;
    }
    if (isSignup && !terms) {
      setMessage({ type: "error", text: "Aceite os termos de uso para continuar." });
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim(), whatsapp: whatsapp.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          await navigate({ to: "/painel" });
        } else {
          setMessage({
            type: "success",
            text: "Cadastro criado. Verifique seu e-mail para confirmar a conta e entrar.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        await navigate({ to: "/painel" });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Não foi possível concluir. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-[#fbfaf7] text-[#292724]">
      <div className="hidden w-[43%] flex-col justify-between bg-[#2f5145] p-10 text-white lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Flower2 size={18} />
          </span>
          <span className="font-serif text-xl">meu convite</span>
        </Link>
        <div className="max-w-md">
          <p className="text-xs uppercase tracking-[0.25em] text-[#e8b58b]">Um começo especial</p>
          <h1 className="mt-5 font-serif text-5xl leading-tight">
            Seu próximo capítulo começa aqui.
          </h1>
          <p className="mt-5 leading-7 text-white/65">
            Crie uma experiência que começa antes mesmo da celebração.
          </p>
        </div>
        <p className="text-sm text-white/45">Feito para celebrar momentos especiais.</p>
      </div>
      <div className="flex w-full flex-col px-5 py-7 sm:px-10 lg:w-[57%] lg:px-20">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-[#77736b] transition hover:text-[#2f5145] lg:hidden"
        >
          <ArrowLeft size={16} /> Voltar ao início
        </Link>
        <div className="m-auto w-full max-w-md py-10">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-2 text-[#2f5145]">
              <Flower2 size={18} />
              <span className="font-serif text-xl">meu convite</span>
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#bd8051]">
            {isSignup ? "Comece agora" : "Que bom ver você"}
          </p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight text-[#2f5145]">
            {isSignup ? "Crie sua conta." : "Entre na sua conta."}
          </h2>
          <p className="mt-3 text-[#77736b]">
            {isSignup
              ? "Leva menos de um minuto para começar seu convite."
              : "Continue criando momentos inesquecíveis."}
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#4e4a43]">
                    Nome completo
                  </span>
                  <span className="relative block">
                    <UserRound className="absolute left-3 top-3.5 text-[#a29d94]" size={17} />
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-[#dedbd3] bg-white px-10 py-3.5 outline-none transition placeholder:text-[#b1ada5] focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
                      placeholder="Como podemos chamar você?"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#4e4a43]">WhatsApp</span>
                  <span className="relative block">
                    <Phone className="absolute left-3 top-3.5 text-[#a29d94]" size={17} />
                    <input
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full rounded-xl border border-[#dedbd3] bg-white px-10 py-3.5 outline-none transition placeholder:text-[#b1ada5] focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
                      placeholder="(00) 00000-0000"
                    />
                  </span>
                </label>
              </>
            )}
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4e4a43]">E-mail</span>
              <span className="relative block">
                <Mail className="absolute left-3 top-3.5 text-[#a29d94]" size={17} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#dedbd3] bg-white px-10 py-3.5 outline-none transition placeholder:text-[#b1ada5] focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
                  placeholder="voce@email.com"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4e4a43]">Senha</span>
              <span className="relative block">
                <Lock className="absolute left-3 top-3.5 text-[#a29d94]" size={17} />
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#dedbd3] bg-white px-10 py-3.5 outline-none transition placeholder:text-[#b1ada5] focus:border-[#6b927c] focus:ring-4 focus:ring-[#dce9df]"
                  placeholder="Mínimo de 6 caracteres"
                />
              </span>
            </label>
            {isSignup && (
              <label className="flex items-start gap-3 text-sm leading-5 text-[#77736b]">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#2f5145]"
                />{" "}
                <span>Li e aceito os termos de uso e a política de privacidade.</span>
              </label>
            )}
            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm leading-5 ${message.type === "success" ? "bg-[#e4f0e5] text-[#2f6145]" : "bg-[#f8e5df] text-[#9b4e3c]"}`}
              >
                {message.text}
              </div>
            )}
            <button
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#2f5145] px-5 py-3.5 font-medium text-white transition hover:bg-[#234237] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isSignup ? (
                <>
                  Criar minha conta{" "}
                  <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                </>
              ) : (
                <>
                  Entrar <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <p className="mt-7 text-center text-sm text-[#77736b]">
            {isSignup ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
            <Link
              to={isSignup ? "/login" : "/cadastro"}
              className="font-semibold text-[#2f5145] hover:underline"
            >
              {isSignup ? "Entrar" : "Criar agora"}
            </Link>
          </p>
          {!isSupabaseConfigured && (
            <div className="mt-8 flex gap-2 rounded-xl border border-[#ead9bd] bg-[#fffaf0] p-3 text-xs leading-5 text-[#856a42]">
              <Check size={15} className="mt-0.5 shrink-0" /> A interface está pronta. A conexão com
              o Supabase será ativada assim que o projeto receber as variáveis do ambiente.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
