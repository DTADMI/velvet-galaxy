"use client";

import React, {useCallback, useState} from "react";
import {File, Upload, X} from "lucide-react";
import {useDropzone} from "react-dropzone";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {createClient} from "@/lib/supabase/client";

interface MediaUploaderProps {
    onUploadComplete?: (urls: string[]) => void;
    maxFiles?: number;
    accept?: Record<string, string[]>;
}

export function MediaUploader({
                                  onUploadComplete,
                                  maxFiles = 10,
                                  accept = {
                                      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
                                      'video/*': ['.mp4', '.webm', '.ogg'],
                                      'audio/*': ['.mp3', '.wav', '.ogg']
                                  }
                              }: MediaUploaderProps) {
    const [files, setFiles] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const supabase = createClient();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }))].slice(0, maxFiles));
    }, [maxFiles]);

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        accept,
        maxFiles
    });

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = [...prev];
            URL.revokeObjectURL(newFiles[index].preview);
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setIsUploading(true);
        setUploadProgress(0);

        const uploadedUrls: string[] = [];
        const step = 100 / files.length;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `uploads/${fileName}`;

                const {data, error} = await supabase.storage
                    .from('media')
                    .upload(filePath, file);

                if (error) throw error;

                const {data: {publicUrl}} = supabase.storage
                    .from('media')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
                setUploadProgress(prev => prev + step);
            }

            if (onUploadComplete) onUploadComplete(uploadedUrls);
            setFiles([]);
            setUploadProgress(100);
        } catch (err) {
            console.error("Upload error:", err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-royal-purple bg-royal-purple/10" : "border-royal-purple/20 hover:border-royal-purple/40",
                    isUploading && "pointer-events-none opacity-50"
                )}
            >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 mx-auto mb-4 text-royal-purple"/>
                <p className="font-medium text-lg">Drag & drop files here</p>
                <p className="text-sm text-muted-foreground">or click to select (max {maxFiles} files)</p>
            </div>

            {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {files.map((file, i) => (
                        <div key={i}
                             className="relative aspect-square rounded-lg overflow-hidden border border-royal-purple/20 group">
                            {file.type.startsWith('image') ? (
                                <img src={file.preview} alt="" className="w-full h-full object-cover"/>
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <File className="h-8 w-8 text-muted-foreground"/>
                                </div>
                            )}
                            <button
                                onClick={() => removeFile(i)}
                                className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3"/>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isUploading && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1"/>
                </div>
            )}

            {files.length > 0 && !isUploading && (
                <Button onClick={handleUpload} className="w-full bg-royal-purple">
                    Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
                </Button>
            )}
        </div>
    );
}

// Helper to avoid import errors if cn is not in scope
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
