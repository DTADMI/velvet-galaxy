"use client";

import EmojiPicker from "emoji-picker-react";
import {Bold, Code, Italic, LinkIcon, List, ListOrdered, Quote, Smile, Underline} from "lucide-react";
import {useEffect, useRef, useState} from "react";

import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    minHeight?: string
    disabled?: boolean
}

export function RichTextEditor({value, onChange, placeholder, minHeight = "100px", disabled}: RichTextEditorProps) {
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const insertLink = () => {
        if (linkUrl && linkText) {
            execCommand(
                "insertHTML",
                `<a href="${linkUrl}" target="_blank" class="text-royal-blue underline">${linkText}</a>`,
            );
            setLinkUrl("");
            setLinkText("");
            setLinkDialogOpen(false);
        }
    };

    const onEmojiClick = (emojiData: any) => {
        execCommand("insertText", emojiData.emoji);
        setEmojiPickerOpen(false);
    };

    return (
        <div className="border border-royal-purple/20 rounded-lg overflow-hidden bg-card">
            <div className="flex items-center gap-1 p-2 border-b border-royal-purple/20 bg-muted/30 flex-wrap">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execCommand("bold")}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                >
                    <Bold className="h-4 w-4"/>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execCommand("italic")}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                >
                    <Italic className="h-4 w-4"/>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execCommand("underline")}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                >
                    <Underline className="h-4 w-4"/>
                </Button>
                <div className="w-px h-6 bg-border mx-1"/>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execCommand("insertUnorderedList")}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                >
                    <List className="h-4 w-4"/>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execCommand("insertOrderedList")}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                >
                    <ListOrdered className="h-4 w-4"/>
                </Button>
                <div className="w-px h-6 bg-border mx-1"/>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execCommand("formatBlock", "<blockquote>")}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                >
                    <Quote className="h-4 w-4"/>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execCommand("formatBlock", "<pre>")}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                >
                    <Code className="h-4 w-4"/>
                </Button>
                <div className="w-px h-6 bg-border mx-1"/>
                <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={disabled}>
                            <LinkIcon className="h-4 w-4"/>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-royal-purple/20">
                        <DialogHeader>
                            <DialogTitle>Insert Link</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Link Text</Label>
                                <Input
                                    placeholder="Enter link text"
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label>URL</Label>
                                <Input
                                    placeholder="https://example.com"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="mt-2"
                                />
                            </div>
                            <Button onClick={insertLink}
                                    className="w-full bg-gradient-to-r from-royal-purple to-royal-blue">
                                Insert Link
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={disabled}>
                            <Smile className="h-4 w-4"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 border-0" align="start">
                        <EmojiPicker onEmojiClick={onEmojiClick} width="100%"/>
                    </PopoverContent>
                </Popover>
            </div>
            <div
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleInput}
                className="p-4 outline-none prose prose-sm max-w-none"
                style={{minHeight}}
                data-placeholder={placeholder}
                suppressContentEditableWarning
            />
            <style jsx>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: hsl(var(--muted-foreground));
                }
            `}</style>
        </div>
    );
}
