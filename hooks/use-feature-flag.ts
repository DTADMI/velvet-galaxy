import {useEffect, useState} from 'react';
import {createBrowserClient} from '@/lib/supabase/client';

interface FeatureFlag {
    name: string;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

export function useFeatureFlag(flagName: string, defaultValue: boolean = false) {
    const [isEnabled, setIsEnabled] = useState<boolean>(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const supabase = createBrowserClient();
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000; // 1 second

    useEffect(() => {
        let isMounted = true;
        let retryCount = 0;

        async function checkFlag() {
            if (!isMounted) return;

            try {
                const {data, error: queryError} = await supabase
                    .from<FeatureFlag>('feature_flags')
                    .select('is_enabled')
                    .eq('name', flagName)
                    .single();

                if (queryError) {
                    // If the table doesn't exist (PGRST205 or 42P01), use default value
                    if (queryError.code === '42P01' || queryError.code === 'PGRST205') {
                        console.warn(`Feature flags table not found. Using default value (${defaultValue}) for ${flagName}`);
                        if (isMounted) {
                            setIsEnabled(defaultValue);
                            setError(null);
                            setIsLoading(false);
                        }
                        return;
                    }

                    // Retry logic for transient errors
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        console.warn(`Retry ${retryCount}/${MAX_RETRIES} for feature flag ${flagName}`);
                        setTimeout(checkFlag, RETRY_DELAY * retryCount);
                        return;
                    }

                    throw queryError;
                }

                if (isMounted) {
                    setIsEnabled(data?.is_enabled ?? defaultValue);
                    setError(null);
                }
            } catch (err) {
                console.error(`Error in useFeatureFlag for ${flagName}:`, {
                    error: err,
                    flagName,
                    retryCount,
                    timestamp: new Date().toISOString()
                });

                if (isMounted) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                    setIsEnabled(defaultValue);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        checkFlag();

        // Optional: Subscribe to changes (only if table exists)
        // Skip subscription setup to avoid errors when table doesn't exist
        return () => {
            isMounted = false;
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
                // If table doesn't exist, just use empty flags
                if (error.code === '42P01' || error.code === 'PGRST205') {
                    console.warn('Feature flags table not found. All flags will use default values.');
                    setFlags({});
                } else {
                    console.error('Error fetching feature flags:', error);
                }
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

        // Skip subscription to avoid errors when table doesn't exist
        return () => {
        };
    }, [supabase]);

    return {flags, isLoading};
}
