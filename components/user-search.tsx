"use client";

import React, {useCallback, useEffect, useState} from "react";
import {Loader2, Search, UserPlus} from "lucide-react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/client";

interface UserSearchProps {
    onSelect: (user: any) => void;
    excludeIds?: string[];
    placeholder?: string;
}

export function UserSearch({onSelect, excludeIds = [], placeholder = "Search for users..."}: UserSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const searchUsers = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const {data, error} = await supabase
                .from("profiles")
                .select("id, username, display_name, avatar_url")
                .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
                .not('id', 'in', `(${excludeIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
                .limit(5);

            if (error) throw error;
            setResults(data || []);
        } catch (err) {
            console.error("User search error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [excludeIds]);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchUsers(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, searchUsers]);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-royal-purple"/>
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <Card className="border-royal-purple/20 overflow-hidden">
                    <div className="divide-y divide-royal-purple/10">
                        {results.map((user) => (
                            <div
                                key={user.id}
                                className="p-3 flex items-center justify-between hover:bg-royal-purple/5 cursor-pointer transition-colors"
                                onClick={() => {
                                    onSelect(user);
                                    setQuery("");
                                    setResults([]);
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar_url}/>
                                        <AvatarFallback className="bg-royal-purple text-white text-[10px]">
                                            {(user.display_name || user.username)[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{user.display_name || user.username}</p>
                                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <UserPlus className="h-4 w-4 text-royal-purple"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
