"use client";

import type React from "react";
import {useState} from "react";
import {toast} from "react-toastify";

import {createBrowserClient} from "@/lib/supabase/client";

import {validateMediaFile} from "./utils"; // Assuming validateMediaFile is a utility function

const NavUploadForm = () => {
    const [mediaType, setMediaType] = useState("");
    const [fileError, setFileError] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        const maxSizes = {
            picture: 10 * 1024 * 1024, // 10MB
            video: 500 * 1024 * 1024, // 500MB
            audio: 50 * 1024 * 1024, // 50MB
            gif: 10 * 1024 * 1024, // 10MB
        };

        const maxSize = maxSizes[mediaType as keyof typeof maxSizes] || 10 * 1024 * 1024;
        if (file.size > maxSize) {
            const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
            setFileError(`File size exceeds ${sizeMB}MB limit for ${mediaType}s`);
            toast.error(`File too large. Maximum size is ${sizeMB}MB for ${mediaType}s`);
            return;
        }

        if (!validateMediaFile(file, mediaType)) {
            const validExtensions: Record<string, string[]> = {
                picture: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
                video: [".mp4", ".mov", ".avi", ".wmv", ".webm", ".mkv"],
                audio: [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"],
                gif: [".gif"],
            };
            setFileError(`Invalid file type. Please upload a ${mediaType} file (${validExtensions[mediaType]?.join(", ")})`);
            toast.error(`Invalid file type for ${mediaType}`);
            setTimeout(() => setFileError(null), 5000);
            return;
        }

        setFileError(null);
        setUploadedFile(file);
        setUploadProgress(0);

        if (mediaType === "picture" || mediaType === "video" || mediaType === "gif") {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }

        const supabase = createBrowserClient();
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            toast.error("You must be logged in to upload files");
            return;
        }

        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const uploadInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(uploadInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            const {data, error} = await supabase.storage.from("media").upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
            });

            clearInterval(uploadInterval);

            if (error) {
                console.error("[v0] Upload error:", error);
                toast.error(`Upload failed: ${error.message}`);
                setUploadProgress(0);
                setUploadedFile(null);
                setPreviewUrl(null);
                return;
            }

            const {
                data: {publicUrl},
            } = supabase.storage.from("media").getPublicUrl(fileName);

            setMediaUrl(publicUrl);
            setUploadProgress(100);
            toast.success("File uploaded successfully!");
        } catch (error) {
            console.error("[v0] Upload error:", error);
            toast.error("Failed to upload file");
            setUploadProgress(0);
            setUploadedFile(null);
            setPreviewUrl(null);
        }
    };

    return (
        <div>
            {fileError ? (
                <div className="text-red-500">{fileError}</div>
            ) : (
                <div className="space-y-3">
                    {mediaType === "picture" && previewUrl && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-black/5">
                            <img src={previewUrl || "/placeholder.svg"} alt="Preview"
                                 className="w-full h-full object-contain"/>
                        </div>
                    )}
                    {mediaType === "video" && previewUrl && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-black/5">
                            <video src={previewUrl} controls className="w-full h-full object-contain"/>
                        </div>
                    )}
                    {mediaType === "gif" && previewUrl && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-black/5">
                            <img src={previewUrl || "/placeholder.svg"} alt="GIF Preview"
                                 className="w-full h-full object-contain"/>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NavUploadForm;
