import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "meu-convite:pwa-install-dismissed";

function getStandalone() {
  if (typeof window === "undefined") return false;
  const safariNavigator = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches || safariNavigator.standalone === true
  );
}

function getDismissed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISSED_KEY) === "1";
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(getStandalone);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(getDismissed);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent) && !getStandalone());
    setIsDismissed(getDismissed());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.localStorage.removeItem(DISMISSED_KEY);
    };
    const media = window.matchMedia("(display-mode: standalone)");
    const onModeChange = () => setIsInstalled(getStandalone());
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", onModeChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onModeChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
    return choice.outcome === "accepted";
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(DISMISSED_KEY, "1");
    setIsDismissed(true);
  }, []);

  return {
    canInstall: Boolean(deferredPrompt) && !isDismissed,
    isInstalled,
    isIOS: isIOS && !isDismissed,
    install,
    dismiss,
  };
}
