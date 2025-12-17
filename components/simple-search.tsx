"use client";

import {Search} from "lucide-react";
import {useRouter} from "next/navigation";
import type React from "react";
import {useEffect, useState} from "react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

export function SimpleSearch() {
    const [query, setQuery] = useState("");
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Load search history from localStorage
        const history = localStorage.getItem("searchHistory");
        if (history) {
            setSearchHistory(JSON.parse(history));
        }
    }, []);

    const handleSearch = (searchQuery: string) => {
        if (!searchQuery.trim()) {
            return;
        }

        // Add to search history
        const newHistory = [searchQuery, ...searchHistory.filter((h) => h !== searchQuery)].slice(0, 10);
        setSearchHistory(newHistory);
        localStorage.setItem("searchHistory", JSON.stringify(newHistory));

        // Navigate to search page
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        setIsOpen(false);
        setQuery("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem("searchHistory");
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-royal-purple/10">
                    <Search className="h-4 w-4"/>
                    <span className="hidden sm:inline">Search</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <form onSubmit={handleSubmit} className="p-3 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input
                            placeholder="Search LinkNet..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10"
                            autoFocus
                        />
                    </div>
                </form>
                <div className="max-h-[300px] overflow-y-auto">
                    {searchHistory.length > 0 ? (
                        <div className="p-2">
                            <div className="flex items-center justify-between px-2 py-1 mb-1">
                                <span className="text-xs font-semibold text-muted-foreground">Recent Searches</span>
                                <Button variant="ghost" size="sm" onClick={clearHistory} className="h-6 text-xs">
                                    Clear
                                </Button>
                            </div>
                            {searchHistory.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSearch(item)}
                                    className="w-full text-left px-3 py-2 hover:bg-card rounded-md transition-colors flex items-center gap-2 text-sm"
                                >
                                    <Search className="h-3 w-3 text-muted-foreground"/>
                                    {item}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50"/>
                            <p>No recent searches</p>
                            <p className="text-xs mt-1">Start searching to see your history</p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
