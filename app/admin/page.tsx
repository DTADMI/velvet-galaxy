import {redirect} from 'next/navigation';
import {isAdmin} from '@/lib/admin';
import {Navigation} from '@/components/navigation';
import {AdminClient} from './admin-client';
import {createServerClient} from '@/lib/supabase/server';

export default async function AdminPage() {
    const isUserAdmin = await isAdmin();

    if (!isUserAdmin) {
        redirect('/feed');
    }

    const supabase = await createServerClient();
    const {data: flags} = await supabase.from('feature_flags').select('*').order('name');
    const {count: usersCount} = await supabase.from('profiles').select('id', {count: 'exact', head: true});
    const {count: subscriptionsCount} = await supabase.from('subscriptions').select('id', {count: 'exact', head: true});

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gradient mb-2">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage Velvet Galaxy platform settings and features</p>
                    </div>

                    <AdminClient
                        initialFlags={flags || []}
                        stats={{
                            users: usersCount || 0,
                            subscriptions: subscriptionsCount || 0
                        }}
                    />
                </div>
            </main>
        </>
    );
}
