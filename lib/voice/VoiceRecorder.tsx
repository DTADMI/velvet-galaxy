"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RecorderState, VoiceRecorderProps } from "./types";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = 120,
  t,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopWaveform = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const cleanupMedia = useCallback(() => {
    stopTimer();
    stopWaveform();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [stopTimer, stopWaveform]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = canvas.parentElement?.className.includes("bg-royal") ? "#1e1e3f" : "#f3f4f6";
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#8b5cf6";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("preview");
        stopTimer();
        stopWaveform();
      };

      recorder.start(250);
      startTimeRef.current = Date.now();
      setDuration(0);
      setState("recording");

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);
        if (elapsed >= maxDuration) {
          recorder.stop();
          cleanupMedia();
        }
      }, 100);

      drawWaveform();
    } catch (err) {
      setError(t("voice.recorder.errorMicrophone"));
      console.error("Microphone access denied:", err);
    }
  }, [maxDuration, cleanupMedia, stopTimer, stopWaveform, drawWaveform, t]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      cleanupMedia();
    }
  }, [state, cleanupMedia]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.pause();
      stopTimer();
      setState("paused");
    }
  }, [state, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "paused") {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now() - duration * 1000;
      setState("recording");
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);
        if (elapsed >= maxDuration) {
          mediaRecorderRef.current?.stop();
          cleanupMedia();
        }
      }, 100);
    }
  }, [state, duration, maxDuration, cleanupMedia]);

  const handleSend = useCallback(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, Math.floor(duration));
    }
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setState("idle");
    setDuration(0);
  }, [audioBlob, audioUrl, duration, onRecordingComplete]);

  const handleCancel = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setState("idle");
    setDuration(0);
    setError(null);
    onCancel?.();
  }, [audioUrl, onCancel]);

  useEffect(() => {
    return () => {
      cleanupMedia();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cleanupMedia, audioUrl]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {state === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 transition-colors"
          aria-label={t("voice.recorder.startRecording")}
        >
          <span className="h-3 w-3 rounded-full bg-white animate-pulse" />
          {t("voice.recorder.record")}
        </button>
      )}

      {(state === "recording" || state === "paused") && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                state === "recording" ? "bg-destructive animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="text-sm font-medium">
              {state === "recording" ? t("voice.recorder.recording") : t("voice.recorder.paused")}
            </span>
            <span className="text-sm text-muted-foreground ml-auto tabular-nums">
              {formatDuration(duration)}
            </span>
          </div>

          <canvas
            ref={canvasRef}
            width={300}
            height={60}
            className="w-full h-[60px] rounded-md bg-muted"
          />

          <div className="flex items-center gap-2">
            {state === "recording" ? (
              <button
                type="button"
                onClick={pauseRecording}
                className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
                aria-label={t("voice.recorder.pause")}
              >
                {t("voice.recorder.pause")}
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeRecording}
                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                aria-label={t("voice.recorder.resume")}
              >
                {t("voice.recorder.resume")}
              </button>
            )}
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90 transition-colors"
              aria-label={t("voice.recorder.stop")}
            >
              {t("voice.recorder.stop")}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors ml-auto"
              aria-label={t("voice.recorder.cancel")}
            >
              {t("voice.recorder.cancel")}
            </button>
          </div>
        </div>
      )}

      {state === "preview" && audioUrl && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t("voice.recorder.preview")}</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatDuration(duration)}
            </span>
          </div>

          <audio
            ref={previewAudioRef}
            src={audioUrl}
            controls
            className="w-full h-10"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSend}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
              aria-label={t("voice.recorder.sendVoiceMessage")}
            >
              {t("voice.recorder.sendVoiceMessage")}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              aria-label={t("voice.recorder.cancel")}
            >
              {t("voice.recorder.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
