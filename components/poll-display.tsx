"use client";

import {BarChart3, Check} from "lucide-react";
import {useEffect, useState} from "react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {createClient} from "@/lib/supabase/client";
import {PollOption} from "@/types";

interface PollDisplayProps {
    postId: string
    question: string
    options: PollOption[]
    multipleChoice: boolean
    endDate: string
    authorId: string
}

export function PollDisplay({postId, question, options, multipleChoice, endDate, authorId}: PollDisplayProps) {
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [pollResults, setPollResults] = useState<PollOption[]>(options);
    const [isVoting, setIsVoting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const pollEnded = new Date(endDate) < new Date();
    const totalVotes = pollResults.reduce((sum, opt) => sum + (opt.votes_count || 0), 0);

    useEffect(() => {
        checkUserVote();
    }, [postId]);

    const checkUserVote = async () => {
        const supabase = createClient();
        const {
            data: {user},
        } = await supabase.auth.getUser();

        if (!user) {
            return;
        }
        setCurrentUserId(user.id);

        const {data: votes} = await supabase
            .from("poll_votes")
            .select("option_index")
            .eq("post_id", postId)
            .eq("user_id", user.id);

        if (votes && votes.length > 0) {
            setHasVoted(true);
            setSelectedOptions(votes.map((v: { option_index: number }) => v.option_index));
        }

        // Fetch current vote counts
        const {data: allVotes} = await supabase.from("poll_votes").select("option_index").eq("post_id", postId);

        if (allVotes) {
            const voteCounts = pollResults.map((opt) => ({
                ...opt,
                votes_count: allVotes.filter((v: { option_index: number }) => v.option_index === opt.index).length,
            }));
            setPollResults(voteCounts);
        }
    };

    const handleVote = async () => {
        if (selectedOptions.length === 0) {
            toast.error("Please select at least one option");
            return;
        }

        setIsVoting(true);
        const supabase = createClient();

        try {
            const {
                data: {user},
            } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("Not authenticated");
            }

            // Insert votes
            const votes = selectedOptions.map((optionIndex) => ({
                post_id: postId,
                user_id: user.id,
                option_index: optionIndex,
            }));

            const {error} = await supabase.from("poll_votes").insert(votes);

            if (error) {
                throw error;
            }

            setHasVoted(true);
            toast.success("Vote recorded!");
            await checkUserVote();
        } catch (error) {
            console.error("[v0] Error voting:", error);
            toast.error("Failed to record vote");
        } finally {
            setIsVoting(false);
        }
    };

    const handleOptionToggle = (optionIndex: number) => {
        if (multipleChoice) {
            setSelectedOptions((prev) =>
                prev.includes(optionIndex) ? prev.filter((i) => i !== optionIndex) : [...prev, optionIndex],
            );
        } else {
            setSelectedOptions([optionIndex]);
        }
    };

    const getPercentage = (votes: number) => {
        if (totalVotes === 0) {
            return 0;
        }
        return Math.round((votes / totalVotes) * 100);
    };

    return (
        <Card className="border-royal-purple/20 bg-gradient-to-br from-card to-card/50">
            <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-royal-purple flex-shrink-0 mt-1"/>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{question}</h3>
                        <p className="text-sm text-muted-foreground">
                            {pollEnded ? "Poll ended" : `Ends ${new Date(endDate).toLocaleDateString()}`} • {totalVotes} vote
                            {totalVotes !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    {!hasVoted && !pollEnded ? (
                        <>
                            {multipleChoice ? (
                                <div className="space-y-2">
                                    {pollResults.map((option) => (
                                        <div
                                            key={option.index}
                                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent"
                                        >
                                            <Checkbox
                                                id={`option-${option.index}`}
                                                checked={selectedOptions.includes(option.index)}
                                                onCheckedChange={() => handleOptionToggle(option.index)}
                                            />
                                            <Label htmlFor={`option-${option.index}`} className="flex-1 cursor-pointer">
                                                {option.text}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <RadioGroup
                                    value={selectedOptions[0]?.toString()}
                                    onValueChange={(v) => setSelectedOptions([Number.parseInt(v)])}
                                >
                                    {pollResults.map((option) => (
                                        <div
                                            key={option.index}
                                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent"
                                        >
                                            <RadioGroupItem value={option.index.toString()}
                                                            id={`option-${option.index}`}/>
                                            <Label htmlFor={`option-${option.index}`} className="flex-1 cursor-pointer">
                                                {option.text}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                            <Button
                                onClick={handleVote}
                                disabled={isVoting || selectedOptions.length === 0}
                                className="w-full bg-gradient-to-r from-royal-purple to-royal-pink hover:from-royal-purple-dark hover:to-royal-pink-dark"
                            >
                                {isVoting ? "Voting..." : "Vote"}
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-2">
                            {pollResults.map((option) => {
                                const percentage = getPercentage(option.votes_count || 0);
                                const isSelected = selectedOptions.includes(option.index);
                                return (
                                    <div key={option.index} className="relative p-3 border rounded-lg overflow-hidden">
                                        <div
                                            className="absolute inset-0 bg-royal-purple/10 transition-all"
                                            style={{width: `${percentage}%`}}
                                        />
                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {isSelected && <Check className="h-4 w-4 text-royal-purple"/>}
                                                <span className={isSelected ? "font-semibold" : ""}>{option.text}</span>
                                            </div>
                                            <span className="font-semibold text-sm">
                        {percentage}% ({option.votes_count})
                      </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {multipleChoice && !hasVoted && !pollEnded && (
                    <p className="text-xs text-muted-foreground">You can select multiple options</p>
                )}
            </CardContent>
        </Card>
    );
}
