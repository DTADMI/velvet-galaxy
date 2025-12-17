"use client";

import {Camera, Check, Circle, Mic, RotateCcw, Settings, Square, Video, X} from "lucide-react";
import {useEffect, useRef, useState} from "react";

import {Alert, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

interface LiveMediaCaptureProps {
    type: "picture" | "video" | "audio"
    onCapture: (file: File) => void
    onCancel: () => void
}

interface DeviceInfo {
    deviceId: string
    label: string
}

export function LiveMediaCapture({type, onCapture, onCancel}: LiveMediaCaptureProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedData, setCapturedData] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
    const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [testStream, setTestStream] = useState<MediaStream | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const testVideoRef = useRef<HTMLVideoElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        enumerateDevices();
    }, []);

    useEffect(() => {
        startCapture();
        return () => {
            stopStream();
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [facingMode, selectedVideoDevice, selectedAudioDevice]);

    const enumerateDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            const videoInputs = devices
                .filter((device) => device.kind === "videoinput")
                .map((device) => ({
                    deviceId: device.deviceId,
                    label: device.label || `Camera ${videoDevices.length + 1}`,
                }));

            const audioInputs = devices
                .filter((device) => device.kind === "audioinput")
                .map((device) => ({
                    deviceId: device.deviceId,
                    label: device.label || `Microphone ${audioDevices.length + 1}`,
                }));

            setVideoDevices(videoInputs);
            setAudioDevices(audioInputs);

            if (videoInputs.length > 0 && !selectedVideoDevice) {
                setSelectedVideoDevice(videoInputs[0].deviceId);
            }
            if (audioInputs.length > 0 && !selectedAudioDevice) {
                setSelectedAudioDevice(audioInputs[0].deviceId);
            }
        } catch (err) {
            console.error("[v0] Failed to enumerate devices:", err);
        }
    };

    const startCapture = async () => {
        try {
            setError(null);
            const constraints: MediaStreamConstraints = {};

            if (type === "picture" || type === "video") {
                constraints.video = selectedVideoDevice
                    ? {
                        deviceId: {exact: selectedVideoDevice},
                        width: {ideal: 1920},
                        height: {ideal: 1080},
                    }
                    : {
                        facingMode,
                        width: {ideal: 1920},
                        height: {ideal: 1080},
                    };
            }

            if (type === "video" || type === "audio") {
                constraints.audio = selectedAudioDevice ? {deviceId: {exact: selectedAudioDevice}} : true;
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);

            if (videoRef.current && (type === "picture" || type === "video")) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError(
                `Unable to access ${type === "audio" ? "microphone" : "camera"}. Please check permissions and try again.`,
            );
        }
    };

    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
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
                const imageData = canvas.toDataURL("image/jpeg", 0.95);
                setCapturedData(imageData);
                stopStream();
            }
        }
    };

    const startRecording = () => {
        if (!stream) {
            return;
        }

        try {
            const mimeType = type === "video" ? "video/webm" : "audio/webm";
            const mediaRecorder = new MediaRecorder(stream, {mimeType});

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {type: mimeType});
                const url = URL.createObjectURL(blob);
                setCapturedData(url);
                stopStream();
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            setError("Failed to start recording. Please try again.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const retake = () => {
        setCapturedData(null);
        setRecordingTime(0);
        chunksRef.current = [];
        startCapture();
    };

    const confirmCapture = async () => {
        if (!capturedData) {
            return;
        }

        try {
            let blob: Blob;
            let fileName: string;
            let mimeType: string;

            if (type === "picture") {
                const response = await fetch(capturedData);
                blob = await response.blob();
                fileName = `captured-photo-${Date.now()}.jpg`;
                mimeType = "image/jpeg";
            } else if (type === "video") {
                const response = await fetch(capturedData);
                blob = await response.blob();
                fileName = `captured-video-${Date.now()}.webm`;
                mimeType = "video/webm";
            } else {
                const response = await fetch(capturedData);
                blob = await response.blob();
                fileName = `captured-audio-${Date.now()}.webm`;
                mimeType = "audio/webm";
            }

            const file = new File([blob], fileName, {type: mimeType});
            onCapture(file);
        } catch (err) {
            setError("Failed to process captured media. Please try again.");
        }
    };

    const toggleCamera = () => {
        setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
        setCapturedData(null);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const startDeviceTest = async (deviceType: "video" | "audio") => {
        try {
            stopDeviceTest();

            const constraints: MediaStreamConstraints = {};

            if (deviceType === "video" && selectedVideoDevice) {
                constraints.video = {
                    deviceId: {exact: selectedVideoDevice},
                    width: {ideal: 640},
                    height: {ideal: 480},
                };
            } else if (deviceType === "audio" && selectedAudioDevice) {
                constraints.audio = {deviceId: {exact: selectedAudioDevice}};
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setTestStream(mediaStream);

            if (deviceType === "video" && testVideoRef.current) {
                testVideoRef.current.srcObject = mediaStream;
            } else if (deviceType === "audio") {
                // Set up audio analysis
                const audioContext = new AudioContext();
                const analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(mediaStream);

                analyser.fftSize = 256;
                source.connect(analyser);

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;

                // Start monitoring audio levels
                monitorAudioLevel();
            }
        } catch (err) {
            console.error("[v0] Failed to start device test:", err);
        }
    };

    const monitorAudioLevel = () => {
        if (!analyserRef.current) {
            return;
        }

        const analyser = analyserRef.current;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const normalizedLevel = Math.min(100, (average / 255) * 100);
            setAudioLevel(normalizedLevel);

            animationFrameRef.current = requestAnimationFrame(checkLevel);
        };

        checkLevel();
    };

    const stopDeviceTest = () => {
        if (testStream) {
            testStream.getTracks().forEach((track) => track.stop());
            setTestStream(null);
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        analyserRef.current = null;
        setAudioLevel(0);
    };

    useEffect(() => {
        if (!settingsOpen) {
            stopDeviceTest();
        }
    }, [settingsOpen]);

    return (
        <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    {type === "picture" && <Camera className="h-5 w-5"/>}
                    {type === "video" && <Video className="h-5 w-5"/>}
                    {type === "audio" && <Mic className="h-5 w-5"/>}
                    Capture {type === "picture" ? "Photo" : type === "video" ? "Video" : "Audio"}
                </h3>
                <div className="flex items-center gap-2">
                    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isRecording || !!capturedData}>
                                <Settings className="h-5 w-5"/>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Device Settings</DialogTitle>
                                <DialogDescription>Select and test your camera and microphone before
                                    capturing.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                {(type === "picture" || type === "video") && videoDevices.length > 0 && (
                                    <div className="space-y-3">
                                        <Label htmlFor="camera-select">Camera</Label>
                                        <Select
                                            value={selectedVideoDevice}
                                            onValueChange={(value) => {
                                                setSelectedVideoDevice(value);
                                                if (testStream?.getVideoTracks().length) {
                                                    stopDeviceTest();
                                                    startDeviceTest("video");
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="camera-select">
                                                <SelectValue placeholder="Select a camera"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {videoDevices.map((device) => (
                                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                                        {device.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm text-muted-foreground">Camera Preview</Label>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (testStream?.getVideoTracks().length) {
                                                            stopDeviceTest();
                                                        } else {
                                                            startDeviceTest("video");
                                                        }
                                                    }}
                                                >
                                                    {testStream?.getVideoTracks().length ? "Stop Test" : "Test Camera"}
                                                </Button>
                                            </div>
                                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                                {testStream?.getVideoTracks().length ? (
                                                    <video ref={testVideoRef} autoPlay playsInline muted
                                                           className="w-full h-full object-cover"/>
                                                ) : (
                                                    <div
                                                        className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        <div className="text-center space-y-2">
                                                            <Camera className="h-12 w-12 mx-auto opacity-50"/>
                                                            <p className="text-sm">Click "Test Camera" to preview</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(type === "video" || type === "audio") && audioDevices.length > 0 && (
                                    <div className="space-y-3">
                                        <Label htmlFor="microphone-select">Microphone</Label>
                                        <Select
                                            value={selectedAudioDevice}
                                            onValueChange={(value) => {
                                                setSelectedAudioDevice(value);
                                                if (testStream?.getAudioTracks().length) {
                                                    stopDeviceTest();
                                                    startDeviceTest("audio");
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="microphone-select">
                                                <SelectValue placeholder="Select a microphone"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {audioDevices.map((device) => (
                                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                                        {device.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm text-muted-foreground">Microphone
                                                    Level</Label>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (testStream?.getAudioTracks().length) {
                                                            stopDeviceTest();
                                                        } else {
                                                            startDeviceTest("audio");
                                                        }
                                                    }}
                                                >
                                                    {testStream?.getAudioTracks().length ? "Stop Test" : "Test Microphone"}
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-8 bg-secondary rounded-lg overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
                                                        style={{width: `${audioLevel}%`}}
                                                    />
                                                    {!testStream?.getAudioTracks().length && (
                                                        <div
                                                            className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                                                            Click "Test Microphone" to check audio levels
                                                        </div>
                                                    )}
                                                </div>
                                                {testStream?.getAudioTracks().length && (
                                                    <p className="text-xs text-muted-foreground text-center">
                                                        {audioLevel < 10
                                                            ? "Speak louder or adjust microphone position"
                                                            : audioLevel < 50
                                                                ? "Good audio level"
                                                                : audioLevel < 80
                                                                    ? "Strong audio level"
                                                                    : "Audio level too high - may cause distortion"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {videoDevices.length === 0 && audioDevices.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No devices found. Please check your permissions and ensure devices are
                                        connected.
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => setSettingsOpen(false)}>Done</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="h-5 w-5"/>
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!capturedData ? (
                <div className="space-y-4">
                    {(type === "picture" || type === "video") && (
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
                            {isRecording && (
                                <div
                                    className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full">
                                    <Circle className="h-3 w-3 fill-current animate-pulse"/>
                                    <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {type === "audio" && (
                        <div
                            className="aspect-video bg-gradient-to-br from-royal-purple/20 to-royal-blue/20 rounded-lg flex flex-col items-center justify-center gap-4">
                            <div
                                className={`p-8 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-royal-purple"}`}>
                                <Mic className="h-16 w-16 text-white"/>
                            </div>
                            {isRecording && <div className="text-2xl font-bold">{formatTime(recordingTime)}</div>}
                        </div>
                    )}

                    <div className="flex gap-2">
                        {type === "picture" && (
                            <>
                                <Button onClick={capturePhoto} disabled={!stream} className="flex-1" size="lg">
                                    <Camera className="h-5 w-5 mr-2"/>
                                    Take Photo
                                </Button>
                                <Button onClick={toggleCamera} disabled={!stream} variant="outline" size="lg">
                                    <RotateCcw className="h-5 w-5"/>
                                </Button>
                            </>
                        )}

                        {(type === "video" || type === "audio") && !isRecording && (
                            <Button onClick={startRecording} disabled={!stream} className="flex-1" size="lg">
                                <Circle className="h-5 w-5 mr-2 fill-current"/>
                                Start Recording
                            </Button>
                        )}

                        {(type === "video" || type === "audio") && isRecording && (
                            <Button onClick={stopRecording} variant="destructive" className="flex-1" size="lg">
                                <Square className="h-5 w-5 mr-2"/>
                                Stop Recording
                            </Button>
                        )}

                        {type === "video" && (
                            <Button onClick={toggleCamera} disabled={!stream || isRecording} variant="outline"
                                    size="lg">
                                <RotateCcw className="h-5 w-5"/>
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        {type === "picture" && (
                            <img src={capturedData || "/placeholder.svg"} alt="Captured"
                                 className="w-full h-full object-cover"/>
                        )}
                        {type === "video" &&
                            <video src={capturedData} controls className="w-full h-full object-cover"/>}
                        {type === "audio" && (
                            <div
                                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-royal-purple/20 to-royal-blue/20">
                                <audio src={capturedData} controls className="w-full max-w-md"/>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={retake} variant="outline" className="flex-1 bg-transparent">
                            <RotateCcw className="h-5 w-5 mr-2"/>
                            Retake
                        </Button>
                        <Button onClick={confirmCapture}
                                className="flex-1 bg-gradient-to-r from-royal-purple to-royal-blue">
                            <Check className="h-5 w-5 mr-2"/>
                            Use This
                        </Button>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden"/>
        </Card>
    );
}
