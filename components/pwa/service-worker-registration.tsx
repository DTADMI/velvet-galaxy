"use client";

import {useEffect} from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (!window.isSecureContext) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {scope: "/"});
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("velvet-galaxy sw registration failed", error);
        }
      }
    };

    void register();
  }, []);

  return null;
}
