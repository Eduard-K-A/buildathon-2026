type SpeakOptions = {
  language: "auto" | "english" | "filipino" | "taglish";
  speed: "normal" | "slow";
};

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let cachedVoices: SpeechSynthesisVoice[] = [];

if (speechSupported()) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    cachedVoices = window.speechSynthesis.getVoices();
  });
}

export function speechLanguageFor(language: SpeakOptions["language"]) {
  return language === "english" ? "en-PH" : "fil-PH";
}

function pickVoice(language: SpeakOptions["language"]): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices();
  const preferences =
    language === "filipino" || language === "taglish"
      ? ["fil-PH", "fil", "tl", "en-PH", "en-US"]
      : ["en-PH", "en-GB", "en-US"];
  for (const prefix of preferences) {
    const match = voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix.toLowerCase()));
    if (match) return match;
  }
  return null;
}

export function speak(text: string, options: SpeakOptions) {
  if (!speechSupported() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLanguageFor(options.language);
  utterance.rate = options.speed === "slow" ? 0.85 : 1;
  utterance.pitch = 1;
  const voice = pickVoice(options.language);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
}
