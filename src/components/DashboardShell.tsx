import { Link, useRouterState } from "@tanstack/react-router";
import { CircleHelp, Flower2, LayoutDashboard, LogOut, Plus, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { PWAInstallButton } from "@/components/PWAInstallButton";

const navigation = [
  { to: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { to: "/criar", label: "Criar convite", icon: Plus },
] as const;

export function DashboardShell({
  children,
  userName,
  onSignOut,
  onHowWorks,
  isMasterAdmin,
}: {
  children: ReactNode;
  userName: string;
  onSignOut: () => void;
  onHowWorks: () => void;
  isMasterAdmin?: boolean;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="min-h-screen bg-[#f8f8f6] text-[#232522] lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-[#e9e8e3] bg-white lg:flex">
        <div className="flex h-20 items-center border-b border-[#f0efeb] px-6">
          <Link to="/" className="flex items-center gap-2.5 text-[#2c302d]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2c302d] text-white shadow-lg shadow-[#2c302d]/15">
              <Flower2 size={18} />
            </span>
            <span className="font-serif text-xl tracking-tight">meu convite</span>
          </Link>
        </div>
        <div className="flex flex-1 flex-col px-4 py-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d9d96]">
            Menu principal
          </p>
          <nav className="mt-3 space-y-1">
            {navigation.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-[#f3ebe5] text-[#2c302d]" : "text-[#777a74] hover:bg-[#faf8f6] hover:text-[#2c302d]"}`}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 rounded-2xl bg-[#2c302d] p-4 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Sparkles size={17} className="text-[#d5a487]" />
            </div>
            <p className="mt-4 text-sm font-semibold">Crie algo especial</p>
            <p className="mt-1 text-xs leading-5 text-white/65">
              Personalize seu convite com fotos, música e RSVP.
            </p>
            <Link
              to="/criar"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-xs font-semibold text-[#2c302d] transition hover:bg-[#f6f3ed]"
            >
              <Plus size={14} /> Novo convite
            </Link>
          </div>
          <div className="mt-auto space-y-1 border-t border-[#f0efeb] pt-5">
            <button
              type="button"
              onClick={onHowWorks}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#777a74] transition hover:bg-[#faf8f6] hover:text-[#2c302d]"
            >
              <CircleHelp size={17} />
              Como funciona
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#777a74] transition hover:bg-[#f8eee9] hover:text-[#a45f4e]"
            >
              <LogOut size={17} />
              Sair
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1 lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-[#e9e8e3] bg-white/90 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Link to="/" className="flex items-center gap-2 text-[#2c302d]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2c302d] text-white">
                <Flower2 size={16} />
              </span>
              <span className="font-serif text-lg">meu convite</span>
            </Link>
          </div>
          <div className="hidden items-center gap-2 text-sm text-[#7d8980] lg:flex">
            <span className="text-[#a2ada4]">Área do cliente</span>
            <span>/</span>
            <strong className="font-medium text-[#383b37]">Meu painel</strong>
          </div>
          <div className="flex items-center gap-3">
            <PWAInstallButton />
            <div className="hidden h-8 w-px bg-[#e5ebe5] sm:block" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ead9cf] text-sm font-semibold text-[#2c302d]">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="max-w-[120px] truncate text-sm font-medium text-[#383b37]">
                {userName}
              </span>
              {isMasterAdmin && (
                <span className="rounded-full bg-[#f7e7db] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#9b614c]">
                  Master
                </span>
              )}
            </div>
          </div>
        </header>
        <div className="border-b border-[#eeeae6] bg-white px-5 py-3 lg:hidden">
          <div className="flex items-center gap-2 overflow-x-auto">
            {navigation.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${pathname === to ? "bg-[#f3ebe5] text-[#2c302d]" : "text-[#777a74]"}`}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={onHowWorks}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#777a74]"
            >
              <CircleHelp size={14} />
              Ajuda
            </button>
          </div>
        </div>
        <main className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
