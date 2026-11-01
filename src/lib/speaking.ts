/** Pure browser-support helpers, kept separate from the recorder for testing. */
export function getSupportedRecordingMimeType(isSupported: (mimeType: string) => boolean): string | undefined {
  return ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"]
    .find((mimeType) => isSupported(mimeType));
}

export function formatRecordingDuration(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return Math.floor(safe / 60) + ":" + String(safe % 60).padStart(2, "0");
}

export function getMicrophoneErrorMessage(error: unknown): string {
  const name = typeof error === "object" && error !== null && "name" in error
    ? String(error.name)
    : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "Microphone access was denied. Allow access in your browser settings and try again.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No microphone was found. Connect a microphone and try again.";
    case "NotReadableError":
    case "TrackStartError":
      return "Your microphone is being used by another app or is unavailable.";
    case "OverconstrainedError":
      return "Your microphone does not support the requested settings. Try another device.";
    default:
      return "Recording could not start. Check your microphone and try again.";
  }
}
