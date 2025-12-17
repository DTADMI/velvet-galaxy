"use client";

import {Loader2, MapPin} from "lucide-react";
import type React from "react";
import {useEffect, useRef, useState} from "react";

import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";

interface LocationSuggestion {
    place_id: string
    display_name: string
    lat: string
    lon: string
    address: {
        city?: string
        state?: string
        country?: string
    }
}

interface LocationAutocompleteProps {
    value: string
    onChange: (value: string, coordinates?: { lat: number; lon: number }) => void
    placeholder?: string
    disabled?: boolean
    required?: boolean
    id?: string
    className?: string
}

export function LocationAutocomplete({
                                         value,
                                         onChange,
                                         placeholder = "Enter city, state, or address",
                                         disabled = false,
                                         required = false,
                                         id,
                                         className,
                                     }: LocationAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchLocations = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Using Nominatim (OpenStreetMap) for free geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
                {
                    headers: {
                        "User-Agent": "LinkNet-App",
                    },
                },
            );
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Error fetching locations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        setSelectedIndex(-1);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchLocations(newValue);
        }, 300);
    };

    const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
        const locationString = suggestion.address.city
            ? `${suggestion.address.city}, ${suggestion.address.state || suggestion.address.country}`
            : suggestion.display_name.split(",").slice(0, 2).join(",");

        onChange(locationString, {
            lat: Number.parseFloat(suggestion.lat),
            lon: Number.parseFloat(suggestion.lon),
        });
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) {
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelectSuggestion(suggestions[selectedIndex]);
                }
                break;
            case "Escape":
                setShowSuggestions(false);
                break;
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input
                    id={id}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => value.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className={cn("pl-10 pr-10", className)}
                />
                {isLoading && (
                    <Loader2
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"/>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div
                    className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((suggestion, index) => {
                        const displayText = suggestion.address.city
                            ? `${suggestion.address.city}, ${suggestion.address.state || suggestion.address.country}`
                            : suggestion.display_name.split(",").slice(0, 3).join(",");

                        return (
                            <button
                                key={suggestion.place_id}
                                type="button"
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className={cn(
                                    "w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-start gap-2",
                                    selectedIndex === index && "bg-accent",
                                )}
                            >
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground"/>
                                <span className="text-sm">{displayText}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
