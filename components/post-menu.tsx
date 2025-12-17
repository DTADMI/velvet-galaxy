"use client";

import {Edit, LinkIcon, MoreHorizontal, Trash2} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";

import {ReportDialog} from "@/components/report-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Button} from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {createBrowserClient} from "@/lib/supabase/client";

interface PostMenuProps {
    postId: string
    authorId: string
    currentUserId?: string
    createdAt?: string
}

export function PostMenu({postId, authorId, currentUserId, createdAt}: PostMenuProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const supabase = createBrowserClient();
    const isOwnPost = currentUserId === authorId;

    const canEdit = () => {
        if (!isOwnPost || !createdAt) {
            return false;
        }
        const postTime = new Date(createdAt).getTime();
        const now = Date.now();
        const tenMinutesInMs = 10 * 60 * 1000;
        return now - postTime <= tenMinutesInMs;
    };

    const isEditable = canEdit();

    const handleDelete = async () => {
        setIsDeleting(true);
        const {error} = await supabase.from("posts").delete().eq("id", postId);

        if (!error) {
            router.refresh();
        }
        setIsDeleting(false);
        setDeleteDialogOpen(false);
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/post/${postId}`;
        navigator.clipboard.writeText(url);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleCopyLink}>
                        <LinkIcon className="h-4 w-4 mr-2"/>
                        Copy Link
                    </DropdownMenuItem>
                    {isOwnPost ? (
                        <>
                            {isEditable ? (
                                <DropdownMenuItem onClick={() => router.push(`/post/${postId}/edit`)}>
                                    <Edit className="h-4 w-4 mr-2"/>
                                    Edit Post
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem disabled className="text-muted-foreground">
                                    <Edit className="h-4 w-4 mr-2"/>
                                    Edit Post (expired)
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2"/>
                                Delete Post
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <>
                            <DropdownMenuSeparator/>
                            <ReportDialog
                                contentType="post"
                                contentId={postId}
                                trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>Report
                                    Post</DropdownMenuItem>}
                            />
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your post and remove it from our
                            servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
