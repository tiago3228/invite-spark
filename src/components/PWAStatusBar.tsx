import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, WifiOff, X } from "lucide-react";

const UPDATE_EVENT = "meu-convite:pwa-update";

export function PWAStatusBar() {
  const [isOffline, setIsOffline] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncConnection = () => setIsOffline(!navigator.onLine);
    const onUpdate = () => setUpdateAvailable(true);
    syncConnection();
    window.addEventListener("online", syncConnection);
    window.addEventListener("offline", syncConnection);
    window.addEventListener(UPDATE_EVENT, onUpdate);
    return () => {
      window.removeEventListener("online", syncConnection);
      window.removeEventListener("offline", syncConnection);
      window.removeEventListener(UPDATE_EVENT, onUpdate);
    };
  }, []);

  if (!isOffline && !updateAvailable) return null;

  const applyUpdate = () => {
    navigator.serviceWorker?.controller?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:bottom-auto sm:top-3 sm:px-4 sm:pb-0">
      <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-[#ded8cf] bg-white/95 px-4 py-3 text-sm text-[#4c514c] shadow-xl backdrop-blur">
        {isOffline ? (
          <>
            <WifiOff className="shrink-0 text-[#a45f4e]" size={18} />
            <span className="min-w-0 flex-1">
              Você está offline. Alterações só serão salvas quando a conexão voltar.
            </span>
            <button
              type="button"
              onClick={() => setIsOffline(false)}
              className="rounded-full p-1 text-[#9c9b94] hover:bg-[#f5f1ed]"
              aria-label="Fechar aviso offline"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <CheckCircle2 className="shrink-0 text-[#5e8468]" size={18} />
            <span className="min-w-0 flex-1 font-medium">Nova versão disponível.</span>
            <button
              type="button"
              onClick={applyUpdate}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#2f5145] px-3 py-2 text-xs font-bold text-white hover:bg-[#244238]"
            >
              <RefreshCw size={14} /> Atualizar agora
            </button>
          </>
        )}
      </div>
    </div>
  );
}
