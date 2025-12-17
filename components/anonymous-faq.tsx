"use client";

import {Eye, EyeOff, Loader2, MessageCircle, Send} from "lucide-react";
import {useEffect, useState} from "react";

import {Alert, AlertDescription} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Textarea} from "@/components/ui/textarea";
import {createClient} from "@/lib/supabase/client";

interface AnonymousFAQProps {
    profileId: string
    isOwnProfile: boolean
}

export function AnonymousFAQ({profileId, isOwnProfile}: AnonymousFAQProps) {
    const [questions, setQuestions] = useState<any[]>([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUnanswered, setShowUnanswered] = useState(false);
    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState("");

    useEffect(() => {
        loadQuestions();
    }, [profileId, showUnanswered]);

    const loadQuestions = async () => {
        const supabase = createClient();

        let query = supabase
            .from("anonymous_questions")
            .select("*")
            .eq("recipient_id", profileId)
            .order("created_at", {ascending: false});

        if (!isOwnProfile) {
            query = query.eq("is_public", true);
        } else if (showUnanswered) {
            query = query.is("answer", null);
        }

        const {data} = await query;

        setQuestions(data || []);
    };

    const submitQuestion = async () => {
        if (!newQuestion.trim()) {
            return;
        }

        setIsSubmitting(true);
        const supabase = createClient();

        try {
            const {error} = await supabase.from("anonymous_questions").insert({
                recipient_id: profileId,
                question: newQuestion.trim(),
            });

            if (error) {
                throw error;
            }

            setNewQuestion("");
            if (isOwnProfile) {
                loadQuestions();
            }
        } catch (error) {
            console.error("Error submitting question:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitAnswer = async (questionId: string) => {
        if (!answerText.trim()) {
            return;
        }

        const supabase = createClient();

        try {
            const {error} = await supabase
                .from("anonymous_questions")
                .update({
                    answer: answerText.trim(),
                    answered_at: new Date().toISOString(),
                    is_public: true,
                })
                .eq("id", questionId);

            if (error) {
                throw error;
            }

            setAnsweringId(null);
            setAnswerText("");
            loadQuestions();
        } catch (error) {
            console.error("Error submitting answer:", error);
        }
    };

    const deleteQuestion = async (questionId: string) => {
        const supabase = createClient();

        try {
            const {error} = await supabase.from("anonymous_questions").delete().eq("id", questionId);

            if (error) {
                throw error;
            }

            loadQuestions();
        } catch (error) {
            console.error("Error deleting question:", error);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-royal-purple/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-royal-purple"/>
                        Anonymous Questions
                    </CardTitle>
                    <CardDescription>Ask questions anonymously or answer questions from others</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!isOwnProfile && (
                        <div className="space-y-3">
                            <Textarea
                                placeholder="Ask an anonymous question..."
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <Button
                                onClick={submitQuestion}
                                disabled={!newQuestion.trim() || isSubmitting}
                                className="w-full bg-gradient-to-r from-royal-purple to-royal-blue"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2"/>
                                        Send Anonymous Question
                                    </>
                                )}
                            </Button>
                            <Alert>
                                <AlertDescription className="text-sm">
                                    Your question will be sent anonymously. The recipient can choose to answer it
                                    publicly.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {isOwnProfile && (
                        <div className="flex items-center justify-between pb-4 border-b">
                            <p className="text-sm text-muted-foreground">
                                {showUnanswered ? "Showing unanswered questions" : "Showing all questions"}
                            </p>
                            <Button variant="outline" size="sm" onClick={() => setShowUnanswered(!showUnanswered)}
                                    className="gap-2">
                                {showUnanswered ? (
                                    <>
                                        <Eye className="h-4 w-4"/>
                                        Show All
                                    </>
                                ) : (
                                    <>
                                        <EyeOff className="h-4 w-4"/>
                                        Show Unanswered
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {questions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50"/>
                                <p>{isOwnProfile ? "No questions yet" : "No public questions yet"}</p>
                            </div>
                        ) : (
                            questions.map((q) => (
                                <Card key={q.id} className="border-muted">
                                    <CardContent className="pt-6 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <Badge variant="outline" className="mb-2">
                                                    Anonymous
                                                </Badge>
                                                <p className="font-medium">{q.question}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(q.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {isOwnProfile && !q.answer && (
                                                <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)}
                                                        className="text-red-500">
                                                    Delete
                                                </Button>
                                            )}
                                        </div>

                                        {q.answer ? (
                                            <div
                                                className="pl-4 border-l-2 border-royal-purple/30 bg-royal-purple/5 p-3 rounded-r">
                                                <p className="text-sm font-medium text-royal-purple mb-1">Answer:</p>
                                                <p className="text-sm">{q.answer}</p>
                                                {q.answered_at && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Answered {new Date(q.answered_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        ) : isOwnProfile ? (
                                            answeringId === q.id ? (
                                                <div className="space-y-2">
                                                    <Textarea
                                                        placeholder="Write your answer..."
                                                        value={answerText}
                                                        onChange={(e) => setAnswerText(e.target.value)}
                                                        className="min-h-[80px]"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => submitAnswer(q.id)}
                                                            disabled={!answerText.trim()}
                                                            size="sm"
                                                            className="bg-gradient-to-r from-royal-purple to-royal-blue"
                                                        >
                                                            Post Answer
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setAnsweringId(null);
                                                                setAnswerText("");
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setAnsweringId(q.id)}
                                                    className="w-full border-royal-purple/20"
                                                >
                                                    Answer Question
                                                </Button>
                                            )
                                        ) : null}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
