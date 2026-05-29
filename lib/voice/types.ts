export interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel?: () => void;
  maxDuration?: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export interface VoicePlayerProps {
  url: string;
  compact?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  className?: string;
}

export type RecorderState = "idle" | "recording" | "paused" | "preview";
