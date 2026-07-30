import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: ".env.local" });

const key = process.env.GEMINI_API_KEY;
console.log("KEY_PRESENT=" + Boolean(key));

if (!key) {
  console.log("GEMINI_ERR=Missing GEMINI_API_KEY");
  process.exit(1);
}

try {
  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: "responda apenas: ok",
  });

  console.log("GEMINI_OK=" + Boolean(response?.text));
  console.log("TEXT=" + String(response?.text || "").slice(0, 120));
} catch (e) {
  console.log("GEMINI_ERR=" + (e?.message || String(e)));
  if (e?.status) console.log("STATUS=" + e.status);
  process.exit(2);
}
