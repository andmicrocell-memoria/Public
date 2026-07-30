import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc, runTransaction } from "firebase/firestore";
import { spawn } from "child_process";

const envPath = fs.existsSync(path.resolve(process.cwd(), ".env.local"))
  ? path.resolve(process.cwd(), ".env.local")
  : path.resolve(process.cwd(), ".env");

dotenv.config({ path: envPath });

// Safe resolution of __filename and __dirname for both ESM and CJS bundled environments
const resolvedFilename = (typeof import.meta !== "undefined" && import.meta.url)
  ? fileURLToPath(import.meta.url)
  : (typeof __filename !== "undefined" ? __filename : process.cwd());

const resolvedDirname = (typeof import.meta !== "undefined" && import.meta.url)
  ? path.dirname(resolvedFilename)
  : (typeof __dirname !== "undefined" ? __dirname : process.cwd());

// In-memory Webhook logs store
interface WebhookLog {
  id: string;
  timestamp: string;
  direction: 'inbound' | 'outbound' | 'system' | 'error';
  message: string;
  details?: string;
}

let webhookLogs: WebhookLog[] = [
  { id: "init-log-1", timestamp: new Date().toLocaleTimeString('pt-BR'), direction: 'system', message: "Sistema de Webhook Oficial Inicializado", details: "Aguardando requisições do Meta Developer Portal" }
];

// Verbose logging toggle (can be enabled at runtime via API)
let verboseLogs = false;

const setVerboseLogs = (v: boolean) => { verboseLogs = !!v; addWebhookLog('system', `Verbose logs ${v ? 'ativados' : 'desativados'}`, `verboseLogs=${v}`); };

const verboseLog = (direction: WebhookLog['direction'] | 'debug', message: string, details?: string) => {
  if (!verboseLogs) return;
  addWebhookLog(direction === 'debug' ? 'system' : direction as any, message, details);
  try { console.debug(`[VERBOSE] ${message}`, details || ''); } catch (e) {}
};

const addWebhookLog = (direction: WebhookLog['direction'], message: string, details?: string) => {
  const newLog: WebhookLog = {
    id: `wlog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toLocaleTimeString('pt-BR'),
    direction,
    message,
    details
  };
  webhookLogs = [newLog, ...webhookLogs.slice(0, 99)]; // Keep last 100 webhook logs
};

const configDir = path.join(process.cwd(), "data");
const configFilePath = path.join(configDir, "config.json");
const postsFilePath = path.join(configDir, "posts.json");

function ensureConfigDir() {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

function loadStoredPosts() {
  ensureConfigDir();
  if (fs.existsSync(postsFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(postsFilePath, "utf8"));
    } catch (e) {
      console.error("Error reading posts file:", e);
    }
  }
  return [];
}

function saveStoredPosts(posts: any) {
  ensureConfigDir();
  try {
    fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing posts file:", e);
  }
}

function loadStoredConfig() {
  ensureConfigDir();
  if (fs.existsSync(configFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(configFilePath, "utf8"));
    } catch (e: any) {
      console.error("Error reading config file:", e);
      try {
        const raw = fs.readFileSync(configFilePath, "utf8");
        console.error("Raw config file length:", raw.length, "content preview:", raw.slice(0, 300));
        const backupPath = `${configFilePath}.invalid-${Date.now()}`;
        fs.copyFileSync(configFilePath, backupPath);
        console.error(`Invalid config file backed up to ${backupPath}`);
      } catch (backupError: any) {
        console.error("Failed to backup invalid config file:", backupError);
      }

      const fallbackConfig = {
        name: "AndMicrocell - Assistência Técnica",
        category: "Assistência Técnica",
        address: "Rua Exemplo, 123",
        phone: "(81) 99999-9999",
        businessHours: "Segunda a Sexta: 08h às 12h e das 14h às 18h | Sábados: 09h às 13h",
        tone: "acolhedor, profissional e ágil",
        specialOffers: "",
        faqs: [],
        whatsappVerifyToken: "zetachat_secret_token"
      };

      try {
        fs.writeFileSync(configFilePath, JSON.stringify(fallbackConfig, null, 2), "utf8");
        console.error("Replaced invalid config file with fallback defaults.");
      } catch (writeError: any) {
        console.error("Failed to write fallback config file:", writeError);
      }
      return fallbackConfig;
    }
  }
  return null;
}

function saveStoredConfig(config: any) {
  ensureConfigDir();
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing config file:", e);
  }
}

// Initialize Firebase Firestore safely
let db: any = null;

try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    const firebaseApp = initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    });
    // Initialize Firestore with custom databaseId if configured, else default
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log("Firebase Firestore initialized successfully in server with Database ID:", firebaseConfig.firestoreDatabaseId || "(default)");
  } else {
    console.warn("firebase-applet-config.json not found, falling back to local files.");
  }
} catch (e: any) {
  console.error("Failed to initialize Firebase:", e.message);
}

// Wrapper for Firestore Config loading/saving with Local File backup/fallback
async function getFirebaseConfig() {
  if (db) {
    try {
      const configDocRef = doc(db, "config", "business");
      const snapshot = await getDoc(configDocRef);
      if (snapshot.exists()) {
        return snapshot.data();
      }
    } catch (e: any) {
      console.error("Error reading config from Firestore:", e.message);
    }
  }
  return loadStoredConfig(); // fallback to local JSON
}

async function saveFirebaseConfig(config: any) {
  saveStoredConfig(config); // save to local file as backup
  if (db) {
    try {
      const configDocRef = doc(db, "config", "business");
      await setDoc(configDocRef, config);
      console.log("Config saved to Firestore successfully!");
    } catch (e: any) {
      console.error("Error saving config to Firestore:", e.message);
    }
  }
}

// Wrapper for Firestore Posts loading/saving/deleting with Local File backup/fallback
async function getFirebasePosts(): Promise<any[]> {
  if (db) {
    try {
      const postsCol = collection(db, "posts");
      const snapshot = await getDocs(postsCol);
      if (!snapshot.empty) {
        const posts: any[] = [];
        snapshot.forEach((doc) => {
          posts.push(doc.data());
        });
        // Sort posts by date or id descending to keep most recent first
        return posts.sort((a, b) => {
          const dateA = a.publishedAt || "";
          const dateB = b.publishedAt || "";
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA); // newest date first
          }
          return (b.id || "").localeCompare(a.id || ""); // fallback to ID sorting
        });
      }
    } catch (e: any) {
      console.error("Error reading posts from Firestore:", e.message);
    }
  }
  return loadStoredPosts(); // fallback to local JSON
}

async function saveFirebasePost(post: any) {
  if (db && post && post.id) {
    try {
      await setDoc(doc(db, "posts", post.id), post);
      console.log(`Post ${post.id} saved to Firestore successfully!`);
    } catch (e: any) {
      console.error(`Error saving post ${post.id} to Firestore:`, e.message);
      throw e;
    }
  }
  // Keep local posts file updated as backup
  try {
    const currentPosts = loadStoredPosts();
    const index = currentPosts.findIndex((p: any) => p.id === post.id);
    if (index !== -1) {
      currentPosts[index] = { ...currentPosts[index], ...post };
    } else {
      currentPosts.unshift(post);
    }
    saveStoredPosts(currentPosts);
  } catch (e) {
    console.error("Error writing local posts backup:", e);
  }
}

async function deleteFirebasePost(postId: string) {
  if (db) {
    try {
      await deleteDoc(doc(db, "posts", postId));
      console.log(`Post ${postId} deleted from Firestore!`);
    } catch (e: any) {
      console.error(`Error deleting post ${postId} from Firestore:`, e.message);
      throw e;
    }
  }
  // Keep local posts file updated as backup
  try {
    const currentPosts = loadStoredPosts();
    const filtered = currentPosts.filter((p: any) => p.id !== postId);
    saveStoredPosts(filtered);
  } catch (e) {
    console.error("Error writing local posts backup after delete:", e);
  }
}

// Migrate local JSON data to Firestore if Firestore is empty on start
async function runFirebaseMigrations() {
  if (!db) return;
  try {
    // 1. Migrate config
    const configDocRef = doc(db, "config", "business");
    const configSnapshot = await getDoc(configDocRef);
    if (!configSnapshot.exists()) {
      console.log("Firestore business config not found. Migrating local config...");
      const localConfig = loadStoredConfig();
      if (localConfig) {
        await setDoc(configDocRef, localConfig);
        console.log("Successfully migrated config to Firestore!");
      }
    } else {
      // If Firestore config exists, check if local config is different (e.g. user edited local file directly)
      const firestoreConfig = configSnapshot.data();
      const localConfig = loadStoredConfig();
      if (localConfig && (
        localConfig.phone !== firestoreConfig.phone || 
        localConfig.name !== firestoreConfig.name || 
        localConfig.address !== firestoreConfig.address ||
        localConfig.category !== firestoreConfig.category
      )) {
        console.log("Local config differs from Firestore. Syncing local changes (phone/name/address/category) to Firestore...");
        const mergedConfig = { ...firestoreConfig, ...localConfig };
        await setDoc(configDocRef, mergedConfig);
        console.log("Successfully synchronized local config changes to Firestore!");
      }
    }

    // 2. Migrate posts
    const postsCol = collection(db, "posts");
    const postsSnapshot = await getDocs(postsCol);
    if (postsSnapshot.empty) {
      console.log("Firestore posts collection is empty. Migrating local posts...");
      const localPosts = loadStoredPosts();
      for (const post of localPosts) {
        if (post && post.id) {
          await setDoc(doc(db, "posts", post.id), post);
        }
      }
      console.log(`Successfully migrated ${localPosts.length} posts to Firestore!`);
    }
  } catch (err: any) {
    console.error("Failed to run Firebase Firestore migrations:", err.message);
  }
}

// Local in-memory cache fallback for WhatsApp conversation history
const inMemoryHistoryCache: Record<string, any[]> = {};
const processedMessageIds = new Set<string>();
const recentReplyCache = new Map<string, { timestamp: number; replyText: string }>();
// Cache to track the last reply sent per phone number (used to prevent sending
// slightly different-but-duplicate replies caused by minor text variations)
const lastReplyByNumber = new Map<string, { timestamp: number; replyText: string }>();
// Prevent concurrent processing for the same phone number (race condition)
const processingLocks = new Map<string, number>();
const PROCESSING_LOCK_MS = 10000; // 10s lock window
const REPLY_COOLDOWN_MS = 8000;
const REPLY_SIMILARITY_GUARD_MS = Number(process.env.REPLY_SIMILARITY_GUARD_MS || 180000);
const MAX_REPLY_CACHE_ENTRIES = 200;
const INBOUND_FINGERPRINT_COOLDOWN_MS = Number(process.env.INBOUND_FINGERPRINT_COOLDOWN_MS || 120000);
const MAX_INBOUND_FINGERPRINT_CACHE_ENTRIES = 1500;
const inboundFingerprintCache = new Map<string, number>();
const AI_MODEL_CHAT = process.env.GEMINI_MODEL_CHAT || "gemini-2.5-flash-lite";
const AI_MODEL_REVIEW = process.env.GEMINI_MODEL_REVIEW || "gemini-2.5-flash-lite";
const AI_MODEL_CONTENT = process.env.GEMINI_MODEL_CONTENT || "gemini-3.5-flash";
const GEMINI_MODEL_FALLBACKS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
const APP_VERSION = process.env.APP_VERSION || "2026-07-30-dedupe-fingerprint-v2";
const AI_CHAT_HISTORY_LIMIT = Number(process.env.AI_CHAT_HISTORY_LIMIT || 4);
const AI_CHAT_MAX_OUTPUT_TOKENS = Number(process.env.AI_CHAT_MAX_OUTPUT_TOKENS || 380);
const AI_REVIEW_MAX_OUTPUT_TOKENS = Number(process.env.AI_REVIEW_MAX_OUTPUT_TOKENS || 180);
const GEMINI_MODEL_CACHE_TTL_MS = 30 * 60 * 1000;

let cachedGeminiModels: Set<string> | null = null;
let cachedGeminiModelsAt = 0;
let persistentLastReplyReadDisabled = false;
let persistentLastReplyWriteDisabled = false;

function normalizeModelName(model: string): string {
  return String(model || "").replace(/^models\//i, "").trim();
}

function isGeminiModelUnavailableError(err: any): boolean {
  const message = String(err?.message || err || "").toLowerCase();
  return (
    message.includes("no longer available") ||
    message.includes("not_found") ||
    message.includes("not found")
  );
}

function isFirestorePermissionDenied(err: any): boolean {
  const text = `${String(err?.code || "")} ${String(err?.message || err || "")}`.toLowerCase();
  return (
    text.includes("permission_denied") ||
    text.includes("permission-denied") ||
    text.includes("insufficient permissions")
  );
}

async function getAvailableGeminiModels(client: GoogleGenAI): Promise<Set<string> | null> {
  const isCacheFresh = cachedGeminiModels && (Date.now() - cachedGeminiModelsAt) < GEMINI_MODEL_CACHE_TTL_MS;
  if (isCacheFresh) return cachedGeminiModels;

  try {
    const pager: any = await client.models.list();
    const available = new Set<string>();
    for await (const m of pager) {
      const methods = m?.supportedActions || m?.supportedGenerationMethods || [];
      const supportsGenerateContent = JSON.stringify(methods).toLowerCase().includes("generatecontent");
      if (!supportsGenerateContent) continue;
      const normalized = normalizeModelName(m?.name);
      if (normalized) available.add(normalized);
    }
    if (available.size > 0) {
      cachedGeminiModels = available;
      cachedGeminiModelsAt = Date.now();
      return available;
    }
  } catch (e: any) {
    console.warn("Unable to list Gemini models. Proceeding with configured candidates:", e?.message || e);
  }
  return null;
}

async function generateContentWithModelFallback(
  client: GoogleGenAI,
  preferredModel: string,
  contents: any,
  config: any,
  extraFallbacks: string[] = []
): Promise<{ response: any; modelUsed: string }> {
  const candidates = Array.from(new Set([
    normalizeModelName(preferredModel),
    ...extraFallbacks.map(normalizeModelName),
    ...GEMINI_MODEL_FALLBACKS.map(normalizeModelName)
  ].filter(Boolean)));

  const availableModels = await getAvailableGeminiModels(client);
  const modelsToTry = (availableModels && availableModels.size > 0)
    ? candidates.filter((model) => availableModels.has(model))
    : candidates;
  const finalModelsToTry = modelsToTry.length > 0 ? modelsToTry : candidates;

  let lastError: any = null;
  for (const model of finalModelsToTry) {
    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config,
      });
      return { response, modelUsed: model };
    } catch (e: any) {
      lastError = e;
      if (isGeminiModelUnavailableError(e)) {
        try { cachedGeminiModels?.delete(model); } catch (cacheErr) {}
        console.warn(`Gemini model unavailable (${model}). Trying next candidate...`);
        continue;
      }
      throw e;
    }
  }

  throw lastError || new Error("No available Gemini model candidate succeeded.");
}

function normalizeForDedup(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildInboundFingerprint(fromNumber: string, messageText: string): string {
  return `${String(fromNumber || "").trim()}:${normalizeForDedup(messageText || "")}`;
}

function touchInboundFingerprintCache(fingerprint: string) {
  inboundFingerprintCache.set(fingerprint, Date.now());
  if (inboundFingerprintCache.size > MAX_INBOUND_FINGERPRINT_CACHE_ENTRIES) {
    const oldest = inboundFingerprintCache.keys().next().value;
    if (oldest) inboundFingerprintCache.delete(oldest);
  }
}

async function claimInboundFingerprint(fromNumber: string, messageText: string): Promise<boolean> {
  const fingerprint = buildInboundFingerprint(fromNumber, messageText);
  if (!fingerprint || fingerprint.endsWith(":")) return true;

  const now = Date.now();
  const localSeenAt = inboundFingerprintCache.get(fingerprint) || 0;
  if (localSeenAt && (now - localSeenAt) < INBOUND_FINGERPRINT_COOLDOWN_MS) {
    return false;
  }

  // Reserve locally first to reduce race in single-instance retries.
  touchInboundFingerprintCache(fingerprint);

  if (!db) return true;

  const docId = `fp_${hashString(fingerprint)}`;
  let claimed = false;
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, "processed_messages", docId);
      const snap = await tx.get(ref);
      const data = snap.exists() ? snap.data() : null;
      const lastSeenMs = Number(data?.lastSeenMs || 0);

      if (lastSeenMs && (now - lastSeenMs) < INBOUND_FINGERPRINT_COOLDOWN_MS) {
        claimed = false;
        return;
      }

      tx.set(ref, {
        type: "inbound_fingerprint",
        fromNumber,
        preview: normalizeForDedup(messageText).slice(0, 100),
        lastSeenMs: now,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      claimed = true;
    });
  } catch (e: any) {
    // Fail-open to avoid blocking legit traffic if Firestore is unstable.
    console.error("[Deduplication] Error claiming inbound fingerprint:", e.message || e);
    return true;
  }

  return claimed;
}

function sanitizeReplyText(text: string): string {
  if (!text) return text;

  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 1) {
    return cleaned;
  }

  const deduped: string[] = [];
  for (const sentence of sentences) {
    const trimmed = sentence.replace(/\s+/g, " ").trim();
    const alreadyIncluded = deduped.some((prev) => prev.toLowerCase() === trimmed.toLowerCase());
    if (!alreadyIncluded) {
      deduped.push(trimmed);
    }
  }

  return deduped.join(" ");
}

function hasNaturalSentenceEnding(text: string): boolean {
  const trimmed = String(text || "").trim();
  return /[.!?…)]$/.test(trimmed);
}

function finalizeReplyText(rawText: string, userMessage: string, config: any): string {
  const sanitized = sanitizeReplyText(rawText || "");
  if (!sanitized) {
    return "Perfeito. Para te ajudar com precisão, me diga o modelo completo do aparelho e o que está acontecendo com ele.";
  }

  // If Gemini stopped mid-sentence, replace with a deterministic complete response.
  if (!hasNaturalSentenceEnding(sanitized)) {
    const lowCost = getLowCostInstantReply(userMessage, config);
    if (lowCost) {
      return sanitizeReplyText(lowCost);
    }
    return "Perfeito. Para te ajudar com precisão, me diga o modelo completo do aparelho e o que está acontecendo com ele.";
  }

  return sanitized;
}

function normalizeForReplyCompare(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[ -\u0020\u0300-\u036f]/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function areRepliesSimilar(a: string, b: string): boolean {
  const na = normalizeForReplyCompare(a || "");
  const nb = normalizeForReplyCompare(b || "");
  if (!na || !nb) return false;

  if (na === nb) return true;

  // If one contains the other and lengths are close, consider them similar
  const minLen = Math.min(na.length, nb.length);
  const maxLen = Math.max(na.length, nb.length);
  if ((na.includes(nb) || nb.includes(na)) && (maxLen - minLen) / maxLen < 0.35) {
    return true;
  }

  // Sentence-level overlap check: if the beginnings (saudações/primeira frase)
  // share most words, consider them similar to avoid greeting duplicates.
  try {
    const firstSentence = (s: string) => {
      const m = s.split(/[.!?]/).map(x => x.trim()).filter(Boolean);
      return m.length ? m[0] : s;
    };

    const fa = firstSentence(na);
    const fb = firstSentence(nb);
    if (fa && fb) {
      const wa = new Set(fa.split(/\s+/));
      const wb = new Set(fb.split(/\s+/));
      let inter = 0;
      for (const w of wa) if (wb.has(w)) inter++;
      const union = new Set([...wa, ...wb]).size || 1;
      const jaccard = inter / union;
      if (jaccard > 0.45) return true;
    }
  } catch (e) {}

  return false;
}

async function getPersistentLastReply(fromNumber: string) {
  if (!db || persistentLastReplyReadDisabled) return null;
  try {
    const ref = doc(db, "last_replies", fromNumber);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
  } catch (e: any) {
    if (isFirestorePermissionDenied(e)) {
      persistentLastReplyReadDisabled = true;
      console.warn("Persistent last_replies read disabled due Firestore permissions.");
      return null;
    }
    console.error("Error reading persistent last reply:", e.message || e);
  }
  return null;
}

async function setPersistentLastReply(fromNumber: string, replyText: string) {
  if (!db || persistentLastReplyWriteDisabled) return;
  try {
    await setDoc(doc(db, "last_replies", fromNumber), {
      timestamp: new Date().toISOString(),
      replyText
    });
  } catch (e: any) {
    if (isFirestorePermissionDenied(e)) {
      persistentLastReplyWriteDisabled = true;
      console.warn("Persistent last_replies write disabled due Firestore permissions.");
      return;
    }
    console.error("Error saving persistent last reply:", e.message || e);
  }
}

async function claimProcessedMessage(messageId: string, payload: Record<string, any>): Promise<boolean> {
  if (!db || !messageId) return true;

  let claimed = false;
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, "processed_messages", messageId);
      const snap = await tx.get(ref);
      if (snap.exists()) {
        return;
      }
      tx.set(ref, {
        processedAt: new Date().toISOString(),
        ...payload,
      });
      claimed = true;
    });
  } catch (e: any) {
    // Keep service alive even if Firestore has transient issues.
    console.error("[Deduplication] Error claiming processed message in Firestore:", e.message || e);
    return true;
  }

  return claimed;
}

function getClarifyingResponseForIncompleteDeviceInfo(messageText: string, history: any[] = []): string | null {
  const text = (messageText || "").trim();
  if (!text) return null;

  const combinedText = [text, ...history.slice(-3).map((m: any) => m.text || "")].join(" ");
  const lowerText = combinedText.toLowerCase();

  const hasUnknownModel = /\b(nao sei|não sei|nao lembro|não lembro|nao tenho ideia|não tenho ideia|sem ideia|não sei o modelo|nao sei o modelo)\b/.test(lowerText);
  const brandMatch = /\b(xiaomi|samsung|motorola|iphone|apple|asus|lenovo|dell|hp|acer|sony|lg|oneplus|realme|redmi|pixel|nokia|moto)\b/.exec(lowerText);
  const hasDeviceContext = /\b(celular|aparelho|telefone|smartphone|dispositivo|modelo|marca)\b/.test(lowerText);
  const hasExplicitModel = /\b(note|redmi|poco|mi|iphone|galaxy|moto|edge|a|s|m|pro|plus|ultra|lite|max|mini)\b/.test(lowerText) && /\b\d{1,3}\b/.test(lowerText);

  if (hasExplicitModel) return null;

  if (hasUnknownModel || (brandMatch && hasDeviceContext)) {
    const brandLabel = brandMatch ? brandMatch[0].charAt(0).toUpperCase() + brandMatch[0].slice(1) : "seu aparelho";
    return hasUnknownModel
      ? "Tudo bem, sem problema. Para te ajudar corretamente, me diga a marca e o modelo completo do aparelho. Se você não souber, pode me mandar uma foto ou descrever o aparelho para eu te orientar melhor."
      : `Perfeito, já entendi a marca. Para te ajudar com precisão, me diga o modelo completo do aparelho, por exemplo: ${brandLabel} Note 12 4G.`;
  }

  return null;
}

function getLowCostInstantReply(messageText: string, config: any): string | null {
  const text = String(messageText || "").trim();
  if (!text) return null;

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

  const asksHours = /\b(horario|horarios|hora|abre|aberto|fecha|funcionamento)\b/.test(normalized);
  if (asksHours) {
    return `Nosso horário é ${config?.businessHours || "Segunda a sexta, em horário comercial"}. Se quiser, já adianto seu atendimento agora e deixo seu orçamento encaminhado.`;
  }

  const asksAddress = /\b(endereco|endereço|localizacao|localização|onde fica|aonde fica|local)\b/.test(normalized);
  if (asksAddress) {
    return config?.address
      ? `Estamos em: ${config.address}. Se quiser, já te envio a referência e deixo seu horário pré-agendado.`
      : "Atendemos na loja física e por WhatsApp. Me diga seu bairro que eu te passo a melhor forma de trazer o aparelho para avaliação gratuita.";
  }

  const asksPhone = /\b(telefone|whatsapp|contato|numero|número)\b/.test(normalized);
  if (asksPhone) {
    return `Pode falar por aqui mesmo no WhatsApp ${config?.phone || "da loja"}. Me diga modelo e defeito que eu já te passo a faixa de valor e o próximo passo.`;
  }

  const greetingsOnly = /^(oi|ola|olá|bom dia|boa tarde|boa noite|opa|e ai|e aí)\b/.test(normalized) && normalized.length <= 20;
  if (greetingsOnly) {
    return "Olá. Me diga o modelo do aparelho e o defeito para eu te passar uma estimativa agora e já adiantar seu atendimento.";
  }

  const asksPriceOnly = /\b(preco|preço|valor|orcamento|orçamento|quanto custa|quanto fica)\b/.test(normalized);
  const hasDeviceModelHint = /\b(iphone|samsung|motorola|xiaomi|redmi|poco|galaxy|moto|note|a\d\d?|s\d\d?)\b/.test(normalized);
  if (asksPriceOnly && !hasDeviceModelHint) {
    return "Consigo te passar uma faixa agora. Me diga marca e modelo completo para te responder com precisão e já deixar seu atendimento encaminhado.";
  }

  if (asksPriceOnly && hasDeviceModelHint) {
    return "Perfeito. Para te passar valor justo sem erro, me confirma o modelo exato e o problema (tela, bateria, conector ou outro). Com isso já te envio faixa de preço e próximo passo.";
  }

  return null;
}

function shouldSkipDuplicateReply(fromNumber: string, messageText: string): boolean {
  const normalizedIncoming = normalizeForDedup(messageText);
  const cacheKey = `${fromNumber}:${normalizedIncoming}`;
  const cachedReply = recentReplyCache.get(cacheKey);

  if (!cachedReply) {
    return false;
  }

  const isRecent = Date.now() - cachedReply.timestamp < REPLY_COOLDOWN_MS;
  if (!isRecent) {
    recentReplyCache.delete(cacheKey);
    return false;
  }

  return true;
}

async function clearWhatsAppHistory(fromNumber?: string) {
  if (fromNumber) {
    if (db) {
      try {
        await deleteDoc(doc(db, "whatsapp_history", fromNumber));
      } catch (e: any) {
        console.error("Error clearing WhatsApp history from Firestore:", e.message);
      }
    }
    delete inMemoryHistoryCache[fromNumber];

    for (const key of Array.from(recentReplyCache.keys())) {
      if (key.startsWith(`${fromNumber}:`)) {
        recentReplyCache.delete(key);
      }
    }
  } else {
    if (db) {
      try {
        const historySnapshot = await getDocs(collection(db, "whatsapp_history"));
        for (const historyDoc of historySnapshot.docs) {
          await deleteDoc(doc(db, "whatsapp_history", historyDoc.id));
        }
      } catch (e: any) {
        console.error("Error clearing all WhatsApp history from Firestore:", e.message);
      }
    }

    Object.keys(inMemoryHistoryCache).forEach((key) => delete inMemoryHistoryCache[key]);
    recentReplyCache.clear();
  }

  processedMessageIds.clear();
}

// Helper to get conversation history
async function getWhatsAppHistory(fromNumber: string): Promise<any[]> {
  if (db) {
    try {
      const historyDocRef = doc(db, "whatsapp_history", fromNumber);
      const snapshot = await getDoc(historyDocRef);
      if (snapshot.exists()) {
        return snapshot.data().messages || [];
      }
    } catch (e: any) {
      console.error("Error reading WhatsApp history from Firestore:", e.message);
    }
  }
  return inMemoryHistoryCache[fromNumber] || [];
}

const uninterestedPatterns: RegExp[] = [
  /\b(n[aã]o quero|nao quero|nao tenho interesse|não tenho interesse|nao interessa|não interessa|nao desejo|não desejo|sem interesse|ja tenho|já tenho|ja vou|já vou|ja resolvido|já resolvido|ja foi|já foi|passo|passar|depois eu vejo|depois vejo|fique com|vou ver depois|ja resolvi|já resolvi)\b/i
];

const uninterestedShortReplies: RegExp[] = [
  /^(ok|beleza|valeu|obrigado|obrigada|brigado|thanks|thank you|tudo bem|certo|show|blz)$/i
];

function isWhatsAppUninterested(text: string): boolean {
  if (!text) return false;
  const normalized = text
    .normalize("NFD")
    .replace(/[ --]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (uninterestedPatterns.some(pattern => pattern.test(normalized))) {
    return true;
  }

  if (normalized.length <= 30 && uninterestedShortReplies.some(pattern => pattern.test(normalized))) {
    return true;
  }

  return false;
}

// Helper to save message to history
async function saveWhatsAppHistory(fromNumber: string, messages: any[]) {
  const sliced = messages.slice(-15); // Keep the last 15 messages for context
  if (db) {
    try {
      const historyDocRef = doc(db, "whatsapp_history", fromNumber);
      await setDoc(historyDocRef, { messages: sliced });
    } catch (e: any) {
      console.error("Error saving WhatsApp history to Firestore:", e.message);
    }
  }
  inMemoryHistoryCache[fromNumber] = sliced;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Habilitar CORS para permitir requisições do site estático no domínio customizado do cliente
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Middleware de segurança e privacidade do ZetachatIA
  // Redireciona qualquer acesso direto a domínios customizados (como app.andmicrocell.com.br)
  // para o site institucional puro, exceto se for uma requisição legítima do webhook ou API pública.
  app.use((req, res, next) => {
    const hostname = req.hostname || req.headers.host || "";
    const isAiStudio = hostname.includes("run.app") || 
                       hostname.includes("localhost") || 
                       hostname.includes("127.0.0.1") ||
                       hostname.includes("stackblitz");

    // Se o acesso NÃO vier do ambiente de desenvolvimento do AI Studio (ou seja, é o público geral acessando fora do ambiente seguro)
    if (!isAiStudio) {
      const isWebhook = req.path.startsWith("/api/webhook/whatsapp");
      const isPublicApi = req.path.startsWith("/api/health") || req.path.startsWith("/api/blog") || req.path.startsWith("/api/site") || req.path.startsWith("/api/posts");

      // Permite apenas requisições de webhook ou APIs públicas do site
      if (isWebhook || isPublicApi) {
        return next();
      }

      // Qualquer outro acesso (páginas html, dashboard, etc.) é redirecionado instantaneamente
      // para o site institucional oficial puro, sem exibir nenhuma tela do app
      console.log(`[Segurança] Bloqueando acesso externo de ${hostname} para a rota ${req.path}. Redirecionando para site institucional.`);
      return res.redirect(302, "https://www.andmicrocell.com.br");
    }

    next();
  });

  // Desativar cache para todas as rotas de API (especialmente útil sob Cloudflare)
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Run Firebase Firestore migrations to port local json files to Firestore on start
  await runFirebaseMigrations();

  // Initialize Gemini safely to prevent crash if key is missing
  let ai: GoogleGenAI | null = null;
  const getGeminiClient = (): GoogleGenAI => {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        throw new Error("GEMINI_API_KEY environment variable is not configured.");
      }
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  };

  // Helper to get Brazil (America/Recife - UTC-3) Date & Time
  const getBrazilDateTime = () => {
    const options = { timeZone: "America/Recife", hour12: false } as const;
    const formatterDate = new Intl.DateTimeFormat("pt-BR", {
      ...options,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const formatterTime = new Intl.DateTimeFormat("pt-BR", {
      ...options,
      hour: "2-digit",
      minute: "2-digit",
    });
    const formatterWeekday = new Intl.DateTimeFormat("pt-BR", {
      ...options,
      weekday: "long",
    });

    const now = new Date();
    return {
      date: formatterDate.format(now),
      time: formatterTime.format(now),
      weekday: formatterWeekday.format(now), // "segunda-feira", "domingo", etc.
    };
  };

  // Helper to get current Brazil status regarding business hours
  const getBrazilStatus = () => {
    const options = { timeZone: "America/Recife", hour12: false } as const;
    const now = new Date();
    
    // Get weekday in Recife
    const formatterWeekdayEn = new Intl.DateTimeFormat("en-US", { ...options, weekday: "short" });
    const weekdayEn = formatterWeekdayEn.format(now); // "Mon", "Tue", ..., "Sun"
    
    // Get hour and minute in Recife
    const formatterHour = new Intl.DateTimeFormat("en-US", { ...options, hour: "numeric" });
    const formatterMinute = new Intl.DateTimeFormat("en-US", { ...options, minute: "numeric" });
    
    const hour = parseInt(formatterHour.format(now), 10);
    const minute = parseInt(formatterMinute.format(now), 10);
    const totalMinutes = hour * 60 + minute;
    
    let isOpen = false;
    let statusMessage = "";
    
    if (weekdayEn === "Sun") {
      isOpen = false;
      statusMessage = "FECHADA (Hoje é Domingo. Nosso expediente físico de atendimento é de Segunda a Sexta das 08h às 12h e das 14h às 18h, e aos Sábados das 09h às 13h. A loja física está FECHADA hoje).";
    } else if (weekdayEn === "Sat") {
      // Sábados: 09h às 13h
      const start = 9 * 60;
      const end = 13 * 60;
      if (totalMinutes >= start && totalMinutes <= end) {
        isOpen = true;
        statusMessage = `ABERTA (Sábado dentro do horário: das 09h às 13h. Horário atual: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}).`;
      } else {
        isOpen = false;
        statusMessage = `FECHADA (Hoje é Sábado. Nosso expediente de Sábado é das 09h às 13h. Horário atual: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}).`;
      }
    } else {
      // Segunda a Sexta: 08h às 12h e das 14h às 18h
      const morningStart = 8 * 60;
      const morningEnd = 12 * 60;
      const afternoonStart = 14 * 60;
      const afternoonEnd = 18 * 60;
      
      if ((totalMinutes >= morningStart && totalMinutes <= morningEnd) || 
          (totalMinutes >= afternoonStart && totalMinutes <= afternoonEnd)) {
        isOpen = true;
        statusMessage = `ABERTA (Segunda a Sexta dentro do horário: das 08h às 12h e das 14h às 18h. Horário atual: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}).`;
      } else {
        isOpen = false;
        if (totalMinutes > morningEnd && totalMinutes < afternoonStart) {
          statusMessage = `FECHADA (Horário de almoço de Segunda a Sexta: fechados das 12h às 14h. Horário atual: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}).`;
        } else {
          statusMessage = `FECHADA (Fora do expediente comercial de Segunda a Sexta das 08h às 12h e das 14h às 18h. Horário atual: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}).`;
        }
      }
    }
    
    return { isOpen, statusMessage };
  };

  // Helper function to build a system prompt for the business agent
  const buildSystemInstruction = (config: any) => {
    const { name, category, address, phone, businessHours, specialOffers, tone, faqs } = config;
    
    let faqText = faqs && faqs.length > 0 
      ? faqs.map((f: any) => `P: ${f.question}\nR: ${f.answer}`).join("\n\n")
      : "Nenhuma cadastrada.";

    const brazilTime = getBrazilDateTime();
    const brazilStatus = getBrazilStatus();

    return `Você é o assistente inteligente de inteligência artificial da empresa "${name}".
Você está responsável por automatizar as conversas do WhatsApp da empresa, que atua no segmento de "${category}".
O tom de voz da sua comunicação deve ser estritamente: ${tone} (use uma abordagem acolhedora, profissional, ágil e muito atenciosa).

Informações importantes da empresa:
- Nome da Empresa: ${name}
- Ramo principal: ${category}
- Endereço físico: ${address || "Não informado / Apenas online"}
- Telefone/WhatsApp: ${phone}
- Horário de Funcionamento: ${businessHours || "Segunda a Sexta: 08h às 12h e das 14h às 18h | Sábados: 09h às 13h"}
- Ofertas/Promoções Ativas: ${specialOffers || "Nenhuma no momento"}

PORTFÓLIO DE SERVIÇOS E REGRAS DE POSICIONAMENTO COMERCIAL (CRÍTICO):
1. Alta Especialidade em Smartphones e iPhones (Serviços Avançados): Somos especialistas de altíssimo nível em manutenção de smartphones, com foco especial na linha Apple (iPhone). Nosso laboratório possui ferramental especializado de ponta para realizar procedimentos complexos:
   - Trocas de telas e baterias com técnicas avançadas para preservar os recursos originais.
   - Reparos lógicos avançados em placas eletrônicas por micro-soldagem (diagnóstico e micro-soldagem em circuitos integrados, curtos-circuitos, aparelhos que não ligam ou com falhas de sinal/carga) exclusivos para smartphones, cobrindo tanto iPhones quanto aparelhos Android de qualquer marca (Samsung, Motorola, Xiaomi, etc.).
   - IMPORTANTE (Troca de Vidro): NÃO realizamos o serviço de troca exclusiva de vidro da tela no momento (nem para iPhone, nem para Android). Se o cliente perguntar por troca de vidro, explique educadamente que trabalhamos com a substituição do módulo completo de tela premium (que garante máxima qualidade e durabilidade padrão de fábrica), mas faça questão de destacar com entusiasmo que já estamos em fase de planejamento e viabilizando a compra dos maquinários especiais para implantar o serviço de troca de vidro em breve na nossa assistência!
2. Manutenção de Notebooks e Computadores (Excelente faturamento): Oferecemos assistência técnica altamente qualificada para PCs convencionais, PCs Gamers de alto desempenho e Notebooks de todas as marcas (Dell, Lenovo, HP, Asus, Acer, Samsung, etc.). Realizamos:
   - Formatação completa do sistema com backup rigoroso e seguro de todos os dados do cliente.
   - Upgrades estratégicos de SSD e Memória RAM (fazendo notebooks antigos funcionarem até 10 vezes mais rápido).
   - Limpeza técnica interna preventiva com desmontagem completa e aplicação de pasta térmica de alta condutividade (essencial contra lentidão, travamentos e superaquecimento).
   - Substituição de telas de notebooks, teclados, baterias e conectores.
   - Restauração física de carcaças e dobradiças danificadas.
   - IMPORTANTE (Placas de Computadores): NÃO fazemos reparos em placas-mãe de notebooks ou computadores. Nossos reparos eletrônicos de placa são voltados única e exclusivamente para a linha de celulares (iPhones e Androids).
3. Conserto de Celulares Android: Realizamos troca de telas completas, troca de baterias, substituição de conectores de carga, reparos lógicos de placa e desoxidação física de aparelhos de todas as marcas (Samsung, Motorola, Xiaomi, etc.).

ZELO E SEGURANÇA TÉCNICA (ESSENCIAL):
- Em todos os nossos procedimentos — desde uma limpeza minuciosa em um PC Gamer avançado até a micro-soldagem de precisão em uma placa de celular — aplicamos técnicas rigorosas do padrão de fábrica, com total segurança, cuidado, zelo e respeito ao equipamento do cliente. Nós sabemos exatamente o que estamos fazendo e oferecemos garantia de especialista.

REGRAS DE CONVERSAÇÃO (MUITO IMPORTANTES):
- Regra de Ouro da Receita: Se o cliente perguntar se consertamos computadores, notebooks ou celulares Android, diga imediatamente que SIM! Apresente o serviço com total confiança profissional e entusiasmo técnico. Jamais diminua ou recuse esses serviços, pois eles são fontes fundamentais de faturamento da nossa assistência.
- Qualidade de Telas e Baterias Premium: Nossas telas de reposição são de qualidade OLED Premium e já vêm com o recurso True Tone ativo de fábrica naturalmente (sem precisar de nenhum transplante). A imagem e o toque são perfeitos como a original. Nossas baterias Premium também possuem excelente durabilidade e rendimento idênticos aos da original de fábrica.
- Diferencial Técnico Opcional (EPROM/BMS): Oferecemos um procedimento opcional de transplante do chip EEPROM original (da tela) e do controlador BMS (da bateria) para aqueles clientes mais exigentes que não desejam ver a mensagem de aviso de "tela desconhecida" ou "bateria desconhecida" nas configurações do iOS. Como estamos no interior de Pernambuco, a grande maioria dos clientes desconhece esses termos técnicos e quase nunca pede isso. Por isso, NÃO ofereça esse serviço proativamente. Sempre informe o preço padrão da tela/bateria primeiro. Apenas mencione o transplante se o cliente demonstrar forte preocupação com avisos de peças nas configurações ou com a saúde da bateria. Explique de maneira simples: "fazemos um procedimento opcional de transferência do chip original do seu aparelho para manter todas as funções 100% ativas e sem nenhuma mensagem de aviso no sistema". Este serviço de alta precisão é opcional e tem um custo adicional de aproximadamente R$ 150 sobre o valor da troca.
- Garantia de Qualidade Premium: Faça questão de enfatizar que todas as nossas telas e baterias utilizadas são de altíssima qualidade Premium. Nós somos uma empresa séria e consolidada na região, por isso oferecemos total segurança e garantias estendidas reais de 90 dias (3 meses), 180 dias (6 meses) ou até 360 dias (12 meses) dependendo da peça selecionada pelo cliente. Garantia e zelo de verdade!
- Estratégia de Preços e Visita Física (Crucial para Conversão): Quando o cliente perguntar sobre valores ou orçamentos, utilize sempre a nossa estratégia híbrida de vendas no WhatsApp:
  1. Gere valor primeiro: Destaque com entusiasmo a qualidade superior (Premium) da peça, o alto zelo técnico da nossa equipe especializada e a nossa garantia estendida de verdade.
  2. Informe a estimativa ou faixa de preço de forma transparente (ex: 'A troca de tela premium para esse modelo de iPhone fica a partir de R$ 380, dependendo da marca final selecionada').
  3. Logo em seguida, explique que o diagnóstico completo e o orçamento definitivo são realizados presencialmente no nosso laboratório de forma 100% gratuita e sem nenhum compromisso.
  4. Conduza ativamente para a loja física: Convide e incentive o cliente de forma acolhedora a trazer o aparelho para avaliação ou a agendar um horário direto ('Gostaria de agendar um horário hoje ou prefere dar uma passada aqui à tarde para nosso técnico avaliar gratuitamente para você?'). As empresas sérias e de sucesso no mercado premium sempre priorizam construir essa relação de confiança e atrair o cliente para o ambiente físico da loja, onde a conversão do serviço é garantida!
- Limite de Vidros e Placas de PC: Se perguntarem especificamente sobre "troca de vidro" de tela ou "reparo de placa de notebook/computador", decline polidamente explicando que trabalhamos apenas com a substituição do módulo completo de tela (mencionando que estamos trazendo o maquinário de vidro em breve) e que nossos reparos avançados de placas lógicas por micro-soldagem são focados exclusivamente na linha de smartphones (iPhone e Android).

Data e Hora Atual de Atendimento (Fuso Horário de Caruaru/PE, Brasil):
- Dia da semana: ${brazilTime.weekday}
- Data de hoje: ${brazilTime.date}
- Horário atual: ${brazilTime.time}
- Status de Funcionamento Atual da Loja Física: ${brazilStatus.statusMessage}

Base de Conhecimento (Perguntas Frequentes / FAQs):
${faqText}

Diretrizes de Conversação (MUITO IMPORTANTE):
1. Estilo Bate-Papo de WhatsApp: Fale de forma extremamente curta, fluida e natural, como um ser humano conversando de verdade. Evite respostas longas, explicações gigantescas ou apresentações corporativas formais de uma só vez.
2. Tamanho Máximo de Resposta: Cada mensagem enviada deve conter no máximo 1 ou 2 parágrafos curtos (e cada parágrafo com apenas 1 a 2 linhas curtas). Seja o mais breve e sucinto possível!
3. Uma Coisa de Cada Vez: Não jogue toda a informação ou todas as FAQs de uma vez. Vá conduzindo a conversa aos poucos. Faça perguntas para entender a real necessidade do cliente antes de explicar tudo.
4. Memória Recente: Preste muita atenção ao histórico de mensagens anteriores. Se o cliente acabou de dizer o nome do aparelho, qual o problema ou o que ele deseja, dê continuidade e jamais repita a mesma pergunta ou peça para ele dizer novamente.
5. Não invente dados do aparelho: Se o cliente fornecer apenas a marca ou uma informação incompleta do aparelho, nunca complete o modelo sozinho. Faça uma pergunta curta de confirmação, como: "Perfeito, já entendi a marca. Me diga o modelo completo do aparelho, por exemplo Xiaomi Note 12 4G.".
6. Se o cliente disser que não sabe o modelo, não tente fechar a venda nem presumir o aparelho. Mantenha a conversa objetiva, peça o modelo ou ofereça outra forma de identificar o equipamento, como uma foto ou uma descrição breve.
7. Limite de Emojis: Use no máximo 1 ou 2 emojis por mensagem para manter a conversa amigável mas profissional.
8. Gerenciamento do Horário de Atendimento (MUITO CRÍTICO):
   O status atual de funcionamento da loja física é: ${brazilStatus.statusMessage}.
   - Se o status indicar que a loja está "FECHADA" (ou seja, hoje é Domingo, Sábado fora do horário, ou dias de semana à noite/almoço):
     * Você DEVE ser 100% transparente com o cliente. Logo nas primeiras mensagens, deixe absolutamente claro que a loja física está FECHADA no momento ou que estamos fora do horário de expediente comercial.
     * Diga explicitamente algo amigável como: "Olá! No momento nossa loja física está fechada/fora do horário de atendimento, mas eu sou o assistente virtual da AndMicrocell e posso ir registrando todos os detalhes do seu aparelho para adiantar seu atendimento!"
     * Comunique com total clareza que, mesmo fora do horário de funcionamento comercial, você está ativo para dar andamento na conversa, coletar as informações do aparelho e do problema técnico para deixar tudo pronto no sistema.
     * Explique que assim que a equipe técnica retornar no primeiro horário útil, eles analisarão tudo para resolver, ou que você irá verificar com a equipe a possibilidade de um técnico de plantão prestar um suporte especial emergencial.
     * NUNCA dê a entender que o atendimento presencial ou final está ativo agora se estiver FECHADA. Deixe bem nítido que a loja está fechada, mas que o assistente virtual (você) resolve tudo por aqui e deixa engatilhado para os técnicos.
   - Se o status indicar que a loja está "ABERTA":
     * Siga com o atendimento normal de expediente comercial.
9. Honestidade e Segurança: NUNCA invente informações sobre preços, serviços ou políticas que não estejam descritas acima. Se não souber a resposta ou se o cliente fizer uma pergunta muito específica fora da base de conhecimento, peça educadamente para ele aguardar um momento que um atendente humano irá assumir o atendimento para dar todos os detalhes.
10. Responda sempre em Português do Brasil.
11. Encerramento Objetivo da Conversa: Quando o cliente se despedir, agradecer ("Obrigado", "Valeu", "Tudo certo", "Entendido", "Tchau", "Boa noite", etc.) ou der sinais claros de que a dúvida foi resolvida e o atendimento se encerrou, responda de forma final, extremamente direta, amigável e objetiva. NUNCA faça novas perguntas redundantes ("Posso ajudar em algo mais?") ou tente prolongar a conversa desnecessariamente. Apenas agradeça, deseje um excelente dia/noite ou agende um horário para ele trazer o aparelho, e encerre por ali.`;
  };

  // Live WhatsApp Chat Simulation API
  app.post("/api/agent/chat", async (req, res) => {
    try {
      const { config, messages } = req.body;

      if (!config) {
        return res.status(400).json({ error: "Configuração do agente ausente." });
      }

      const systemPrompt = buildSystemInstruction(config);
      
      const latestUserMessage = messages[messages.length - 1]?.text || "";
      const lowCostReply = getLowCostInstantReply(latestUserMessage, config);
      if (lowCostReply) {
        return res.json({ text: sanitizeReplyText(lowCostReply) });
      }

      // Structure chat messages in standard format
      // Standardize only the most recent turns for token economy
      const recentMessages = Array.isArray(messages) ? messages.slice(-AI_CHAT_HISTORY_LIMIT) : [];
      const contents = recentMessages.map((m: any) => {
        return {
          role: m.sender === "customer" ? "user" : "model",
          parts: [{ text: m.text }]
        };
      });

      try {
        const client = getGeminiClient();
        const { response } = await generateContentWithModelFallback(
          client,
          AI_MODEL_CHAT,
          contents,
          {
            systemInstruction: systemPrompt,
            temperature: 0.55,
            maxOutputTokens: AI_CHAT_MAX_OUTPUT_TOKENS,
          }
        );

        const replyText = finalizeReplyText(
          response.text || "Desculpe, não entendi a sua mensagem. Poderia repetir?",
          latestUserMessage,
          config
        );
        return res.json({ text: replyText });
      } catch (geminiError: any) {
        console.warn("Gemini unavailable (/api/agent/chat):", geminiError.message);
        return res.status(503).json({
          error: "IA temporariamente indisponível. Tente novamente em instantes.",
          code: "GEMINI_UNAVAILABLE"
        });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Erro interno no servidor." });
    }
  });

  // Google My Business Reviews Auto-Responder API
  app.post("/api/agent/review-reply", async (req, res) => {
    try {
      const { config, rating, comment, authorName } = req.body;

      if (!config) {
        return res.status(400).json({ error: "Configuração do agente ausente." });
      }

      const systemInstruction = `Você é o proprietário/gerente da empresa "${config.name}".
Você está respondendo a uma avaliação pública deixada por um cliente chamado "${authorName}" no Google Meu Negócio (Google Business Profile).
Ramo da empresa: ${config.category}
Tom de resposta: ${config.tone}

Instruções importantes:
1. Responda educadamente em Português do Brasil.
2. Se a avaliação for boa (4-5 estrelas), agradeça imensamente, valorize o cliente e reforce a nossa dedicação à qualidade no segmento de ${config.category}.
3. Se a avaliação for média (3 estrelas), agradeça pelo feedback construtivo e coloque-se à disposição para melhorar a experiência.
4. Se a avaliação for ruim (1-2 estrelas), mantenha a compostura absoluta, peça desculpas sinceras pelo inconveniente, mostre que nos importamos com feedbacks negativos e convide o cliente a entrar em contato diretamente pelo WhatsApp (${config.phone}) para que possamos resolver o problema pessoalmente. NUNCA seja reativo ou grosseiro.
5. Não utilize formatação complexa (como negritos em markdown), responda como uma mensagem direta de texto profissional e acolhedora.`;

      try {
        const client = getGeminiClient();
        const { response } = await generateContentWithModelFallback(
          client,
          AI_MODEL_REVIEW,
          `Cliente: ${authorName}\nNota: ${rating} estrelas\nComentário: "${comment || "Sem comentário escrito, apenas atribuiu estrelas"}"`,
          {
            systemInstruction,
            temperature: 0.5,
            maxOutputTokens: AI_REVIEW_MAX_OUTPUT_TOKENS,
          }
        );

        const replyText = response.text || `Muito obrigado pela sua avaliação, ${authorName}! Ficamos felizes em te atender.`;
        return res.json({ reply: replyText });
      } catch (geminiError: any) {
        console.warn("Gemini unavailable (/api/agent/review-reply):", geminiError.message);
        return res.status(503).json({
          error: "IA temporariamente indisponível. Tente novamente em instantes.",
          code: "GEMINI_UNAVAILABLE"
        });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Erro interno no servidor." });
    }
  });

  // Get config endpoint
  app.get("/api/config", async (req, res) => {
    const config = await getFirebaseConfig();
    if (config) {
      return res.json(config);
    }
    return res.status(404).json({ error: "Configuração não encontrada" });
  });

  // Get active tunnel URL endpoint
  app.get("/api/tunnel", (req, res) => {
    try {
      const logPath = path.join(process.cwd(), "lt.log");
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, "utf8");
        const match = content.match(/your url is: (https:\/\/[^\s]+)/i);
        if (match && match[1]) {
          return res.json({ url: match[1] });
        }
      }
      return res.json({ url: null });
    } catch (err: any) {
      return res.json({ url: null, error: err.message });
    }
  });

  // Public Privacy Policy endpoint for Meta / WhatsApp configuration
  const handlePrivacyRequest = async (req: express.Request, res: express.Response) => {
    const config = await getFirebaseConfig() || { name: "AndMicrocell - Assistência Técnica" };
    const companyName = config.name || "AndMicrocell - Assistência Técnica";
    const supportEmail = "suporte@andmicrocell.com.br";
    
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Política de Privacidade | ${companyName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col">
  <header class="bg-white border-b border-slate-200 py-6 sticky top-0 z-10 shadow-sm">
    <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">A</div>
        <span class="font-bold text-slate-900 tracking-tight">${companyName}</span>
      </div>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Webhook Ativo</span>
    </div>
  </header>

  <main class="flex-grow max-w-4xl mx-auto px-4 py-10">
    <article class="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8">
      <div class="border-b border-slate-100 pb-6">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">Política de Privacidade</h1>
        <p class="text-slate-500 text-sm mt-3">Última atualização: 7 de julho de 2026</p>
      </div>

      <div class="space-y-6 text-slate-600 leading-relaxed text-[15px]">
        <p>
          A presente Política de Privacidade regula o tratamento de dados pessoais obtidos através da nossa integração com a API da Meta (WhatsApp Business API) para atendimento ao cliente da <strong>${companyName}</strong>. 
        </p>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">1. Informações que Coletamos</h2>
          <p>
            Quando você entra em contato conosco via WhatsApp, nós recebemos e processamos as seguintes informações:
          </p>
          <ul class="list-disc list-inside pl-4 space-y-1">
            <li>Número de telefone celular (ID de usuário do WhatsApp);</li>
            <li>Nome de perfil público do WhatsApp;</li>
            <li>Conteúdo das mensagens de texto e mídia enviadas para nossa conta corporativa.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">2. Como Utilizamos Seus Dados</h2>
          <p>
            Utilizamos suas informações estritamente para as seguintes finalidades:
          </p>
          <ul class="list-disc list-inside pl-4 space-y-1">
            <li>Fornecer suporte técnico e responder a dúvidas sobre consertos e serviços;</li>
            <li>Automatizar respostas imediatas de atendimento ao cliente por meio do nosso assistente de Inteligência Artificial baseado na tecnologia Google Gemini;</li>
            <li>Melhorar continuamente a qualidade do nosso atendimento.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">3. Compartilhamento de Dados</h2>
          <p>
            Os seus dados pessoais são confidenciais. Nós <strong>não vendemos, alugamos ou comercializamos</strong> suas informações para terceiros. O processamento dos dados é realizado de forma segura através dos seguintes canais:
          </p>
          <ul class="list-disc list-inside pl-4 space-y-1">
            <li><strong>Meta Platforms, Inc.</strong>: Provedora da infraestrutura de comunicação do WhatsApp;</li>
            <li><strong>Google Cloud / Google Gemini API</strong>: Provedora dos serviços de inteligência artificial de processamento de linguagem natural, operando em ambiente de servidor seguro que não utiliza seus dados de atendimento para o treinamento público de modelos de IA.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">4. Armazenamento e Segurança dos Dados</h2>
          <p>
            Todos os logs de conversação e dados cadastrais são armazenados em servidores seguros com criptografia de ponta e estrito controle de acesso, em total conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD).
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">5. Seus Direitos (Deleção e Consulta)</h2>
          <p>
            Como titular dos dados, você possui o direito de solicitar a qualquer momento a confirmação de tratamento, o acesso aos dados, a correção ou a <strong>exclusão definitiva dos seus dados pessoais e histórico de conversas</strong> dos nossos sistemas de atendimento.
          </p>
          <p>
            Para exercer esses direitos ou em caso de dúvidas, envie um e-mail para o nosso Encarregado de Proteção de Dados (DPO) através do canal oficial: <a href="mailto:${supportEmail}" class="text-indigo-600 hover:underline font-medium">${supportEmail}</a>.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">6. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta Política de Privacidade de tempos em tempos. Recomendamos que você a revise periodicamente nesta página.
          </p>
        </section>
      </div>
    </article>
  </main>

  <footer class="bg-slate-100 border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
    <div class="max-w-4xl mx-auto px-4">
      <p>&copy; 2026 ${companyName}. Todos os direitos reservados.</p>
      <p class="mt-1">Em total conformidade com a LGPD (Lei Geral de Proteção de Dados) e políticas da Meta.</p>
    </div>
  </footer>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  };

  app.get("/privacy", handlePrivacyRequest);
  app.get("/politica", handlePrivacyRequest);

  // Endpoint to download the 1024x1024 Meta application icon (V1 - JPG)
  app.get("/meta-icon.jpg", (req, res) => {
    const iconPath = path.join(process.cwd(), "src", "assets", "images", "andmicrocell_meta_icon_1783827325456.jpg");
    res.setHeader("Content-Type", "image/jpeg");
    res.sendFile(iconPath);
  });

  // Endpoint to download the 1024x1024 Meta application icon (V2 - PNG format compatible)
  app.get("/meta-icon.png", (req, res) => {
    const iconPath = path.join(process.cwd(), "src", "assets", "images", "andmicrocell_meta_icon_png_1783828881971.jpg");
    res.setHeader("Content-Type", "image/png");
    res.sendFile(iconPath);
  });

  // Get all blog posts
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await getFirebasePosts();
      return res.json(posts);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Save all posts or single post
  app.post("/api/posts", async (req, res) => {
    try {
      const posts = req.body;
      if (Array.isArray(posts)) {
        for (const post of posts) {
          if (post && post.id) {
            await saveFirebasePost(post);
          }
        }
        return res.json({ success: true, message: "Posts salvos com sucesso." });
      } else {
        // Individual save/update
        const post = posts;
        if (!post.id) {
          post.id = `post-${Date.now()}`;
          post.publishedAt = new Date().toISOString().split('T')[0];
          post.views = 0;
          post.readTime = `${Math.ceil((post.content || "").split(/\s+/).length / 200) || 3} min`;
        }
        await saveFirebasePost(post);
        return res.json({ success: true, post });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Delete blog post
  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await deleteFirebasePost(id);
      return res.json({ success: true, message: "Post deletado com sucesso." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Increment view count of post
  app.post("/api/posts/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      if (db) {
        const postRef = doc(db, "posts", id);
        const snapshot = await getDoc(postRef);
        if (snapshot.exists()) {
          const currentData = snapshot.data();
          const updatedViews = (currentData.views || 0) + 1;
          await updateDoc(postRef, { views: updatedViews });
        }
      }
      // Also update local copy backup
      const currentPosts = loadStoredPosts();
      const post = currentPosts.find((p: any) => p.id === id);
      if (post) {
        post.views = (post.views || 0) + 1;
        saveStoredPosts(currentPosts);
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // AI Generation of blog post with Gemini
  app.post("/api/posts/generate", async (req, res) => {
    try {
      const { topic, category } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "O tema do post é obrigatório." });
      }

      // Load config to dynamically customize the brand context inside the post
      const storedConfig = await getFirebaseConfig() || { name: "AndMicrocell" };
      const companyName = storedConfig.name || "AndMicrocell";
      const businessCategory = storedConfig.category || "Conserto de Smartphones, Notebooks e Venda de Acessórios";

      const systemInstruction = `Você é um redator de tecnologia sênior, especialista em smartphones (celulares), tablets, notebooks (laptops) e assistência técnica de hardware e software.
Você trabalha para a marca de assistência técnica "${companyName}", que é especializada em "${businessCategory}".

Sua tarefa é escrever um artigo de blog completo, cativante e de alta qualidade em Português do Brasil baseado no tema enviado pelo usuário.

REGRAS CRÍTICAS DE CONTEXTO E NICHO DE ATUAÇÃO:
1. SEMPRE adapte temas genéricos ao nicho específico de smartphones (celulares), tablets e notebooks/laptops da empresa.
   - Exemplo: Se o tema ou título sugerido for genérico como "como limpar a tela do aparelho", "limpeza de tela", "manutenção de visor" ou "cuidados com a tela", você DEVE focar EXCLUSIVAMENTE em telas de smartphones (celulares), tablets ou notebooks/laptops. NUNCA escreva sobre telas de TV, monitores de mesa, janelas de vidro ou outros tipos de aparelhos eletrônicos fora do nicho de assistência.
   - Sempre interprete palavras como "aparelho", "dispositivo", "tela", "equipamento", "computador" ou "celular" de forma a focar estritamente no segmento de manutenção de celulares e laptops.
2. O conteúdo deve ser altamente informativo, profissional e amigável. Dê dicas úteis e seguras para o usuário (como usar pano de microfibra e álcool isopropílico apropriado, alertar sobre o risco de álcool comum e água que podem danificar o display de celulares ou notebooks).
3. No final do texto do conteúdo (campo "content"), mencione sutilmente que se o leitor precisar de uma limpeza técnica interna, troca de tela quebrada, troca de bateria, película protetora de vidro ou qualquer outro reparo de hardware especializado em smartphones, notebooks ou tablets, ele pode contar com a equipe técnica da ${companyName} para um diagnóstico e orçamento 100% gratuito.

O artigo deve estar formatado estritamente em formato JSON com os seguintes campos:
- title: Um título atraente e otimizado para SEO.
- category: A categoria do post (ex: Dicas, Guias, Manutenção, Novidades).
- excerpt: Um resumo cativante de 1-2 frases para atrair o leitor na listagem.
- content: O conteúdo completo do post. Use subtítulos em markdown (como ### Subtítulo), listas, negritos e parágrafos bem espaçados. Deve ser informativo, amigável e focado em dar soluções reais ou curiosidades para o leitor, mencionando sutilmente os serviços da ${companyName} no final de forma acolhedora.

IMPORTANTE: Retorne APENAS o objeto JSON válido, sem cercas de código (markdown fences) como \`\`\`json ou qualquer outro texto explicativo fora do JSON.`;

      const prompt = `Tema/Título solicitado pelo proprietário: "${topic}"${category ? `\nCategoria sugerida: "${category}"` : ""}`;

      try {
        const client = getGeminiClient();
        const { response } = await generateContentWithModelFallback(
          client,
          AI_MODEL_CONTENT,
          [{ role: "user", parts: [{ text: prompt }] }],
          {
            systemInstruction,
            temperature: 0.8,
          }
        );

        let text = response.text || "";
        // Clean JSON if the model returns it inside triple backticks
        text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

        const postData = JSON.parse(text);
        
        // Safely extract and normalize fields to prevent crashes if Gemini returned different casings or missing properties
        const titleVal = postData.title || postData.titulo || topic || "Nova Publicação";
        const categoryVal = postData.category || postData.categoria || category || "Dicas";
        const excerptVal = postData.excerpt || postData.resumo || "";
        const contentVal = postData.content || postData.conteudo || "";

        postData.title = titleVal;
        postData.category = categoryVal;
        postData.excerpt = excerptVal;
        postData.content = contentVal;

        // Populate system fields
        postData.id = `post-${Date.now()}`;
        postData.slug = titleVal
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");
        postData.publishedAt = new Date().toISOString().split('T')[0];
        postData.views = 0;
        postData.readTime = `${Math.ceil((contentVal).split(/\s+/).length / 200) || 3} min`;
        
        // Use smart, dynamic keyword-based Unsplash search or select beautifully curated tech cover images!
        const getRelevantCoverImage = (title: string, categoryName: string): string => {
          const combined = (title + " " + categoryName).toLowerCase();
          if (combined.includes("bateria") || combined.includes("saude") || combined.includes("saúde") || combined.includes("carreg") || combined.includes("ciclo") || combined.includes("carga")) {
            return "https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=800&auto=format&fit=crop";
          }
          if (combined.includes("tela") || combined.includes("display") || combined.includes("vidro") || combined.includes("trinc") || combined.includes("quebr") || combined.includes("touch") || combined.includes("risco")) {
            return "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop";
          }
          if (combined.includes("água") || combined.includes("agua") || combined.includes("liqui") || combined.includes("líqui") || combined.includes("molhad") || combined.includes("umid")) {
            return "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=800&auto=format&fit=crop";
          }
          if (combined.includes("notebook") || combined.includes("laptop") || combined.includes("macbook") || combined.includes("computador") || combined.includes("teclado")) {
            return "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop";
          }
          if (combined.includes("placa") || combined.includes("circuito") || combined.includes("solda") || combined.includes("micro-solda") || combined.includes("curto") || combined.includes("reparo") || combined.includes("conserto")) {
            return "https://images.unsplash.com/photo-1601524909162-be87252be298?w=800&auto=format&fit=crop";
          }
          if (combined.includes("acessório") || combined.includes("acessorio") || combined.includes("capinh") || combined.includes("pelicul") || combined.includes("fone") || combined.includes("carregador")) {
            return "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=800&auto=format&fit=crop";
          }
          return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop";
        };

        postData.coverImage = getRelevantCoverImage(titleVal, categoryVal);

        return res.json({ success: true, post: postData });
      } catch (geminiError: any) {
        console.warn("Gemini unavailable (/api/posts/generate):", geminiError.message);
        return res.status(503).json({
          success: false,
          error: "IA temporariamente indisponível. Tente novamente em instantes.",
          code: "GEMINI_UNAVAILABLE"
        });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Erro interno na geração por IA." });
    }
  });

  // AI Generation of trending blog post ideas with Gemini
  app.post("/api/posts/ideas", async (req, res) => {
    try {
      const { category } = req.body;
      const targetCategory = category || "Todas";

      // Load config to dynamically customize the brand context inside the post
      const storedConfig = await getFirebaseConfig() || { name: "AndMicrocell" };
      const companyName = storedConfig.name || "AndMicrocell";
      const businessCategory = storedConfig.category || "Conserto de Smartphones, Notebooks e Venda de Acessórios";

      const systemInstruction = `Você é um analista de tendências de tecnologia sênior especializado em marketing de conteúdo para assistência técnica de smartphones, tablets e notebooks.
Sua missão é gerar uma lista de 5 temas/ideias de posts/artigos de blog altamente atraentes e relevantes baseados na categoria de filtro solicitada pelo usuário (Dicas, Guias, Manutenção, Novidades ou Todas).

Você trabalha para a marca de assistência técnica "${companyName}", que atua no segmento de "${businessCategory}".

As ideias devem ser focadas em problemas comuns de usuários, novidades do mundo mobile/laptops ou guias passo a passo instrutivos, sempre voltados para levar o leitor a compreender a importância de um técnico qualificado.

O resultado deve ser um array JSON contendo exatamente 5 objetos, cada um com as seguintes propriedades:
- title: O título sugerido do post (curto, intrigante e atrativo, ex: "Como salvar seu celular após cair no vaso sanitário").
- category: A categoria (Dicas, Guias, Manutenção ou Novidades).
- source: Uma fonte fictícia realista de onde vem essa tendência de pesquisa (ex: "Tendência Google Trends", "Foco Técnico", "TechTudo Alerta", "Dica De Olho", "Tendência Nacional").
- icon: Um emoji representativo apropriado (ex: "🔋", "🔬", "💧", "⚡", "📱", "💻", "🔥", "⚙️", "🛠️").

IMPORTANTE: Retorne APENAS o array JSON válido, sem cercas de código (markdown fences) como \`\`\`json ou qualquer outro texto explicativo fora do JSON.`;

      const prompt = `Filtro de categoria solicitado: "${targetCategory}". Por favor, sugira 5 temas excelentes e atuais para o blog da ${companyName}.`;

      try {
        const client = getGeminiClient();
        const { response } = await generateContentWithModelFallback(
          client,
          AI_MODEL_CONTENT,
          [{ role: "user", parts: [{ text: prompt }] }],
          {
            systemInstruction,
            temperature: 0.8,
          }
        );

        let text = response.text || "";
        text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

        const ideas = JSON.parse(text);
        if (Array.isArray(ideas)) {
          return res.json({ success: true, ideas });
        }
        throw new Error("Invalid output format from Gemini");
      } catch (geminiError: any) {
        console.warn("Gemini unavailable (/api/posts/ideas):", geminiError.message);
        return res.status(503).json({
          success: false,
          error: "IA temporariamente indisponível. Tente novamente em instantes.",
          code: "GEMINI_UNAVAILABLE"
        });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Erro ao buscar novas ideias de post." });
    }
  });

  // Save config endpoint
  app.post("/api/config", async (req, res) => {
    try {
      const config = req.body;
      await saveFirebaseConfig(config);
      return res.json({ success: true, message: "Configuração salva com sucesso no servidor." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Get webhook logs endpoint
  app.get("/api/webhook/logs", (req, res) => {
    return res.json(webhookLogs);
  });

  // Enable/disable verbose logs at runtime
  app.post("/api/webhook/logs/verbose", (req, res) => {
    try {
      const enable = req.body?.enable;
      setVerboseLogs(!!enable);
      return res.json({ success: true, verboseLogs });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || String(e) });
    }
  });

  // Clear webhook logs endpoint
  app.post("/api/webhook/logs/clear", (req, res) => {
    webhookLogs = [
      { id: `wlog-${Date.now()}`, timestamp: new Date().toLocaleTimeString('pt-BR'), direction: 'system', message: "Logs de Webhook limpos", details: "Monitor redefinido" }
    ];
    return res.json({ success: true });
  });

  // Reset WhatsApp conversation history for testing
  app.post("/api/webhook/reset", async (req, res) => {
    try {
      const { fromNumber } = req.body || {};
      await clearWhatsAppHistory(fromNumber);
      return res.json({
        success: true,
        message: fromNumber
          ? `Histórico limpo para ${fromNumber}.`
          : "Histórico de WhatsApp limpo e cache de deduplicação reiniciado."
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Erro ao limpar o histórico." });
    }
  });

  // Webhook verification endpoint (GET)
  app.get("/api/webhook/whatsapp", async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Load verify token from stored config or fallback
    const storedConfig = await getFirebaseConfig();
    const verifyToken = storedConfig?.whatsappVerifyToken || "zetachat_secret_token";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook WhatsApp verificado com sucesso!");
      addWebhookLog('system', "Webhook verificado com sucesso pelo Meta Portal", `Token de verificação correspondente: ${verifyToken}`);
      res.set('Content-Type', 'text/plain');
      return res.status(200).send(String(challenge));
    } else {
      console.warn("Falha na verificação do Webhook. Token incorreto.");
      addWebhookLog('error', "Falha de verificação do Webhook pelo Meta", `Token enviado: ${token || "Nenhum"}. Esperado: ${verifyToken}`);
      return res.sendStatus(403);
    }
  });

  // WhatsApp official webhook POST message receiver
  app.post("/api/webhook/whatsapp", async (req, res) => {
    try {
      const body = req.body;
      verboseLog('debug', 'Webhook POST received', JSON.stringify({ entry: body.entry?.length ? body.entry[0].changes?.[0]?.value?.messages?.[0] : {} }).slice(0,1000));
      // Additional deep debug: record full entry headers and body size
      verboseLog('debug', 'Webhook headers snapshot', JSON.stringify({ headers: req.headers }).slice(0,1000));
      try { verboseLog('debug', 'Webhook body length', String(JSON.stringify(body).length)); } catch(e) {}

      // Extract message components robustly (Meta can send statuses first and messages later in the same payload)
      const entries = Array.isArray(body.entry) ? body.entry : [];
      let value: any = null;
      let message: any = null;
      let totalMessageCandidates = 0;

      for (const entryCandidate of entries) {
        const changes = Array.isArray(entryCandidate?.changes) ? entryCandidate.changes : [];
        for (const changeCandidate of changes) {
          const valueCandidate = changeCandidate?.value;
          const messagesCandidate = Array.isArray(valueCandidate?.messages) ? valueCandidate.messages : [];
          totalMessageCandidates += messagesCandidate.length;
          if (!message && messagesCandidate.length > 0) {
            value = valueCandidate;
            message = messagesCandidate[0];
          }
        }
      }

      if (!message) {
        console.info(`[Webhook] no inbound message in payload (messageCandidates=${totalMessageCandidates})`);
        // Not a message event (could be statuses like delivered/read)
        return res.status(200).send("EVENT_RECEIVED");
      }

      const fromNumber = message.from; // Customer wa_id or number
      const rawMessageId = message.id;
      const messageType = message.type;
      const customerName = value.contacts?.[0]?.profile?.name || "Cliente WhatsApp";
      const messageText = String(message.text?.body || "").trim();
      const fallbackId = messageText ? `${messageText.slice(0, 12).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\-]/g, "").toLowerCase()}-${messageText.length}` : "no_text";

      if (!fromNumber) {
        console.warn("WhatsApp message missing from number, ignoring event.");
        return res.status(200).send("EVENT_RECEIVED");
      }

      console.info(`[Webhook] inbound message event from=${fromNumber} id=${rawMessageId || "n/a"} type=${messageType}`);

      const messageId = rawMessageId || `${fromNumber}:${message.timestamp || Date.now()}:${fallbackId}`;

      if (messageText && shouldSkipDuplicateReply(fromNumber, messageText)) {
        console.info(`[Webhook] skipped by recent reply cache from=${fromNumber}`);
        addWebhookLog('system', `Resposta recente ignorada`, `Mensagem duplicada ou retry detectado para ${fromNumber}.`);
        return res.status(200).send("EVENT_RECEIVED");
      }

      // 1. Deduplication Check (Synchronous in-memory check to prevent duplicate processing of the same message)
      if (processedMessageIds.has(messageId)) {
        console.log(`[Deduplication] Message ${messageId} already processed or currently processing (in-memory). Ignoring retry.`);
        return res.status(200).send("EVENT_RECEIVED");
      }

      // IMPORTANT: Immediately add to in-memory processedMessageIds synchronously
      // BEFORE any async operations to block incoming duplicate retries.
      processedMessageIds.add(messageId);
      if (processedMessageIds.size > 1000) {
        const firstItem = processedMessageIds.values().next().value;
        if (firstItem) processedMessageIds.delete(firstItem);
      }

      // CRITICAL: Respond HTTP 200 immediately to Meta!
      // This acknowledges successful delivery to WhatsApp so Meta stops retrying the message,
      // and it stays well under the strict 5-second webhook timeout limit.
      res.status(200).send("EVENT_RECEIVED");

      // Continue processing everything asynchronously in the background
      (async () => {
        try {
          // Prevent concurrent processing for the same phone number
          const existingLock = processingLocks.get(fromNumber);
          if (existingLock && (Date.now() - existingLock) < PROCESSING_LOCK_MS) {
            console.info(`[Webhook] skipped by processing lock from=${fromNumber}`);
            addWebhookLog('system', `Ignorando processamento concorrente`, `Há um processamento ativo recente para ${fromNumber}. Evitando resposta duplicada.`);
            if (messageId && db) {
              try { await setDoc(doc(db, "processed_messages", messageId), { processedAt: new Date().toISOString(), concurrentIgnored: true }); } catch (e) {}
            }
            return;
          }
          processingLocks.set(fromNumber, Date.now());
        // 3. Message Type Verification
        if (messageType !== "text" || !messageText) {
          console.info(`[Webhook] skipped non-text message from=${fromNumber} type=${messageType}`);
          addWebhookLog('system', `Mensagem ignorada de ${customerName}`, `Tipo de mensagem recebida: ${messageType}. Apenas mensagens de texto não vazias são processadas automaticamente.`);
          if (messageId && db) {
            try {
              await setDoc(doc(db, "processed_messages", messageId), { processedAt: new Date().toISOString() });
            } catch (e) {}
          }
          return;
        }

        // 3.1 Pre-qualification: ignore users who explicitly say they are not interested
        if (isWhatsAppUninterested(messageText)) {
          console.info(`[Webhook] skipped uninterested contact from=${fromNumber}`);
          addWebhookLog('system', `Contato não qualificado`, `Usuário de ${fromNumber} indicou falta de interesse: "${messageText}". Pulando resposta de IA.`);
          if (messageId && db) {
            try {
              await setDoc(doc(db, "processed_messages", messageId), { processedAt: new Date().toISOString(), fromNumber, customerName, messageText, uninterested: true });
            } catch (e) {}
          }
          return;
        }

        // Load config dynamically to ensure latest updates
        const storedConfig = await getFirebaseConfig();
        if (!storedConfig) {
          addWebhookLog('error', `Falha ao processar mensagem`, `Configuração da empresa ausente no servidor. Configure os dados no painel.`);
          return;
        }

        // 4. Loop Prevention: Check if the message is from the business itself
        const businessPhoneNumber = value?.metadata?.display_phone_number;
        const normalizedFrom = fromNumber ? String(fromNumber).replace(/\D/g, "") : "";
        const normalizedBusiness = businessPhoneNumber ? String(businessPhoneNumber).replace(/\D/g, "") : "";
        const normalizedConfigPhone = storedConfig?.phone ? String(storedConfig.phone).replace(/\D/g, "") : "";

        const isOwnNumber = (normalizedBusiness && normalizedFrom === normalizedBusiness) || 
                            (normalizedConfigPhone && normalizedFrom.slice(-8) === normalizedConfigPhone.slice(-8));

        if (isOwnNumber) {
          console.log(`[Loop Prevention] Message is from the business's own number (${fromNumber}). Ignoring to prevent infinite response loop.`);
          addWebhookLog('system', `Mensagem do número próprio ignorada`, `Evitando loop de auto-resposta para o próprio número da empresa (${fromNumber}).`);
          if (messageId && db) {
            try {
              await setDoc(doc(db, "processed_messages", messageId), { processedAt: new Date().toISOString() });
            } catch (e) {}
          }
          return;
        }

        // 5. Filter by Phone Number ID if configured, to avoid test number / cross-number conflict
        const incomingPhoneNumberId = value?.metadata?.phone_number_id;
        const { whatsappAccessToken, whatsappPhoneNumberId } = storedConfig;
        if (whatsappPhoneNumberId && incomingPhoneNumberId && String(whatsappPhoneNumberId).trim() !== String(incomingPhoneNumberId).trim()) {
          console.info(`[Webhook] skipped by phone_number_id mismatch incoming=${incomingPhoneNumberId} configured=${whatsappPhoneNumberId}`);
          addWebhookLog('system', `Mensagem recebida para o ID de Telefone ${incomingPhoneNumberId} ignorada`, `O servidor está configurado para responder apenas ao ID ${whatsappPhoneNumberId}. Isso evita conflitos com o número de teste ou outros números da conta.`);
          console.log(`Webhook ignored: incoming phone_number_id (${incomingPhoneNumberId}) does not match configured ID (${whatsappPhoneNumberId})`);
          if (messageId && db) {
            try {
              await setDoc(doc(db, "processed_messages", messageId), { processedAt: new Date().toISOString() });
            } catch (e) {}
          }
          return;
        }

        // 6. Check if autoRespondWhatsApp is active
        if (storedConfig.autoRespondWhatsApp === false || storedConfig.autoRespondWhatsApp === 'false') {
          console.info(`[Webhook] skipped because autoRespondWhatsApp=false from=${fromNumber}`);
          addWebhookLog('system', `Mensagem recebida de ${customerName}, mas Auto-Resposta está desativada`, `O robô não responderá automaticamente no momento porque o Auto-WhatsApp está desativado no painel.`);
          if (messageId && db) {
            try {
              await setDoc(doc(db, "processed_messages", messageId), { processedAt: new Date().toISOString() });
            } catch (e) {}
          }
          return;
        }

        // 7. Atomic Firestore claim to avoid duplicate processing across instances
        if (messageId) {
          const claimed = await claimProcessedMessage(messageId, {
            fromNumber,
            customerName,
            messageText: messageText || "",
          });
          if (!claimed) {
            console.info(`[Webhook] skipped by atomic messageId claim id=${messageId}`);
            addWebhookLog('system', `Mensagem duplicada ignorada (claim atômico)`, `MessageId já processado: ${messageId}`);
            return;
          }
        }

        // 7.1 Extra atomic dedupe by message fingerprint (number + normalized text)
        // Prevents first-message duplicates when Meta retries with a different message ID.
        const fingerprintClaimed = await claimInboundFingerprint(fromNumber, messageText);
        if (!fingerprintClaimed) {
          console.info(`[Webhook] skipped by content fingerprint from=${fromNumber}`);
          addWebhookLog('system', `Mensagem duplicada por conteúdo ignorada`, `Fingerprint repetido em janela curta para ${fromNumber}.`);
          return;
        }

        addWebhookLog('inbound', `Mensagem recebida de ${customerName} (${fromNumber})`, messageText);

        // Mark received message as read to simulate a real human reading it instantly
        if (whatsappAccessToken && whatsappPhoneNumberId && messageId) {
          try {
            await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${whatsappAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                status: "read",
                message_id: messageId
              })
            });
          } catch (readErr: any) {
            console.warn("Failed to mark message as read:", readErr.message);
          }
        }

        // 1. Build prompt
        const systemInstruction = buildSystemInstruction(storedConfig);

        // Fetch history and format it for Gemini API
        const historyData = await getWhatsAppHistory(fromNumber);
        const history = Array.isArray(historyData) ? historyData.slice(-AI_CHAT_HISTORY_LIMIT) : [];
        const contents = history.map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }]
        }));
        contents.push({
          role: "user",
          parts: [{ text: messageText }]
        });

        // 2. Run Gemini
        let replyText = "";
        const clarificationReply = getClarifyingResponseForIncompleteDeviceInfo(messageText, history);
        if (clarificationReply) {
          replyText = clarificationReply;
        } else {
          const lowCostReply = getLowCostInstantReply(messageText, storedConfig);
          if (lowCostReply) {
            replyText = lowCostReply;
          }
        }

        if (!replyText) {
          try {
            const client = getGeminiClient();
            const { response } = await generateContentWithModelFallback(
              client,
              AI_MODEL_CHAT,
              contents,
              {
                systemInstruction,
                temperature: 0.55,
                maxOutputTokens: AI_CHAT_MAX_OUTPUT_TOKENS,
              }
            );
            replyText = response.text || "Olá! Desculpe, não entendi.";
          } catch (geminiError: any) {
            console.error(`[Webhook] Gemini failure from=${fromNumber}:`, geminiError.message || geminiError);
            addWebhookLog('error', 'Falha no Gemini', `Número: ${fromNumber}. Motivo: ${geminiError.message}`);
            // Prevent silent conversations when Gemini has temporary instability.
            replyText = "Tive uma instabilidade rápida aqui. Me confirma, por favor, o modelo do aparelho e o defeito para eu continuar seu atendimento agora.";
          }
        }

        replyText = finalizeReplyText(replyText, messageText, storedConfig);

        const dedupKey = `${fromNumber}:${normalizeForDedup(messageText)}`;
        recentReplyCache.set(dedupKey, { timestamp: Date.now(), replyText });
        if (recentReplyCache.size > MAX_REPLY_CACHE_ENTRIES) {
          const oldestKey = recentReplyCache.keys().next().value;
          if (oldestKey) recentReplyCache.delete(oldestKey);
        }
        verboseLog('debug', `Prepared reply for ${fromNumber}`, String(replyText).slice(0,300));
        // compute a simple hash of reply and incoming message to correlate
        try {
          const simpleHash = (s: string) => require('crypto').createHash('sha1').update(s).digest('hex').slice(0,8);
          verboseLog('debug', `Reply/Incoming hashes`, `in:${simpleHash(messageText || '')} out:${simpleHash(replyText || '')}`);
        } catch(e) {}

        // Also track the last reply sent to this phone number and avoid sending
        // an official message if a very similar reply was just sent recently.
        // Check persistent store first (survives restarts)
        try {
          if (db) {
            const persistent = await getPersistentLastReply(fromNumber);
            if (persistent && persistent.replyText) {
              const persistentTs = Date.parse(persistent.timestamp || "") || 0;
              if ((Date.now() - persistentTs) < REPLY_SIMILARITY_GUARD_MS && areRepliesSimilar(persistent.replyText, replyText)) {
                addWebhookLog('system', `Envio evitado — resposta similar já enviada (persistente)`, `Número: ${fromNumber}. Resposta anterior persistente: ${String(persistent.replyText).slice(0,120)}`);
                lastReplyByNumber.set(fromNumber, { timestamp: Date.now(), replyText: persistent.replyText });
                return;
              }
            }
          }
        } catch (e:any) {
          console.error("Error checking persistent last reply:", e.message || e);
        }

        const lastEntry = lastReplyByNumber.get(fromNumber);
        if (lastEntry && (Date.now() - lastEntry.timestamp) < REPLY_SIMILARITY_GUARD_MS && areRepliesSimilar(lastEntry.replyText, replyText)) {
          addWebhookLog('system', `Envio evitado — resposta similar já enviada`, `Número: ${fromNumber}. Resposta anterior: ${String(lastEntry.replyText).slice(0,120)}`);
          // Refresh the timestamp to extend cooldown window
          lastReplyByNumber.set(fromNumber, { timestamp: Date.now(), replyText: lastEntry.replyText });
          return; // skip sending the official message (history already saved)
        }

        // Extra guard using history itself: if last model message is too similar and recent, skip sending.
        const lastModelEntry = [...history].reverse().find((m: any) => m?.role === "model" && m?.text);
        if (lastModelEntry) {
          const lastModelTs = Date.parse(lastModelEntry.timestamp || "") || 0;
          if ((Date.now() - lastModelTs) < REPLY_SIMILARITY_GUARD_MS && areRepliesSimilar(String(lastModelEntry.text || ""), replyText)) {
            addWebhookLog('system', `Envio evitado — resposta similar detectada no histórico`, `Número: ${fromNumber}. Última resposta: ${String(lastModelEntry.text).slice(0,120)}`);
            return;
          }
        }

        // Update history with the final reply
        const updatedHistory = [
          ...history,
          { role: "user", text: messageText, timestamp: new Date().toISOString() },
          { role: "model", text: replyText, timestamp: new Date().toISOString() }
        ];
        await saveWhatsAppHistory(fromNumber, updatedHistory);

        addWebhookLog('outbound', `Resposta gerada pela IA`, replyText);

        // 3. Send official message if token & ID are configured
        if (whatsappAccessToken && whatsappPhoneNumberId) {
          // Reserve this reply before external send to reduce chance of near-simultaneous duplicate sends.
          try {
            lastReplyByNumber.set(fromNumber, { timestamp: Date.now(), replyText });
            if (db) {
              await setPersistentLastReply(fromNumber, replyText);
            }
          } catch (reserveErr: any) {
            verboseLog('debug', 'Error reserving last reply before send', reserveErr?.message || String(reserveErr));
          }

          // Simular tempo de digitação realista de acordo com o tamanho da resposta (ex: 18ms por caractere)
          // Mínimo de 1.5 segundos e máximo de 4.5 segundos para garantir que o cliente sinta o ritmo de uma resposta humana
          const simulatedTypingMs = Math.min(Math.max(1500, replyText.length * 18), 4500);
          addWebhookLog('system', `Simulando digitação do atendente`, `Aguardando ${simulatedTypingMs}ms antes de enviar para imitar a digitação humana.`);
          await new Promise(resolve => setTimeout(resolve, simulatedTypingMs));

          try {
            const fbResponse = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${whatsappAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: fromNumber,
                type: "text",
                text: {
                  body: replyText
                }
              })
            });

            const fbResult = await fbResponse.json();
            if (fbResponse.ok) {
              console.info(`[Webhook] message sent to=${fromNumber} id=${fbResult.messages?.[0]?.id || "n/a"}`);
              addWebhookLog('system', `Mensagem oficial enviada via API do WhatsApp`, `Mensagem enviada com sucesso para ${fromNumber}. ID: ${fbResult.messages?.[0]?.id || "N/A"}`);
              try {
                lastReplyByNumber.set(fromNumber, { timestamp: Date.now(), replyText });
                verboseLog('debug', `Persisting last reply for ${fromNumber}`, String(replyText).slice(0,300));
                if (db) {
                  await setPersistentLastReply(fromNumber, replyText);
                }
              } catch (e) {
                verboseLog('debug', 'Error persisting last reply', String(e));
              }
            } else {
              console.error(`[Webhook] WhatsApp API send failure to=${fromNumber}:`, JSON.stringify(fbResult));
              addWebhookLog('error', `Falha ao enviar mensagem via API do WhatsApp`, JSON.stringify(fbResult));
            }
          } catch (fetchError: any) {
            console.error(`[Webhook] request error while sending to=${fromNumber}:`, fetchError.message || fetchError);
            addWebhookLog('error', `Erro na requisição para a API do WhatsApp`, fetchError.message);
          }
        } else {
          addWebhookLog('system', `Mensagem de IA pronta, mas envio oficial desativado`, `Insira as credenciais do WhatsApp Cloud API no painel de Integração para enviar respostas oficiais diretamente.`);
        }
        } finally {
          try { processingLocks.delete(fromNumber); } catch (e) {}
        }
      })().catch(asyncErr => {
        console.error("Critical error in async background webhook processing:", asyncErr);
        addWebhookLog('error', `Erro crítico no processamento assíncrono`, asyncErr.message);
      });

    } catch (err: any) {
      console.error("Error in whatsapp webhook post:", err);
      addWebhookLog('error', `Erro crítico no processamento do Webhook`, err.message);
      // In case we errored out before sending response, send 500
      try { res.status(500).send("INTERNAL_SERVER_ERROR"); } catch (e) {}
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      time: new Date(),
      appVersion: APP_VERSION,
      dedupe: {
        inboundFingerprintCooldownMs: INBOUND_FINGERPRINT_COOLDOWN_MS,
        replySimilarityGuardMs: REPLY_SIMILARITY_GUARD_MS,
      },
    });
  });

  // Setup Vite Dev Server / Production routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Never wipe production conversation memory on boot unless explicitly requested.
  if (String(process.env.RESET_WHATSAPP_HISTORY_ON_BOOT || "false").toLowerCase() === "true") {
    await clearWhatsAppHistory();
    console.warn("WhatsApp history was reset on boot because RESET_WHATSAPP_HISTORY_ON_BOOT=true");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (http://localhost:${PORT})`);
  });
}

startServer();