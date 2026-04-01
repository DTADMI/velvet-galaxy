"use client";

import {useEffect, useState} from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "velvet-galaxy-install-dismissed";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const iosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(iosDevice);

    const dismissed = localStorage.getItem(DISMISS_KEY) === "true";
    if (!dismissed && !standalone && iosDevice) {
      setTimeout(() => setShow(true), 4000);
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      if (!dismissed && !standalone) {
        setTimeout(() => setShow(true), 4000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  if (!show || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border border-border bg-background/95 p-4 shadow-xl md:left-auto md:max-w-md">
      <p className="text-sm font-semibold">Install Velvet Galaxy</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {isIOS
          ? 'On iOS Safari, tap Share and choose "Add to Home Screen".'
          : "Install the app for quick launch and improved offline behavior."}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md border border-border px-3 py-2 text-xs font-medium"
        >
          Not now
        </button>
        {!isIOS && deferredPrompt ? (
          <button
            type="button"
            onClick={install}
            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            Install
          </button>
        ) : null}
      </div>
    </div>
  );
}
