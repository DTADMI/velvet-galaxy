"use client";

import {BarChart3, Loader2, Plus, X} from "lucide-react";
import {useState} from "react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {createClient} from "@/lib/supabase/client";

interface PollCreatorProps {
    onPollCreated?: () => void
    contextType?: "feed" | "group" | "event"
    contextId?: string
}

export function PollCreator({onPollCreated, contextType = "feed", contextId}: PollCreatorProps) {
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
    const [multipleChoice, setMultipleChoice] = useState(false);
    const [pollDuration, setPollDuration] = useState<number>(7); // days
    const [isCreating, setIsCreating] = useState(false);

    const addOption = () => {
        if (pollOptions.length < 10) {
            setPollOptions([...pollOptions, ""]);
        }
    };

    const removeOption = (index: number) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== index));
        }
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const handleCreatePoll = async () => {
        const validOptions = pollOptions.filter((opt) => opt.trim());

        if (!pollQuestion.trim()) {
            toast.error("Please enter a poll question");
            return;
        }

        if (validOptions.length < 2) {
            toast.error("Please provide at least 2 options");
            return;
        }

        setIsCreating(true);
        const supabase = createClient();

        try {
            const {
                data: {user},
            } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("Not authenticated");
            }

            const pollEndDate = new Date();
            pollEndDate.setDate(pollEndDate.getDate() + pollDuration);

            const {error} = await supabase.from("posts").insert({
                author_id: user.id,
                content: pollQuestion.trim(),
                media_type: "poll",
                content_type: "poll",
                poll_question: pollQuestion.trim(),
                poll_options: validOptions.map((option, index) => ({
                    index,
                    text: option,
                    votes: 0,
                })),
                poll_multiple_choice: multipleChoice,
                poll_end_date: pollEndDate.toISOString(),
            });

            if (error) {
                throw error;
            }

            toast.success("Poll created successfully!");
            setPollQuestion("");
            setPollOptions(["", ""]);
            setMultipleChoice(false);
            setPollDuration(7);
            onPollCreated?.();
        } catch (error) {
            console.error("[v0] Error creating poll:", error);
            toast.error("Failed to create poll");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Card className="border-royal-purple/20">
            <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 text-royal-purple">
                    <BarChart3 className="h-5 w-5"/>
                    <h3 className="font-semibold">Create a Poll</h3>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="poll-question">Poll Question *</Label>
                    <Input
                        id="poll-question"
                        placeholder="What would you like to ask?"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Options *</Label>
                    {pollOptions.map((option, index) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                            />
                            {pollOptions.length > 2 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOption(index)}
                                    className="flex-shrink-0"
                                >
                                    <X className="h-4 w-4"/>
                                </Button>
                            )}
                        </div>
                    ))}
                    {pollOptions.length < 10 && (
                        <Button type="button" variant="outline" size="sm" onClick={addOption}
                                className="w-full bg-transparent">
                            <Plus className="h-4 w-4 mr-2"/>
                            Add Option
                        </Button>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="multiple-choice"
                            checked={multipleChoice}
                            onCheckedChange={(checked) => setMultipleChoice(checked as boolean)}
                        />
                        <Label htmlFor="multiple-choice" className="cursor-pointer text-sm">
                            Allow multiple choices
                        </Label>
                    </div>

                    <div className="flex items-center gap-2">
                        <Label htmlFor="duration" className="text-sm">
                            Duration:
                        </Label>
                        <select
                            id="duration"
                            value={pollDuration}
                            onChange={(e) => setPollDuration(Number(e.target.value))}
                            className="border rounded px-2 py-1 text-sm bg-background"
                        >
                            <option value={1}>1 day</option>
                            <option value={3}>3 days</option>
                            <option value={7}>7 days</option>
                            <option value={14}>14 days</option>
                            <option value={30}>30 days</option>
                        </select>
                    </div>
                </div>

                <Button
                    onClick={handleCreatePoll}
                    disabled={isCreating || !pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
                    className="w-full bg-gradient-to-r from-royal-purple to-royal-pink hover:from-royal-purple-dark hover:to-royal-pink-dark"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                            Creating Poll...
                        </>
                    ) : (
                        <>
                            <BarChart3 className="h-4 w-4 mr-2"/>
                            Create Poll
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
