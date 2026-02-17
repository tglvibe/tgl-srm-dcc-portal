// Gemini AI integration for Projections
// Add VITE_GEMINI_API_KEY to your environment variables

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function queryGemini(prompt: string, context?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn("VITE_GEMINI_API_KEY not set. AI features disabled.");
    return "AI features are not configured. Please add your Gemini API key.";
  }

  const systemPrompt = `You are a Projections assistant for SRM IST University's Executive Portal. 
You analyze student assessment data, placement trends, and provide actionable insights.
${context ? `\nContext data:\n${context}` : ""}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + prompt }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      return "AI service temporarily unavailable.";
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  } catch (error) {
    console.error("Gemini query failed:", error);
    return "Failed to connect to AI service.";
  }
}

export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}
