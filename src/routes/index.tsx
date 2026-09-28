import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Flower2,
  Heart,
  Image,
  MapPin,
  Music2,
  Play,
  QrCode,
  Sparkles,
  Video,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const features = [
  {
    icon: Image,
    title: "Fotos e galeria",
    text: "Conte a história do seu momento com uma galeria linda e leve.",
  },
  {
    icon: Music2,
    title: "Música especial",
    text: "Escolha a trilha que transforma o convite em uma experiência.",
  },
  {
    icon: Video,
    title: "Vídeo",
    text: "Inclua um vídeo para receber seus convidados de um jeito único.",
  },
  {
    icon: Sparkles,
    title: "Contagem regressiva",
    text: "Crie expectativa até o grande dia com uma contagem elegante.",
  },
  {
    icon: MapPin,
    title: "Localização",
    text: "Seus convidados chegam com facilidade pelo mapa integrado.",
  },
  {
    icon: Heart,
    title: "Confirmação de presença",
    text: "Acompanhe as respostas em um painel simples e organizado.",
  },
];

const themes = [
  { name: "Jardim", className: "theme-garden", label: "Floral delicado" },
  { name: "Essência", className: "theme-essence", label: "Minimalista" },
  { name: "Celebre", className: "theme-celebrate", label: "Festa vibrante" },
];

function Index() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f8f6] text-[#232522]">
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Meu Convite - início">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2c302d] text-[#f8f8f6] shadow-lg shadow-[#2c302d]/15">
            <Flower2 size={18} strokeWidth={1.7} />
          </span>
          <span className="font-serif text-xl tracking-tight">meu convite</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[#625f59] md:flex">
          <a href="#modelos" className="transition hover:text-[#2c302d]">
            Modelos
          </a>
          <a href="#como-funciona" className="transition hover:text-[#2c302d]">
            Como funciona
          </a>
          <a href="#recursos" className="transition hover:text-[#2c302d]">
            Recursos
          </a>
        </nav>
        <div className="flex items-center gap-2.5">
          <Link
            to="/login"
            className="hidden px-3 py-2 text-sm font-medium text-[#4d4a45] transition hover:text-[#2c302d] sm:block"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="rounded-full bg-[#2c302d] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#2c302d]/15 transition hover:-translate-y-0.5 hover:bg-[#1d211f]"
          >
            Criar convite
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 md:pt-16 lg:grid-cols-[0.94fr_1.06fr] lg:px-12 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e8e8e3] bg-white/70 px-3.5 py-2 text-xs font-medium tracking-wide text-[#777a74] shadow-sm backdrop-blur">
            <Sparkles size={14} /> Feito para celebrar o que importa
          </div>
          <h1 className="font-serif text-[clamp(3.25rem,7vw,6.5rem)] leading-[0.93] tracking-[-0.055em] text-[#263d34]">
            Seu momento merece um convite{" "}
            <span className="italic text-[#a76e59]">inesquecível.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-[#777a74]">
            Crie um convite digital completo, elegante e com a sua cara — em poucos minutos e sem
            depender de ninguém.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/cadastro"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#2c302d] px-6 py-4 font-medium text-white shadow-xl shadow-[#2c302d]/20 transition hover:-translate-y-0.5 hover:bg-[#1d211f]"
            >
              Criar meu convite{" "}
              <ArrowRight size={17} className="transition group-hover:translate-x-1" />
            </Link>
            <a
              href="#modelos"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e4e1dc] bg-white/50 px-6 py-4 font-medium text-[#4b4d49] transition hover:border-[#2c302d] hover:text-[#2c302d]"
            >
              Ver modelos <ChevronDown size={16} />
            </a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#777a74]">
            {[
              "Sem conhecimento técnico",
              "Visualização em tempo real",
              "Link pronto para compartilhar",
            ].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f0e4dd] text-[#2c302d]">
                  <Check size={10} strokeWidth={3} />
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="relative mx-auto min-h-[480px] w-full max-w-[580px] lg:min-h-[610px]">
          <div className="absolute right-0 top-0 h-[420px] w-[78%] rotate-[3deg] rounded-[2.5rem] bg-[#e8eee8] sm:h-[540px]" />
          <div className="absolute left-[9%] top-10 h-[400px] w-[74%] -rotate-[5deg] overflow-hidden rounded-[2.5rem] border-[9px] border-white bg-[#d7e1d7] shadow-2xl shadow-[#2c302d]/15 sm:h-[520px]">
            <div className="flex h-full flex-col items-center justify-between bg-[radial-gradient(circle_at_25%_18%,rgba(255,255,255,.85),transparent_28%),linear-gradient(150deg,#dbe8dc,#a9c6b0)] p-8 text-center sm:p-12">
              <div className="mt-2 text-xs uppercase tracking-[0.35em] text-[#496b59]">
                um dia para lembrar
              </div>
              <div>
                <div className="font-serif text-5xl italic leading-none text-[#2e5541] sm:text-7xl">
                  Marina
                </div>
                <div className="mt-3 font-serif text-2xl text-[#4b6a56] sm:text-3xl">
                  &amp; Daniel
                </div>
                <div className="mx-auto mt-6 h-px w-16 bg-[#6e8b75]" />
                <p className="mt-5 text-sm uppercase tracking-[0.28em] text-[#4b6a56]">
                  nosso casamento
                </p>
              </div>
              <div className="mb-2 text-sm tracking-[0.2em] text-[#4b6a56]">12 . 10 . 2026</div>
            </div>
          </div>
          <div className="absolute bottom-2 right-0 flex max-w-[210px] -rotate-3 items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-xl backdrop-blur sm:bottom-8 sm:right-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3e5d6] text-[#a76e59]">
              <Heart size={18} fill="currentColor" />
            </span>
            <span className="text-xs leading-5 text-[#615b54]">
              Feito com carinho
              <br />
              <strong className="text-[#2c302d]">para compartilhar</strong>
            </span>
          </div>
          <div className="absolute left-0 top-[43%] flex h-12 w-12 items-center justify-center rounded-full bg-[#d39b73] text-white shadow-xl shadow-[#d39b73]/20">
            <Play size={17} fill="currentColor" />
          </div>
        </div>
      </section>

      <section id="modelos" className="bg-[#f2f1ee] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a76e59]">
              Escolha seu estilo
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight text-[#2c302d] sm:text-5xl">
              Um começo bonito para cada história.
            </h2>
            <p className="mt-5 leading-7 text-[#777a74]">
              Modelos pensados para você só escolher, preencher e compartilhar.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {themes.map((theme, index) => (
              <div key={theme.name} className="group cursor-pointer">
                <div
                  className={`relative aspect-[0.92] overflow-hidden rounded-[1.65rem] ${theme.className} p-7 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl sm:p-9`}
                >
                  <div className="absolute right-5 top-5 rounded-full bg-white/70 px-3 py-1 text-[10px] uppercase tracking-wider text-[#53665a]">
                    0{index + 1}
                  </div>
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="text-xs uppercase tracking-[0.28em] text-[#61776a]">
                      convite
                    </div>
                    <div className="mt-3 font-serif text-5xl italic text-[#2c302d]">
                      {theme.name}
                    </div>
                    <div className="mt-5 h-px w-12 bg-[#8ca48d]" />
                    <div className="mt-4 text-xs uppercase tracking-[0.2em] text-[#61776a]">
                      {theme.label}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between px-1">
                  <span className="font-medium text-[#3c4941]">{theme.name}</span>
                  <span className="text-sm text-[#8b877e]">
                    Visualizar <ArrowRight size={14} className="ml-1 inline" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
      >
        <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a76e59]">
              Simples assim
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight text-[#2c302d] sm:text-5xl">
              Da ideia ao link em poucos passos.
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {[
              ["01", "Escolha seu modelo", "Encontre o estilo que combina com o seu evento."],
              ["02", "Personalize", "Adicione nomes, datas, fotos, música e todos os detalhes."],
              ["03", "Veja a prévia", "Experimente outros modelos até encontrar o seu favorito."],
              ["04", "Compartilhe", "Publique e envie seu convite pelo WhatsApp."],
            ].map(([number, title, text]) => (
              <div key={number} className="border-t border-[#e8e8e3] pt-5">
                <span className="text-sm font-medium text-[#a76e59]">{number}</span>
                <h3 className="mt-6 font-serif text-2xl text-[#3d5145]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#777a74]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="recursos"
        className="bg-[#2c302d] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d5a487]">
              Tudo no mesmo lugar
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              Seu convite, do seu jeito.
            </h2>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="border-t border-white/15 pt-5">
                <Icon size={21} className="text-[#d5a487]" strokeWidth={1.6} />
                <h3 className="mt-4 font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#f3e8e1] px-6 py-16 text-center sm:px-12">
          <QrCode className="mx-auto text-[#a76e59]" size={34} strokeWidth={1.3} />
          <h2 className="mx-auto mt-5 max-w-2xl font-serif text-4xl leading-tight text-[#41443f] sm:text-5xl">
            Crie um convite que as pessoas vão guardar.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[#777a74]">
            Seu próximo momento especial começa com um link.
          </p>
          <Link
            to="/cadastro"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#2c302d] px-6 py-4 font-medium text-white shadow-xl shadow-[#2c302d]/15 transition hover:-translate-y-0.5 hover:bg-[#1d211f]"
          >
            Criar meu convite <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#e8e8e3] px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-[#9d9d96] sm:flex-row">
          <span className="font-serif text-lg text-[#383b37]">meu convite</span>
          <span>Feito para celebrar momentos especiais.</span>
          <span>© 2026 Meu Convite</span>
        </div>
      </footer>
    </main>
  );
}
