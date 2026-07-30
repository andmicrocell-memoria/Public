import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: ".env.local" });
const key = process.env.GEMINI_API_KEY;

if (!key) {
  console.log("Missing GEMINI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: key });
const pager = await ai.models.list();

const out = [];
for await (const m of pager) {
  const methods = m.supportedActions || m.supportedGenerationMethods || [];
  const asText = JSON.stringify(methods);
  if (asText.toLowerCase().includes("generatecontent")) {
    out.push(m.name);
  }
}

console.log(JSON.stringify(out.slice(0, 80), null, 2));
