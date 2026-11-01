"use client";

import { useEffect, useRef, useState } from "react";
import { formatRecordingDuration, getMicrophoneErrorMessage, getSupportedRecordingMimeType } from "@/lib/speaking";

type RecorderStatus = "idle" | "requesting" | "recording" | "processing" | "ready";
const MAX_SECONDS = 60;

/**
 * Privacy-first speaking practice: microphone audio is held in memory only.
 * A key on the parent component remounts this recorder for each lesson.
 */
export default function SpeakingRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const urlRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const activeRef = useRef(true);
  const requestingRef = useRef(false);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      // Microphone permission can resolve after unmount: startRecording checks activeRef.
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        if (recorder.state !== "inactive") {
          try { recorder.stop(); } catch { /* Recorder may already be stopping. */ }
        }
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const stopClock = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const releaseStream = (stream: MediaStream) => {
    stream.getTracks().forEach((track) => track.stop());
    if (streamRef.current === stream) streamRef.current = null;
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    stopClock();
    setSeconds(Math.min(MAX_SECONDS, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    setStatus("processing");
    try {
      recorder.stop();
    } catch {
      setError("Could not finish recording. Please try again.");
      setStatus(urlRef.current ? "ready" : "idle");
      if (streamRef.current) releaseStream(streamRef.current);
    }
  };

  const startRecording = async () => {
    if (requestingRef.current || recorderRef.current?.state === "recording" || status === "processing") return;
    setError("");
    if (!window.isSecureContext) {
      setError("Microphone recording requires a secure HTTPS connection.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser does not support microphone recording. Try a current Safari, Chrome, or Edge browser.");
      return;
    }

    requestingRef.current = true;
    setStatus("requesting");
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (!activeRef.current) {
        releaseStream(stream);
        return;
      }

      const mimeType = typeof MediaRecorder.isTypeSupported === "function"
        ? getSupportedRecordingMimeType((type) => MediaRecorder.isTypeSupported(type))
        : undefined;
      // Capture the non-null stream for callbacks that run after this function returns.
      const mediaStream: MediaStream = stream;
      const recorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
      const chunks: Blob[] = [];
      let failed = false;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => {
        failed = true;
        stopClock();
        releaseStream(mediaStream);
        if (!activeRef.current) return;
        setStatus(urlRef.current ? "ready" : "idle");
        setError("Recording was interrupted. Please try again.");
      };
      recorder.onstop = () => {
        stopClock();
        releaseStream(mediaStream);
        if (recorderRef.current === recorder) recorderRef.current = null;
        if (failed || !activeRef.current) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || "audio/webm" });
        if (!blob.size) {
          setError("No audio was captured. Check your microphone and record again.");
          setStatus(urlRef.current ? "ready" : "idle");
          return;
        }
        try {
          const url = URL.createObjectURL(blob);
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          urlRef.current = url;
          setRecordingUrl(url);
          setStatus("ready");
          setError("");
        } catch {
          setError("The recording could not be played back. Please try again.");
          setStatus("idle");
        }
      };

      recorder.start();
      recorderRef.current = recorder;
      streamRef.current = mediaStream;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
        setRecordingUrl(null);
      }
      startedAtRef.current = Date.now();
      setSeconds(0);
      setStatus("recording");
      intervalRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setSeconds(Math.min(MAX_SECONDS, elapsed));
        if (elapsed >= MAX_SECONDS && recorder.state === "recording") {
          stopClock();
          setStatus("processing");
          recorder.stop();
        }
      }, 250);
    } catch (reason) {
      if (stream) releaseStream(stream);
      if (activeRef.current) {
        setStatus(urlRef.current ? "ready" : "idle");
        setError(getMicrophoneErrorMessage(reason));
      }
    } finally {
      requestingRef.current = false;
    }
  };

  const discardRecording = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setRecordingUrl(null);
    setSeconds(0);
    setStatus("idle");
    setError("");
  };

  return (
    <section className="speaking-recorder section-block" aria-labelledby="speaking-recorder-heading">
      <div className="speaking-recorder-header">
        <div>
          <p className="kicker">Your speaking practice</p>
          <h3 id="speaking-recorder-heading">Record your voice</h3>
          <p lang="te">ముందు ఉదాహరణను వినండి. తర్వాత మీ గొంతుతో మాట్లాడి, విని, మళ్లీ ప్రయత్నించండి.</p>
        </div>
        <span className="speaking-local-badge">Private · On this device</span>
      </div>
      <p className="speaking-recorder-help">Listen to the example above, say your answer aloud, and play it back. You can try as often as you like (up to 60 seconds per attempt).</p>
      <div className="speaking-recorder-actions">
        {status === "recording" ? (
          <button className="speaking-stop" type="button" onClick={stopRecording}>
            <span aria-hidden="true">■</span> Stop recording
          </button>
        ) : (
          <button className="speaking-record" type="button" onClick={() => void startRecording()} disabled={status === "requesting" || status === "processing"}>
            <span aria-hidden="true">●</span> {status === "requesting" ? "Waiting for microphone…" : status === "processing" ? "Preparing audio…" : recordingUrl ? "Record again" : "Start recording"}
          </button>
        )}
        {status === "recording" && (
          <span className="speaking-timer" role="timer" aria-label="Recording time">
            <span className="speaking-live-dot" aria-hidden="true" />
            {formatRecordingDuration(seconds)} / 1:00
          </span>
        )}
      </div>

      {status === "ready" && recordingUrl && (
        <div className="speaking-playback">
          <strong>Your speaking attempt</strong>
          <audio controls preload="metadata" src={recordingUrl} aria-label="Listen to your speaking attempt">
            Your browser does not support audio playback.
          </audio>
          <button type="button" className="speaking-delete" onClick={discardRecording}>Delete recording</button>
        </div>
      )}
      {error && <p className="speaking-error" role="alert">{error}</p>}
      <p className="speaking-privacy">
        Recordings are never uploaded. This attempt is temporary and disappears when you leave the lesson, refresh, or close the page. It is not graded automatically.
      </p>
    </section>
  );
}
