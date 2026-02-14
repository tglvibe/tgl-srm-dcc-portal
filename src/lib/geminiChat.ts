// Gemini AI Chat with multi-key rotation (frontend-only)
// Keys are stored as comma-separated in VITE_GEMINI_API_KEYS (or single in VITE_GEMINI_API_KEY)

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function getApiKeys(): string[] {
  const multi = import.meta.env.VITE_GEMINI_API_KEYS as string | undefined;
  const single = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const raw = multi || single || "";
  return raw.split(",").map(k => k.trim()).filter(Boolean);
}

let _currentKeyIndex = 0;

function rotateKey(): string | null {
  const keys = getApiKeys();
  if (keys.length === 0) return null;
  // find next available key (simple round-robin)
  const key = keys[_currentKeyIndex % keys.length];
  _currentKeyIndex = (_currentKeyIndex + 1) % keys.length;
  return key;
}

export function isGeminiChatConfigured(): boolean {
  return getApiKeys().length > 0;
}

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

// Request throttle tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds minimum between requests

export async function chatWithGemini(
  messages: ChatMessage[],
  systemPrompt: string,
  maxRetries?: number
): Promise<string> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    return "⚠️ Gemini API key not configured. Add VITE_GEMINI_API_KEY or VITE_GEMINI_API_KEYS (comma-separated) to enable AI features.";
  }

  // Enforce minimum interval between requests to avoid rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.warn(`Rate limit protection: waiting ${waitTime}ms before next request...`);
    await new Promise((res) => setTimeout(res, waitTime));
  }
  lastRequestTime = Date.now();

  const retries = maxRetries ?? Math.min(keys.length, 2); // Limit retries

  let backoffBase = 2000; // Start with 2 seconds instead of 300ms

  for (let attempt = 0; attempt < retries; attempt++) {
    const key = rotateKey();
    if (!key) break;

    try {
      const contents = [
        { role: "user" as const, parts: [{ text: systemPrompt }] },
        { role: "model" as const, parts: [{ text: "Understood. I'm ready to help." }] },
        ...messages,
      ];

      const response = await fetch(`${GEMINI_API_URL}?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      });

      if (response.status === 429 || response.status === 403) {
        // Rate limited — aggressive exponential backoff and try next key
        const wait = backoffBase * Math.pow(3, attempt); // 3x multiplier for faster backoff
        console.warn(`Gemini key ${attempt + 1} rate-limited/forbidden, rotating after ${wait}ms...`);
        await new Promise((res) => setTimeout(res, wait));
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        console.error("Gemini error:", err);
        // Try next key instead of failing immediately
        continue;
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (err) {
      console.error(`Gemini attempt ${attempt + 1} failed:`, err);
      if (attempt < retries - 1) {
        const wait = backoffBase * Math.pow(3, attempt);
        await new Promise((res) => setTimeout(res, wait));
      }
    }
  }

  return "All API keys exhausted or requests failed. Please try again later.";
}
