import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createServerClient} from "@/lib/supabase/server";

import {SettingsClient} from "./settings-client";
import { getServerTranslations } from '@/lib/i18n/server';

export default async function SettingsPage() {
    const supabase = await createServerClient();
  const { t } = await getServerTranslations();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gradient mb-2">Settings</h1>
                        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
                    </div>
                    <SettingsClient/>
                </div>
            </main>
        </>
    );
}
