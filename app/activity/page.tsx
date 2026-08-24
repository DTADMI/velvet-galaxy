import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createClient} from "@/lib/supabase/server";

import {ActivityFeed} from "./activity-feed";
import { getServerTranslations } from '@/lib/i18n/server';

export default async function ActivityPage() {
    const supabase = await createClient();
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
                <div className="container mx-auto max-w-4xl px-4">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gradient mb-2">Activity Feed</h1>
                        <p className="text-muted-foreground">{t("activity.subtitle")}</p>
                    </div>
                    <ActivityFeed userId={user.id}/>
                </div>
            </main>
        </>
    );
}
