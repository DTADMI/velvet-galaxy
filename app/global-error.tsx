"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// ─────────────────────────────────────────────────────────
// Frontiere d'erreur GLOBALE.
//
// Deux contraintes dictent ce fichier :
//  1. Next.js impose qu'elle rende son propre <html>/<body>, donc elle est HORS
//     du provider i18n : elle ne peut pas utiliser le contexte.
//  2. Elle s'affiche quand quelque chose de profond a casse. Importer le module
//     i18n serait precisement le risque : si c'est lui qui a echoue, la frontiere
//     echouerait aussi.
// Les messages sont donc ecrits ici, en clair, pour les quatre langues. Le repli
// est le FRANCAIS : c'est la langue par defaut du produit (NF-I18N), et non
// l'anglais comme le faisait la version precedente.
// ─────────────────────────────────────────────────────────

type SupportedLocale = "fr" | "en" | "es" | "de";

const LOCALE_KEY = "velvet_galaxy-locale";
const DEFAULT_LOCALE: SupportedLocale = "fr";

const MESSAGES: Record<
  SupportedLocale,
  { title: string; body: string; retry: string; reload: string; id: string }
> = {
  fr: {
    title: "Erreur critique",
    body: "Velvet Galaxy a rencontre une erreur critique et ne peut pas continuer. Rechargez la page ou reessayez plus tard.",
    retry: "Reessayer",
    reload: "Recharger la page",
    id: "Identifiant d'erreur",
  },
  en: {
    title: "Critical error",
    body: "Velvet Galaxy encountered a critical error and cannot continue. Please refresh the page or try again later.",
    retry: "Try again",
    reload: "Refresh page",
    id: "Error ID",
  },
  es: {
    title: "Error critico",
    body: "Velvet Galaxy encontro un error critico y no puede continuar. Actualice la pagina o vuelva a intentarlo mas tarde.",
    retry: "Reintentar",
    reload: "Actualizar la pagina",
    id: "Identificador de error",
  },
  de: {
    title: "Kritischer Fehler",
    body: "In Velvet Galaxy ist ein kritischer Fehler aufgetreten. Bitte laden Sie die Seite neu oder versuchen Sie es spater erneut.",
    retry: "Erneut versuchen",
    reload: "Seite neu laden",
    id: "Fehler-ID",
  },
};

function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return value === "fr" || value === "en" || value === "es" || value === "de";
}

/** Locale lue sans contexte : cookie d'abord, puis stockage local, puis le defaut. */
function readLocale(): SupportedLocale {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_KEY}=([^;]+)`));
    if (isSupportedLocale(match?.[1])) return match[1];
  } catch {
    // L'acces au cookie peut lever dans certains contextes durcis.
  }
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (isSupportedLocale(stored)) return stored;
  } catch {
    // Stockage indisponible : on garde le defaut.
  }
  return DEFAULT_LOCALE;
}

const subscribeCookie = () => () => {};
const getLocaleSnapshot = (): SupportedLocale => readLocale();
const getServerLocaleSnapshot = (): SupportedLocale => DEFAULT_LOCALE;

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(subscribeCookie, getLocaleSnapshot, getServerLocaleSnapshot);
  const messages = MESSAGES[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center bg-background">
          <div className="rounded-full bg-destructive/10 p-4">
            <svg
              className="h-10 w-10 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{messages.title}</h1>
            <p className="mt-2 text-muted-foreground max-w-md">{messages.body}</p>
            {error.digest && (
              <p className="mt-1 text-xs text-muted-foreground font-mono">
                {messages.id}: {error.digest}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={reset} variant="default">
              {messages.retry}
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              {messages.reload}
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
