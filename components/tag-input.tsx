"use client";

import {X} from "lucide-react";
import type React from "react";
import {useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";

interface TagInputProps {
    tags: string[]
    onTagsChange: (tags: string[]) => void
    placeholder?: string
}

export function TagInput({tags, onTagsChange, placeholder = "Add tags..."}: TagInputProps) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const addTag = () => {
        const tag = inputValue.trim().toLowerCase().replace(/,/g, "");
        if (tag && !tags.includes(tag)) {
            onTagsChange([...tags, tag]);
            setInputValue("");
        }
    };

    const removeTag = (index: number) => {
        onTagsChange(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 bg-royal-purple/20 text-royal-purple">
                        #{tag}
                        <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="ml-1 hover:bg-royal-purple/30 rounded-full"
                        >
                            <X className="h-3 w-3"/>
                        </button>
                    </Badge>
                ))}
            </div>
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={placeholder}
                className="bg-card border-royal-purple/20"
            />
            <p className="text-xs text-muted-foreground">Press Enter or comma to add tags</p>
        </div>
    );
}
