import type { ReactNode } from "react";
import { getServerTranslations } from "./server";
import { I18nProvider } from "./provider";
import type { Locale } from "./config";

export default async function I18nServerProvider({ children }: { children: ReactNode }) {
  const { locale } = await getServerTranslations();

  return (
    <I18nProvider initialLocale={locale}>
      {children}
    </I18nProvider>
  );
}
