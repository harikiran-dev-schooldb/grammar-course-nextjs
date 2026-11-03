"use client";

export type SpeechLanguage = "en" | "te";

type SpeechOptions = {
  language?: SpeechLanguage;
  rate?: number;
};

const fallbackSpeak = (text: string, language: SpeechLanguage, rate: number) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === "te" ? "te-IN" : "en-IN";
  utterance.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const locale = utterance.lang.toLowerCase();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === locale)
    || voices.find((voice) => voice.lang.toLowerCase().startsWith(language))
    || null;
  window.speechSynthesis.speak(utterance);
};

const hashText = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).slice(0, 12).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export async function speakText(text: string, options: SpeechOptions = {}) {
  const language = options.language || "en";
  const rate = Math.max(.6, Math.min(1.15, options.rate || .82));
  if (!text.trim()) return;
  try {
    const cacheKey = `/__neural_voice_v1__/${language}/${await hashText(`${rate}:${text}`)}`;
    const cache = "caches" in window ? await caches.open("grammar-studio-neural-voice-v1") : null;
    let audioResponse = cache ? await cache.match(cacheKey) : undefined;
    if (!audioResponse) {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language, rate }),
      });
      if (!response.ok) throw new Error("Neural speech unavailable");
      audioResponse = response;
      if (cache) await cache.put(cacheKey, response.clone());
    }
    const url = URL.createObjectURL(await audioResponse.blob());
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.onerror = () => URL.revokeObjectURL(url);
    await audio.play();
  } catch {
    fallbackSpeak(text, language, rate);
  }
}

export async function neuralVoiceAvailable() {
  try {
    const response = await fetch("/api/speech", { cache: "no-store" });
    if (!response.ok) return false;
    return Boolean((await response.json() as { configured?: boolean }).configured);
  } catch {
    return false;
  }
}
