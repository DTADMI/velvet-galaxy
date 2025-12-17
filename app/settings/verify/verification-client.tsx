"use client";

import {Camera, CheckCircle2, Clock, Shield, Upload, XCircle} from "lucide-react";
import {useRef, useState} from "react";

import {Alert, AlertDescription} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/client";

interface VerificationClientProps {
    profile: {
        id: string
        username: string
        display_name: string | null
        avatar_url: string | null
        is_verified: boolean
        verification_date: string | null
    }
    existingRequest: {
        id: string
        status: string
        submitted_at: string
        notes: string | null
    } | null
}

export function VerificationClient({profile, existingRequest}: VerificationClientProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {facingMode: "user"},
                audio: false,
            });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);
            }
        } catch (err) {
            setError("Unable to access camera. Please check permissions.");
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL("image/jpeg");
                setCapturedImage(imageData);

                // Stop camera
                if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                    setStream(null);
                }
            }
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        startCamera();
    };

    const submitVerification = async () => {
        if (!capturedImage) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const supabase = createClient();

            // Convert base64 to blob
            const response = await fetch(capturedImage);
            const blob = await response.blob();

            // Upload to storage
            const fileName = `verification/${profile.id}/${Date.now()}.jpg`;
            const {data: uploadData, error: uploadError} = await supabase.storage.from("media").upload(fileName, blob);

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const {
                data: {publicUrl},
            } = supabase.storage.from("media").getPublicUrl(fileName);

            // Create verification request
            const {error: requestError} = await supabase.from("verification_requests").insert({
                user_id: profile.id,
                verification_image_url: publicUrl,
                status: "pending",
            });

            if (requestError) {
                throw requestError;
            }

            window.location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit verification");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (profile.is_verified) {
        return (
            <Card className="border-green-500/20">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-green-500"/>
                        <CardTitle>Account Verified</CardTitle>
                    </div>
                    <CardDescription>
                        Your account was verified on {new Date(profile.verification_date!).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="border-green-500/20 bg-green-500/5">
                        <CheckCircle2 className="h-4 w-4 text-green-500"/>
                        <AlertDescription>
                            Your account has been verified as authentic. The verification badge will appear on your
                            profile.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (existingRequest) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Verification Status</CardTitle>
                    <CardDescription>Your verification request is being reviewed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        {existingRequest.status === "pending" && (
                            <>
                                <Clock className="h-5 w-5 text-amber-500"/>
                                <Badge variant="outline" className="border-amber-500 text-amber-500">
                                    Pending Review
                                </Badge>
                            </>
                        )}
                        {existingRequest.status === "rejected" && (
                            <>
                                <XCircle className="h-5 w-5 text-red-500"/>
                                <Badge variant="outline" className="border-red-500 text-red-500">
                                    Rejected
                                </Badge>
                            </>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Submitted: {new Date(existingRequest.submitted_at).toLocaleString()}
                    </p>

                    {existingRequest.notes && (
                        <Alert>
                            <AlertDescription>{existingRequest.notes}</AlertDescription>
                        </Alert>
                    )}

                    {existingRequest.status === "rejected" && (
                        <Button onClick={() => window.location.reload()} className="w-full">
                            Submit New Request
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-royal-purple"/>
                    Verify Your Account
                </CardTitle>
                <CardDescription>Take a live photo to verify your identity and get a verification
                    badge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert>
                    <Camera className="h-4 w-4"/>
                    <AlertDescription>
                        Please take a clear photo of yourself holding a piece of paper with today's date and your
                        username written
                        on it.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4">
                    {!capturedImage && !stream && (
                        <Button onClick={startCamera} className="w-full" size="lg">
                            <Camera className="h-5 w-5 mr-2"/>
                            Start Camera
                        </Button>
                    )}

                    {stream && !capturedImage && (
                        <div className="space-y-4">
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"/>
                            </div>
                            <Button onClick={capturePhoto} className="w-full" size="lg">
                                <Camera className="h-5 w-5 mr-2"/>
                                Capture Photo
                            </Button>
                        </div>
                    )}

                    {capturedImage && (
                        <div className="space-y-4">
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                <img
                                    src={capturedImage || "/placeholder.svg"}
                                    alt="Verification"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={retakePhoto} variant="outline" className="flex-1 bg-transparent">
                                    Retake
                                </Button>
                                <Button
                                    onClick={submitVerification}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gradient-to-r from-royal-purple to-royal-blue"
                                >
                                    {isSubmitting ? (
                                        <>Submitting...</>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2"/>
                                            Submit
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden"/>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
