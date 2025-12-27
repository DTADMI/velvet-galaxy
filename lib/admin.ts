import {createServerClient} from '@/lib/supabase/server';

export async function isAdmin() {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();

    if (!user) return false;

    const {data} = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    return data?.is_admin ?? false;
}
