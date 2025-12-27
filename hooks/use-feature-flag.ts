import {useEffect, useState} from 'react';
import {createBrowserClient} from '@/lib/supabase/client';

export function useFeatureFlag(flagName: string) {
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createBrowserClient();

    useEffect(() => {
        async function checkFlag() {
            try {
                const {data, error} = await supabase
                    .from('feature_flags')
                    .select('is_enabled')
                    .eq('name', flagName)
                    .single();

                if (error) {
                    console.error(`Error fetching feature flag ${flagName}:`, error);
                    setIsEnabled(false);
                } else {
                    setIsEnabled(data?.is_enabled ?? false);
                }
            } catch (err) {
                console.error(`Unexpected error fetching feature flag ${flagName}:`, err);
                setIsEnabled(false);
            } finally {
                setIsLoading(false);
            }
        }

        checkFlag();

        // Optional: Subscribe to changes
        const channel = supabase
            .channel(`feature_flag_${flagName}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'feature_flags',
                    filter: `name=eq.${flagName}`
                },
                (payload: any) => {
                    setIsEnabled(payload.new.is_enabled);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [flagName, supabase]);

    return {isEnabled, isLoading};
}

export function useFeatureFlags() {
    const [flags, setFlags] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createBrowserClient();

    useEffect(() => {
        async function fetchFlags() {
            const {data, error} = await supabase
                .from('feature_flags')
                .select('name, is_enabled');

            if (error) {
                console.error('Error fetching feature flags:', error);
            } else if (data) {
                const flagMap = data.reduce((acc: Record<string, boolean>, flag: any) => {
                    acc[flag.name] = flag.is_enabled;
                    return acc;
                }, {} as Record<string, boolean>);
                setFlags(flagMap);
            }
            setIsLoading(false);
        }

        fetchFlags();

        const channel = supabase
            .channel('feature_flags_all')
            .on(
                'postgres_changes',
                {event: '*', schema: 'public', table: 'feature_flags'},
                () => fetchFlags()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return {flags, isLoading};
}
