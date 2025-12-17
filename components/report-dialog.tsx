"use client";

import {AlertTriangle, Flag, Loader2} from "lucide-react";
import type React from "react";
import {useState} from "react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Textarea} from "@/components/ui/textarea";
import {createClient} from "@/lib/supabase/client";

interface ReportDialogProps {
    contentType: "post" | "message" | "room" | "group" | "event" | "user" | "comment"
    contentId: string
    trigger?: React.ReactNode
}

const reportReasons = {
    harassment: "Aggressive personal attack or threat",
    hate_speech: "Hate speech or discrimination",
    spam: "Spam or misleading content",
    inappropriate_content: "Content is not allowed",
    copyright: "Copyright infringement",
    impersonation: "Impersonation or fake account",
    underage: "Underage user or content",
    violence: "Violence or dangerous content",
    other: "Other reason",
};

export function ReportDialog({contentType, contentId, trigger}: ReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<string>("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason) {
            toast.error("Please select a reason for reporting");
            return;
        }

        setIsSubmitting(true);
        const supabase = createClient();

        try {
            const {
                data: {user},
            } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("Not authenticated");
            }

            const {error} = await supabase.from("reports").insert({
                reporter_id: user.id,
                content_type: contentType,
                content_id: contentId,
                reason,
                description: description.trim() || null,
            });

            if (error) {
                throw error;
            }

            toast.success("Report submitted successfully. Our team will review it shortly.");
            setOpen(false);
            setReason("");
            setDescription("");
        } catch (error) {
            console.error("[v0] Error submitting report:", error);
            toast.error("Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                        <Flag className="h-4 w-4 mr-2"/>
                        Report
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive"/>
                        Report {contentType}
                    </DialogTitle>
                    <DialogDescription>
                        Help us keep the community safe by reporting content that violates our guidelines.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        <Label>Reason for reporting *</Label>
                        <RadioGroup value={reason} onValueChange={setReason}>
                            {Object.entries(reportReasons).map(([key, label]) => (
                                <div key={key} className="flex items-start space-x-3 space-y-0">
                                    <RadioGroupItem value={key} id={key} className="mt-1"/>
                                    <Label htmlFor={key} className="font-normal cursor-pointer leading-relaxed">
                                        {label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Additional details (optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Provide any additional context that might help us review this report..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!reason || isSubmitting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                Submitting...
                            </>
                        ) : (
                            "Submit Report"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
