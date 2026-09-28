import { useState } from "react";
import { Check, Download, Info, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/use-pwa-install";

export function PWAInstallButton() {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [showHelp, setShowHelp] = useState(false);
  if (isInstalled)
    return (
      <span
        className="inline-flex items-center gap-2 text-sm font-medium text-[#5e8468]"
        aria-label="Aplicativo já instalado"
      >
        <Check size={16} /> Aplicativo já instalado
      </span>
    );
  if (!canInstall && !isIOS) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (isIOS) setShowHelp(true);
          else void install();
        }}
        className="inline-flex items-center gap-2 rounded-full border border-[#d9e4da] bg-white px-4 py-2.5 text-sm font-medium text-[#2f5145] transition hover:border-[#9ab5a0] hover:bg-[#f1f6f1]"
        aria-label="Instalar aplicativo"
      >
        <Download size={16} /> Instalar aplicativo
      </button>
      {showHelp && (
        <div className="absolute right-0 top-12 z-30 w-72 rounded-2xl border border-[#e6e0d7] bg-white p-4 text-sm leading-6 text-[#5f5b54] shadow-xl">
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="absolute right-3 top-3 text-[#a29d94]"
            aria-label="Fechar instruções"
          >
            <X size={16} />
          </button>
          <div className="flex gap-2 pr-4">
            <Info size={17} className="mt-1 shrink-0 text-[#bd8051]" />
            <span>
              <strong className="text-[#3d5145]">Para instalar no iPhone/iPad:</strong>
              <br />
              Toque em <strong>Compartilhar</strong> e selecione{" "}
              <strong>Adicionar à Tela de Início</strong>.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
