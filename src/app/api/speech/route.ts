import { NextResponse } from "next/server";

const configured = () => Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[character]!));

export async function GET() {
  return NextResponse.json({ configured: configured(), provider: configured() ? "Azure neural voices" : "Device voice fallback" });
}

export async function POST(request: Request) {
  if (!configured()) return NextResponse.json({ error: "Neural speech is not configured." }, { status: 503 });
  const body = await request.json() as { text?: unknown; language?: unknown; rate?: unknown };
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 1200) : "";
  const language = body.language === "te" ? "te" : "en";
  const rate = typeof body.rate === "number" ? Math.max(.6, Math.min(1.15, body.rate)) : .82;
  if (!text) return NextResponse.json({ error: "Text is required." }, { status: 400 });
  const locale = language === "te" ? "te-IN" : "en-IN";
  const voice = language === "te"
    ? process.env.AZURE_SPEECH_VOICE_TE || "te-IN-ShrutiNeural"
    : process.env.AZURE_SPEECH_VOICE_EN || "en-IN-NeerjaNeural";
  const region = process.env.AZURE_SPEECH_REGION!;
  const ssml = `<speak version="1.0" xml:lang="${locale}"><voice name="${voice}"><prosody rate="${Math.round(rate * 100)}%">${escapeXml(text)}</prosody></voice></speak>`;
  const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY!,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "GrammarStudio",
    },
    body: ssml,
  });
  if (!response.ok) return NextResponse.json({ error: "Speech provider request failed." }, { status: 502 });
  return new Response(await response.arrayBuffer(), {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
  });
}
