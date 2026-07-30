var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_meta = {};
var envPath = import_fs.default.existsSync(import_path.default.resolve(process.cwd(), ".env.local")) ? import_path.default.resolve(process.cwd(), ".env.local") : import_path.default.resolve(process.cwd(), ".env");
import_dotenv.default.config({ path: envPath });
var resolvedFilename = typeof import_meta !== "undefined" && import_meta.url ? (0, import_url.fileURLToPath)(import_meta.url) : typeof __filename !== "undefined" ? __filename : process.cwd();
var resolvedDirname = typeof import_meta !== "undefined" && import_meta.url ? import_path.default.dirname(resolvedFilename) : typeof __dirname !== "undefined" ? __dirname : process.cwd();
var webhookLogs = [
  { id: "init-log-1", timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR"), direction: "system", message: "Sistema de Webhook Oficial Inicializado", details: "Aguardando requisi\xE7\xF5es do Meta Developer Portal" }
];
var verboseLogs = false;
var setVerboseLogs = (v) => {
  verboseLogs = !!v;
  addWebhookLog("system", `Verbose logs ${v ? "ativados" : "desativados"}`, `verboseLogs=${v}`);
};
var verboseLog = (direction, message, details) => {
  if (!verboseLogs) return;
  addWebhookLog(direction === "debug" ? "system" : direction, message, details);
  try {
    console.debug(`[VERBOSE] ${message}`, details || "");
  } catch (e) {
  }
};
var addWebhookLog = (direction, message, details) => {
  const newLog = {
    id: `wlog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR"),
    direction,
    message,
    details
  };
  webhookLogs = [newLog, ...webhookLogs.slice(0, 99)];
};
var configDir = import_path.default.join(process.cwd(), "data");
var configFilePath = import_path.default.join(configDir, "config.json");
var postsFilePath = import_path.default.join(configDir, "posts.json");
function ensureConfigDir() {
  if (!import_fs.default.existsSync(configDir)) {
    import_fs.default.mkdirSync(configDir, { recursive: true });
  }
}
function loadStoredPosts() {
  ensureConfigDir();
  if (import_fs.default.existsSync(postsFilePath)) {
    try {
      return JSON.parse(import_fs.default.readFileSync(postsFilePath, "utf8"));
    } catch (e) {
      console.error("Error reading posts file:", e);
    }
  }
  return [];
}
function saveStoredPosts(posts) {
  ensureConfigDir();
  try {
    import_fs.default.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing posts file:", e);
  }
}
function loadStoredConfig() {
  ensureConfigDir();
  if (import_fs.default.existsSync(configFilePath)) {
    try {
      return JSON.parse(import_fs.default.readFileSync(configFilePath, "utf8"));
    } catch (e) {
      console.error("Error reading config file:", e);
      try {
        const raw = import_fs.default.readFileSync(configFilePath, "utf8");
        console.error("Raw config file length:", raw.length, "content preview:", raw.slice(0, 300));
        const backupPath = `${configFilePath}.invalid-${Date.now()}`;
        import_fs.default.copyFileSync(configFilePath, backupPath);
        console.error(`Invalid config file backed up to ${backupPath}`);
      } catch (backupError) {
        console.error("Failed to backup invalid config file:", backupError);
      }
      const fallbackConfig = {
        name: "AndMicrocell - Assist\xEAncia T\xE9cnica",
        category: "Assist\xEAncia T\xE9cnica",
        address: "Rua Exemplo, 123",
        phone: "(81) 99999-9999",
        businessHours: "Segunda a Sexta: 08h \xE0s 12h e das 14h \xE0s 18h | S\xE1bados: 09h \xE0s 13h",
        tone: "acolhedor, profissional e \xE1gil",
        specialOffers: "",
        faqs: [],
        whatsappVerifyToken: "zetachat_secret_token"
      };
      try {
        import_fs.default.writeFileSync(configFilePath, JSON.stringify(fallbackConfig, null, 2), "utf8");
        console.error("Replaced invalid config file with fallback defaults.");
      } catch (writeError) {
        console.error("Failed to write fallback config file:", writeError);
      }
      return fallbackConfig;
    }
  }
  return null;
}
function saveStoredConfig(config) {
  ensureConfigDir();
  try {
    import_fs.default.writeFileSync(configFilePath, JSON.stringify(config, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing config file:", e);
  }
}
var db = null;
try {
  const firebaseConfigPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(import_fs.default.readFileSync(firebaseConfigPath, "utf8"));
    const firebaseApp = (0, import_app.initializeApp)({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId
    });
    db = (0, import_firestore.getFirestore)(firebaseApp, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log("Firebase Firestore initialized successfully in server with Database ID:", firebaseConfig.firestoreDatabaseId || "(default)");
  } else {
    console.warn("firebase-applet-config.json not found, falling back to local files.");
  }
} catch (e) {
  console.error("Failed to initialize Firebase:", e.message);
}
async function getFirebaseConfig() {
  if (db) {
    try {
      const configDocRef = (0, import_firestore.doc)(db, "config", "business");
      const snapshot = await (0, import_firestore.getDoc)(configDocRef);
      if (snapshot.exists()) {
        return snapshot.data();
      }
    } catch (e) {
      console.error("Error reading config from Firestore:", e.message);
    }
  }
  return loadStoredConfig();
}
async function saveFirebaseConfig(config) {
  saveStoredConfig(config);
  if (db) {
    try {
      const configDocRef = (0, import_firestore.doc)(db, "config", "business");
      await (0, import_firestore.setDoc)(configDocRef, config);
      console.log("Config saved to Firestore successfully!");
    } catch (e) {
      console.error("Error saving config to Firestore:", e.message);
    }
  }
}
async function getFirebasePosts() {
  if (db) {
    try {
      const postsCol = (0, import_firestore.collection)(db, "posts");
      const snapshot = await (0, import_firestore.getDocs)(postsCol);
      if (!snapshot.empty) {
        const posts = [];
        snapshot.forEach((doc2) => {
          posts.push(doc2.data());
        });
        return posts.sort((a, b) => {
          const dateA = a.publishedAt || "";
          const dateB = b.publishedAt || "";
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA);
          }
          return (b.id || "").localeCompare(a.id || "");
        });
      }
    } catch (e) {
      console.error("Error reading posts from Firestore:", e.message);
    }
  }
  return loadStoredPosts();
}
async function saveFirebasePost(post) {
  if (db && post && post.id) {
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "posts", post.id), post);
      console.log(`Post ${post.id} saved to Firestore successfully!`);
    } catch (e) {
      console.error(`Error saving post ${post.id} to Firestore:`, e.message);
      throw e;
    }
  }
  try {
    const currentPosts = loadStoredPosts();
    const index = currentPosts.findIndex((p) => p.id === post.id);
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
async function deleteFirebasePost(postId) {
  if (db) {
    try {
      await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(db, "posts", postId));
      console.log(`Post ${postId} deleted from Firestore!`);
    } catch (e) {
      console.error(`Error deleting post ${postId} from Firestore:`, e.message);
      throw e;
    }
  }
  try {
    const currentPosts = loadStoredPosts();
    const filtered = currentPosts.filter((p) => p.id !== postId);
    saveStoredPosts(filtered);
  } catch (e) {
    console.error("Error writing local posts backup after delete:", e);
  }
}
async function runFirebaseMigrations() {
  if (!db) return;
  try {
    const configDocRef = (0, import_firestore.doc)(db, "config", "business");
    const configSnapshot = await (0, import_firestore.getDoc)(configDocRef);
    if (!configSnapshot.exists()) {
      console.log("Firestore business config not found. Migrating local config...");
      const localConfig = loadStoredConfig();
      if (localConfig) {
        await (0, import_firestore.setDoc)(configDocRef, localConfig);
        console.log("Successfully migrated config to Firestore!");
      }
    } else {
      const firestoreConfig = configSnapshot.data();
      const localConfig = loadStoredConfig();
      if (localConfig && (localConfig.phone !== firestoreConfig.phone || localConfig.name !== firestoreConfig.name || localConfig.address !== firestoreConfig.address || localConfig.category !== firestoreConfig.category)) {
        console.log("Local config differs from Firestore. Syncing local changes (phone/name/address/category) to Firestore...");
        const mergedConfig = { ...firestoreConfig, ...localConfig };
        await (0, import_firestore.setDoc)(configDocRef, mergedConfig);
        console.log("Successfully synchronized local config changes to Firestore!");
      }
    }
    const postsCol = (0, import_firestore.collection)(db, "posts");
    const postsSnapshot = await (0, import_firestore.getDocs)(postsCol);
    if (postsSnapshot.empty) {
      console.log("Firestore posts collection is empty. Migrating local posts...");
      const localPosts = loadStoredPosts();
      for (const post of localPosts) {
        if (post && post.id) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "posts", post.id), post);
        }
      }
      console.log(`Successfully migrated ${localPosts.length} posts to Firestore!`);
    }
  } catch (err) {
    console.error("Failed to run Firebase Firestore migrations:", err.message);
  }
}
var inMemoryHistoryCache = {};
var processedMessageIds = /* @__PURE__ */ new Set();
var recentReplyCache = /* @__PURE__ */ new Map();
var lastReplyByNumber = /* @__PURE__ */ new Map();
var processingLocks = /* @__PURE__ */ new Map();
var PROCESSING_LOCK_MS = 1e4;
var REPLY_COOLDOWN_MS = 8e3;
var REPLY_SIMILARITY_GUARD_MS = Number(process.env.REPLY_SIMILARITY_GUARD_MS || 18e4);
var MAX_REPLY_CACHE_ENTRIES = 200;
var INBOUND_FINGERPRINT_COOLDOWN_MS = Number(process.env.INBOUND_FINGERPRINT_COOLDOWN_MS || 12e4);
var MAX_INBOUND_FINGERPRINT_CACHE_ENTRIES = 1500;
var inboundFingerprintCache = /* @__PURE__ */ new Map();
var AI_MODEL_CHAT = process.env.GEMINI_MODEL_CHAT || "gemini-2.5-flash-lite";
var AI_MODEL_REVIEW = process.env.GEMINI_MODEL_REVIEW || "gemini-2.5-flash-lite";
var AI_MODEL_CONTENT = process.env.GEMINI_MODEL_CONTENT || "gemini-3.5-flash";
var GEMINI_MODEL_FALLBACKS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
var APP_VERSION = process.env.APP_VERSION || "2026-07-30-dedupe-fingerprint-v2";
var AI_CHAT_HISTORY_LIMIT = Number(process.env.AI_CHAT_HISTORY_LIMIT || 4);
var AI_CHAT_MAX_OUTPUT_TOKENS = Number(process.env.AI_CHAT_MAX_OUTPUT_TOKENS || 380);
var AI_REVIEW_MAX_OUTPUT_TOKENS = Number(process.env.AI_REVIEW_MAX_OUTPUT_TOKENS || 180);
var GEMINI_MODEL_CACHE_TTL_MS = 30 * 60 * 1e3;
var cachedGeminiModels = null;
var cachedGeminiModelsAt = 0;
var persistentLastReplyReadDisabled = false;
var persistentLastReplyWriteDisabled = false;
function normalizeModelName(model) {
  return String(model || "").replace(/^models\//i, "").trim();
}
function isGeminiModelUnavailableError(err) {
  const message = String(err?.message || err || "").toLowerCase();
  return message.includes("no longer available") || message.includes("not_found") || message.includes("not found");
}
function isFirestorePermissionDenied(err) {
  const text = `${String(err?.code || "")} ${String(err?.message || err || "")}`.toLowerCase();
  return text.includes("permission_denied") || text.includes("permission-denied") || text.includes("insufficient permissions");
}
async function getAvailableGeminiModels(client) {
  const isCacheFresh = cachedGeminiModels && Date.now() - cachedGeminiModelsAt < GEMINI_MODEL_CACHE_TTL_MS;
  if (isCacheFresh) return cachedGeminiModels;
  try {
    const pager = await client.models.list();
    const available = /* @__PURE__ */ new Set();
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
  } catch (e) {
    console.warn("Unable to list Gemini models. Proceeding with configured candidates:", e?.message || e);
  }
  return null;
}
async function generateContentWithModelFallback(client, preferredModel, contents, config, extraFallbacks = []) {
  const candidates = Array.from(new Set([
    normalizeModelName(preferredModel),
    ...extraFallbacks.map(normalizeModelName),
    ...GEMINI_MODEL_FALLBACKS.map(normalizeModelName)
  ].filter(Boolean)));
  const availableModels = await getAvailableGeminiModels(client);
  const modelsToTry = availableModels && availableModels.size > 0 ? candidates.filter((model) => availableModels.has(model)) : candidates;
  const finalModelsToTry = modelsToTry.length > 0 ? modelsToTry : candidates;
  let lastError = null;
  for (const model of finalModelsToTry) {
    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config
      });
      return { response, modelUsed: model };
    } catch (e) {
      lastError = e;
      if (isGeminiModelUnavailableError(e)) {
        try {
          cachedGeminiModels?.delete(model);
        } catch (cacheErr) {
        }
        console.warn(`Gemini model unavailable (${model}). Trying next candidate...`);
        continue;
      }
      throw e;
    }
  }
  throw lastError || new Error("No available Gemini model candidate succeeded.");
}
function normalizeForDedup(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}
function hashString(input) {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) + hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
function buildInboundFingerprint(fromNumber, messageText) {
  return `${String(fromNumber || "").trim()}:${normalizeForDedup(messageText || "")}`;
}
function touchInboundFingerprintCache(fingerprint) {
  inboundFingerprintCache.set(fingerprint, Date.now());
  if (inboundFingerprintCache.size > MAX_INBOUND_FINGERPRINT_CACHE_ENTRIES) {
    const oldest = inboundFingerprintCache.keys().next().value;
    if (oldest) inboundFingerprintCache.delete(oldest);
  }
}
async function claimInboundFingerprint(fromNumber, messageText) {
  const fingerprint = buildInboundFingerprint(fromNumber, messageText);
  if (!fingerprint || fingerprint.endsWith(":")) return true;
  const now = Date.now();
  const localSeenAt = inboundFingerprintCache.get(fingerprint) || 0;
  if (localSeenAt && now - localSeenAt < INBOUND_FINGERPRINT_COOLDOWN_MS) {
    return false;
  }
  touchInboundFingerprintCache(fingerprint);
  if (!db) return true;
  const docId = `fp_${hashString(fingerprint)}`;
  let claimed = false;
  try {
    await (0, import_firestore.runTransaction)(db, async (tx) => {
      const ref = (0, import_firestore.doc)(db, "processed_messages", docId);
      const snap = await tx.get(ref);
      const data = snap.exists() ? snap.data() : null;
      const lastSeenMs = Number(data?.lastSeenMs || 0);
      if (lastSeenMs && now - lastSeenMs < INBOUND_FINGERPRINT_COOLDOWN_MS) {
        claimed = false;
        return;
      }
      tx.set(ref, {
        type: "inbound_fingerprint",
        fromNumber,
        preview: normalizeForDedup(messageText).slice(0, 100),
        lastSeenMs: now,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }, { merge: true });
      claimed = true;
    });
  } catch (e) {
    console.error("[Deduplication] Error claiming inbound fingerprint:", e.message || e);
    return true;
  }
  return claimed;
}
function sanitizeReplyText(text) {
  if (!text) return text;
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 1) {
    return cleaned;
  }
  const deduped = [];
  for (const sentence of sentences) {
    const trimmed = sentence.replace(/\s+/g, " ").trim();
    const alreadyIncluded = deduped.some((prev) => prev.toLowerCase() === trimmed.toLowerCase());
    if (!alreadyIncluded) {
      deduped.push(trimmed);
    }
  }
  return deduped.join(" ");
}
function hasNaturalSentenceEnding(text) {
  const trimmed = String(text || "").trim();
  return /[.!?…)]$/.test(trimmed);
}
function finalizeReplyText(rawText, userMessage, config) {
  const sanitized = sanitizeReplyText(rawText || "");
  if (!sanitized) {
    return "Perfeito. Para te ajudar com precis\xE3o, me diga o modelo completo do aparelho e o que est\xE1 acontecendo com ele.";
  }
  if (!hasNaturalSentenceEnding(sanitized)) {
    const lowCost = getLowCostInstantReply(userMessage, config);
    if (lowCost) {
      return sanitizeReplyText(lowCost);
    }
    return "Perfeito. Para te ajudar com precis\xE3o, me diga o modelo completo do aparelho e o que est\xE1 acontecendo com ele.";
  }
  return sanitized;
}
function normalizeForReplyCompare(text) {
  if (!text) return "";
  return text.normalize("NFD").replace(/[ -\u0020\u0300-\u036f]/g, " ").replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}
function areRepliesSimilar(a, b) {
  const na = normalizeForReplyCompare(a || "");
  const nb = normalizeForReplyCompare(b || "");
  if (!na || !nb) return false;
  if (na === nb) return true;
  const minLen = Math.min(na.length, nb.length);
  const maxLen = Math.max(na.length, nb.length);
  if ((na.includes(nb) || nb.includes(na)) && (maxLen - minLen) / maxLen < 0.35) {
    return true;
  }
  try {
    const firstSentence = (s) => {
      const m = s.split(/[.!?]/).map((x) => x.trim()).filter(Boolean);
      return m.length ? m[0] : s;
    };
    const fa = firstSentence(na);
    const fb = firstSentence(nb);
    if (fa && fb) {
      const wa = new Set(fa.split(/\s+/));
      const wb = new Set(fb.split(/\s+/));
      let inter = 0;
      for (const w of wa) if (wb.has(w)) inter++;
      const union = (/* @__PURE__ */ new Set([...wa, ...wb])).size || 1;
      const jaccard = inter / union;
      if (jaccard > 0.45) return true;
    }
  } catch (e) {
  }
  return false;
}
async function getPersistentLastReply(fromNumber) {
  if (!db || persistentLastReplyReadDisabled) return null;
  try {
    const ref = (0, import_firestore.doc)(db, "last_replies", fromNumber);
    const snap = await (0, import_firestore.getDoc)(ref);
    if (snap.exists()) return snap.data();
  } catch (e) {
    if (isFirestorePermissionDenied(e)) {
      persistentLastReplyReadDisabled = true;
      console.warn("Persistent last_replies read disabled due Firestore permissions.");
      return null;
    }
    console.error("Error reading persistent last reply:", e.message || e);
  }
  return null;
}
async function setPersistentLastReply(fromNumber, replyText) {
  if (!db || persistentLastReplyWriteDisabled) return;
  try {
    await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "last_replies", fromNumber), {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      replyText
    });
  } catch (e) {
    if (isFirestorePermissionDenied(e)) {
      persistentLastReplyWriteDisabled = true;
      console.warn("Persistent last_replies write disabled due Firestore permissions.");
      return;
    }
    console.error("Error saving persistent last reply:", e.message || e);
  }
}
async function claimProcessedMessage(messageId, payload) {
  if (!db || !messageId) return true;
  let claimed = false;
  try {
    await (0, import_firestore.runTransaction)(db, async (tx) => {
      const ref = (0, import_firestore.doc)(db, "processed_messages", messageId);
      const snap = await tx.get(ref);
      if (snap.exists()) {
        return;
      }
      tx.set(ref, {
        processedAt: (/* @__PURE__ */ new Date()).toISOString(),
        ...payload
      });
      claimed = true;
    });
  } catch (e) {
    console.error("[Deduplication] Error claiming processed message in Firestore:", e.message || e);
    return true;
  }
  return claimed;
}
function getClarifyingResponseForIncompleteDeviceInfo(messageText, history = []) {
  const text = (messageText || "").trim();
  if (!text) return null;
  const combinedText = [text, ...history.slice(-3).map((m) => m.text || "")].join(" ");
  const lowerText = combinedText.toLowerCase();
  const hasUnknownModel = /\b(nao sei|não sei|nao lembro|não lembro|nao tenho ideia|não tenho ideia|sem ideia|não sei o modelo|nao sei o modelo)\b/.test(lowerText);
  const brandMatch = /\b(xiaomi|samsung|motorola|iphone|apple|asus|lenovo|dell|hp|acer|sony|lg|oneplus|realme|redmi|pixel|nokia|moto)\b/.exec(lowerText);
  const hasDeviceContext = /\b(celular|aparelho|telefone|smartphone|dispositivo|modelo|marca)\b/.test(lowerText);
  const hasExplicitModel = /\b(note|redmi|poco|mi|iphone|galaxy|moto|edge|a|s|m|pro|plus|ultra|lite|max|mini)\b/.test(lowerText) && /\b\d{1,3}\b/.test(lowerText);
  if (hasExplicitModel) return null;
  if (hasUnknownModel || brandMatch && hasDeviceContext) {
    const brandLabel = brandMatch ? brandMatch[0].charAt(0).toUpperCase() + brandMatch[0].slice(1) : "seu aparelho";
    return hasUnknownModel ? "Tudo bem, sem problema. Para te ajudar corretamente, me diga a marca e o modelo completo do aparelho. Se voc\xEA n\xE3o souber, pode me mandar uma foto ou descrever o aparelho para eu te orientar melhor." : `Perfeito, j\xE1 entendi a marca. Para te ajudar com precis\xE3o, me diga o modelo completo do aparelho, por exemplo: ${brandLabel} Note 12 4G.`;
  }
  return null;
}
function getLowCostInstantReply(messageText, config) {
  const text = String(messageText || "").trim();
  if (!text) return null;
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").toLowerCase();
  const asksHours = /\b(horario|horarios|hora|abre|aberto|fecha|funcionamento)\b/.test(normalized);
  if (asksHours) {
    return `Nosso hor\xE1rio \xE9 ${config?.businessHours || "Segunda a sexta, em hor\xE1rio comercial"}. Se quiser, j\xE1 adianto seu atendimento agora e deixo seu or\xE7amento encaminhado.`;
  }
  const asksAddress = /\b(endereco|endereço|localizacao|localização|onde fica|aonde fica|local)\b/.test(normalized);
  if (asksAddress) {
    return config?.address ? `Estamos em: ${config.address}. Se quiser, j\xE1 te envio a refer\xEAncia e deixo seu hor\xE1rio pr\xE9-agendado.` : "Atendemos na loja f\xEDsica e por WhatsApp. Me diga seu bairro que eu te passo a melhor forma de trazer o aparelho para avalia\xE7\xE3o gratuita.";
  }
  const asksPhone = /\b(telefone|whatsapp|contato|numero|número)\b/.test(normalized);
  if (asksPhone) {
    return `Pode falar por aqui mesmo no WhatsApp ${config?.phone || "da loja"}. Me diga modelo e defeito que eu j\xE1 te passo a faixa de valor e o pr\xF3ximo passo.`;
  }
  const greetingsOnly = /^(oi|ola|olá|bom dia|boa tarde|boa noite|opa|e ai|e aí)\b/.test(normalized) && normalized.length <= 20;
  if (greetingsOnly) {
    return "Ol\xE1. Me diga o modelo do aparelho e o defeito para eu te passar uma estimativa agora e j\xE1 adiantar seu atendimento.";
  }
  const asksPriceOnly = /\b(preco|preço|valor|orcamento|orçamento|quanto custa|quanto fica)\b/.test(normalized);
  const hasDeviceModelHint = /\b(iphone|samsung|motorola|xiaomi|redmi|poco|galaxy|moto|note|a\d\d?|s\d\d?)\b/.test(normalized);
  if (asksPriceOnly && !hasDeviceModelHint) {
    return "Consigo te passar uma faixa agora. Me diga marca e modelo completo para te responder com precis\xE3o e j\xE1 deixar seu atendimento encaminhado.";
  }
  if (asksPriceOnly && hasDeviceModelHint) {
    return "Perfeito. Para te passar valor justo sem erro, me confirma o modelo exato e o problema (tela, bateria, conector ou outro). Com isso j\xE1 te envio faixa de pre\xE7o e pr\xF3ximo passo.";
  }
  return null;
}
function shouldSkipDuplicateReply(fromNumber, messageText) {
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
async function clearWhatsAppHistory(fromNumber) {
  if (fromNumber) {
    if (db) {
      try {
        await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(db, "whatsapp_history", fromNumber));
      } catch (e) {
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
        const historySnapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(db, "whatsapp_history"));
        for (const historyDoc of historySnapshot.docs) {
          await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(db, "whatsapp_history", historyDoc.id));
        }
      } catch (e) {
        console.error("Error clearing all WhatsApp history from Firestore:", e.message);
      }
    }
    Object.keys(inMemoryHistoryCache).forEach((key) => delete inMemoryHistoryCache[key]);
    recentReplyCache.clear();
  }
  processedMessageIds.clear();
}
async function getWhatsAppHistory(fromNumber) {
  if (db) {
    try {
      const historyDocRef = (0, import_firestore.doc)(db, "whatsapp_history", fromNumber);
      const snapshot = await (0, import_firestore.getDoc)(historyDocRef);
      if (snapshot.exists()) {
        return snapshot.data().messages || [];
      }
    } catch (e) {
      console.error("Error reading WhatsApp history from Firestore:", e.message);
    }
  }
  return inMemoryHistoryCache[fromNumber] || [];
}
var uninterestedPatterns = [
  /\b(n[aã]o quero|nao quero|nao tenho interesse|não tenho interesse|nao interessa|não interessa|nao desejo|não desejo|sem interesse|ja tenho|já tenho|ja vou|já vou|ja resolvido|já resolvido|ja foi|já foi|passo|passar|depois eu vejo|depois vejo|fique com|vou ver depois|ja resolvi|já resolvi)\b/i
];
var uninterestedShortReplies = [
  /^(ok|beleza|valeu|obrigado|obrigada|brigado|thanks|thank you|tudo bem|certo|show|blz)$/i
];
function isWhatsAppUninterested(text) {
  if (!text) return false;
  const normalized = text.normalize("NFD").replace(/[ --]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  if (uninterestedPatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }
  if (normalized.length <= 30 && uninterestedShortReplies.some((pattern) => pattern.test(normalized))) {
    return true;
  }
  return false;
}
async function saveWhatsAppHistory(fromNumber, messages) {
  const sliced = messages.slice(-15);
  if (db) {
    try {
      const historyDocRef = (0, import_firestore.doc)(db, "whatsapp_history", fromNumber);
      await (0, import_firestore.setDoc)(historyDocRef, { messages: sliced });
    } catch (e) {
      console.error("Error saving WhatsApp history to Firestore:", e.message);
    }
  }
  inMemoryHistoryCache[fromNumber] = sliced;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
  app.use((req, res, next) => {
    const hostname = req.hostname || req.headers.host || "";
    const isAiStudio = hostname.includes("run.app") || hostname.includes("localhost") || hostname.includes("127.0.0.1") || hostname.includes("stackblitz");
    if (!isAiStudio) {
      const isWebhook = req.path.startsWith("/api/webhook/whatsapp");
      const isPublicApi = req.path.startsWith("/api/health") || req.path.startsWith("/api/blog") || req.path.startsWith("/api/site") || req.path.startsWith("/api/posts");
      if (isWebhook || isPublicApi) {
        return next();
      }
      console.log(`[Seguran\xE7a] Bloqueando acesso externo de ${hostname} para a rota ${req.path}. Redirecionando para site institucional.`);
      return res.redirect(302, "https://www.andmicrocell.com.br");
    }
    next();
  });
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });
  await runFirebaseMigrations();
  let ai = null;
  const getGeminiClient = () => {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        throw new Error("GEMINI_API_KEY environment variable is not configured.");
      }
      ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
    return ai;
  };
  const getBrazilDateTime = () => {
    const options = { timeZone: "America/Recife", hour12: false };
    const formatterDate = new Intl.DateTimeFormat("pt-BR", {
      ...options,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const formatterTime = new Intl.DateTimeFormat("pt-BR", {
      ...options,
      hour: "2-digit",
      minute: "2-digit"
    });
    const formatterWeekday = new Intl.DateTimeFormat("pt-BR", {
      ...options,
      weekday: "long"
    });
    const now = /* @__PURE__ */ new Date();
    return {
      date: formatterDate.format(now),
      time: formatterTime.format(now),
      weekday: formatterWeekday.format(now)
      // "segunda-feira", "domingo", etc.
    };
  };
  const getBrazilStatus = () => {
    const options = { timeZone: "America/Recife", hour12: false };
    const now = /* @__PURE__ */ new Date();
    const formatterWeekdayEn = new Intl.DateTimeFormat("en-US", { ...options, weekday: "short" });
    const weekdayEn = formatterWeekdayEn.format(now);
    const formatterHour = new Intl.DateTimeFormat("en-US", { ...options, hour: "numeric" });
    const formatterMinute = new Intl.DateTimeFormat("en-US", { ...options, minute: "numeric" });
    const hour = parseInt(formatterHour.format(now), 10);
    const minute = parseInt(formatterMinute.format(now), 10);
    const totalMinutes = hour * 60 + minute;
    let isOpen = false;
    let statusMessage = "";
    if (weekdayEn === "Sun") {
      isOpen = false;
      statusMessage = "FECHADA (Hoje \xE9 Domingo. Nosso expediente f\xEDsico de atendimento \xE9 de Segunda a Sexta das 08h \xE0s 12h e das 14h \xE0s 18h, e aos S\xE1bados das 09h \xE0s 13h. A loja f\xEDsica est\xE1 FECHADA hoje).";
    } else if (weekdayEn === "Sat") {
      const start = 9 * 60;
      const end = 13 * 60;
      if (totalMinutes >= start && totalMinutes <= end) {
        isOpen = true;
        statusMessage = `ABERTA (S\xE1bado dentro do hor\xE1rio: das 09h \xE0s 13h. Hor\xE1rio atual: ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}).`;
      } else {
        isOpen = false;
        statusMessage = `FECHADA (Hoje \xE9 S\xE1bado. Nosso expediente de S\xE1bado \xE9 das 09h \xE0s 13h. Hor\xE1rio atual: ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}).`;
      }
    } else {
      const morningStart = 8 * 60;
      const morningEnd = 12 * 60;
      const afternoonStart = 14 * 60;
      const afternoonEnd = 18 * 60;
      if (totalMinutes >= morningStart && totalMinutes <= morningEnd || totalMinutes >= afternoonStart && totalMinutes <= afternoonEnd) {
        isOpen = true;
        statusMessage = `ABERTA (Segunda a Sexta dentro do hor\xE1rio: das 08h \xE0s 12h e das 14h \xE0s 18h. Hor\xE1rio atual: ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}).`;
      } else {
        isOpen = false;
        if (totalMinutes > morningEnd && totalMinutes < afternoonStart) {
          statusMessage = `FECHADA (Hor\xE1rio de almo\xE7o de Segunda a Sexta: fechados das 12h \xE0s 14h. Hor\xE1rio atual: ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}).`;
        } else {
          statusMessage = `FECHADA (Fora do expediente comercial de Segunda a Sexta das 08h \xE0s 12h e das 14h \xE0s 18h. Hor\xE1rio atual: ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}).`;
        }
      }
    }
    return { isOpen, statusMessage };
  };
  const buildSystemInstruction = (config) => {
    const { name, category, address, phone, businessHours, specialOffers, tone, faqs } = config;
    let faqText = faqs && faqs.length > 0 ? faqs.map((f) => `P: ${f.question}
R: ${f.answer}`).join("\n\n") : "Nenhuma cadastrada.";
    const brazilTime = getBrazilDateTime();
    const brazilStatus = getBrazilStatus();
    return `Voc\xEA \xE9 o assistente inteligente de intelig\xEAncia artificial da empresa "${name}".
Voc\xEA est\xE1 respons\xE1vel por automatizar as conversas do WhatsApp da empresa, que atua no segmento de "${category}".
O tom de voz da sua comunica\xE7\xE3o deve ser estritamente: ${tone} (use uma abordagem acolhedora, profissional, \xE1gil e muito atenciosa).

Informa\xE7\xF5es importantes da empresa:
- Nome da Empresa: ${name}
- Ramo principal: ${category}
- Endere\xE7o f\xEDsico: ${address || "N\xE3o informado / Apenas online"}
- Telefone/WhatsApp: ${phone}
- Hor\xE1rio de Funcionamento: ${businessHours || "Segunda a Sexta: 08h \xE0s 12h e das 14h \xE0s 18h | S\xE1bados: 09h \xE0s 13h"}
- Ofertas/Promo\xE7\xF5es Ativas: ${specialOffers || "Nenhuma no momento"}

PORTF\xD3LIO DE SERVI\xC7OS E REGRAS DE POSICIONAMENTO COMERCIAL (CR\xCDTICO):
1. Alta Especialidade em Smartphones e iPhones (Servi\xE7os Avan\xE7ados): Somos especialistas de alt\xEDssimo n\xEDvel em manuten\xE7\xE3o de smartphones, com foco especial na linha Apple (iPhone). Nosso laborat\xF3rio possui ferramental especializado de ponta para realizar procedimentos complexos:
   - Trocas de telas e baterias com t\xE9cnicas avan\xE7adas para preservar os recursos originais.
   - Reparos l\xF3gicos avan\xE7ados em placas eletr\xF4nicas por micro-soldagem (diagn\xF3stico e micro-soldagem em circuitos integrados, curtos-circuitos, aparelhos que n\xE3o ligam ou com falhas de sinal/carga) exclusivos para smartphones, cobrindo tanto iPhones quanto aparelhos Android de qualquer marca (Samsung, Motorola, Xiaomi, etc.).
   - IMPORTANTE (Troca de Vidro): N\xC3O realizamos o servi\xE7o de troca exclusiva de vidro da tela no momento (nem para iPhone, nem para Android). Se o cliente perguntar por troca de vidro, explique educadamente que trabalhamos com a substitui\xE7\xE3o do m\xF3dulo completo de tela premium (que garante m\xE1xima qualidade e durabilidade padr\xE3o de f\xE1brica), mas fa\xE7a quest\xE3o de destacar com entusiasmo que j\xE1 estamos em fase de planejamento e viabilizando a compra dos maquin\xE1rios especiais para implantar o servi\xE7o de troca de vidro em breve na nossa assist\xEAncia!
2. Manuten\xE7\xE3o de Notebooks e Computadores (Excelente faturamento): Oferecemos assist\xEAncia t\xE9cnica altamente qualificada para PCs convencionais, PCs Gamers de alto desempenho e Notebooks de todas as marcas (Dell, Lenovo, HP, Asus, Acer, Samsung, etc.). Realizamos:
   - Formata\xE7\xE3o completa do sistema com backup rigoroso e seguro de todos os dados do cliente.
   - Upgrades estrat\xE9gicos de SSD e Mem\xF3ria RAM (fazendo notebooks antigos funcionarem at\xE9 10 vezes mais r\xE1pido).
   - Limpeza t\xE9cnica interna preventiva com desmontagem completa e aplica\xE7\xE3o de pasta t\xE9rmica de alta condutividade (essencial contra lentid\xE3o, travamentos e superaquecimento).
   - Substitui\xE7\xE3o de telas de notebooks, teclados, baterias e conectores.
   - Restaura\xE7\xE3o f\xEDsica de carca\xE7as e dobradi\xE7as danificadas.
   - IMPORTANTE (Placas de Computadores): N\xC3O fazemos reparos em placas-m\xE3e de notebooks ou computadores. Nossos reparos eletr\xF4nicos de placa s\xE3o voltados \xFAnica e exclusivamente para a linha de celulares (iPhones e Androids).
3. Conserto de Celulares Android: Realizamos troca de telas completas, troca de baterias, substitui\xE7\xE3o de conectores de carga, reparos l\xF3gicos de placa e desoxida\xE7\xE3o f\xEDsica de aparelhos de todas as marcas (Samsung, Motorola, Xiaomi, etc.).

ZELO E SEGURAN\xC7A T\xC9CNICA (ESSENCIAL):
- Em todos os nossos procedimentos \u2014 desde uma limpeza minuciosa em um PC Gamer avan\xE7ado at\xE9 a micro-soldagem de precis\xE3o em uma placa de celular \u2014 aplicamos t\xE9cnicas rigorosas do padr\xE3o de f\xE1brica, com total seguran\xE7a, cuidado, zelo e respeito ao equipamento do cliente. N\xF3s sabemos exatamente o que estamos fazendo e oferecemos garantia de especialista.

REGRAS DE CONVERSA\xC7\xC3O (MUITO IMPORTANTES):
- Regra de Ouro da Receita: Se o cliente perguntar se consertamos computadores, notebooks ou celulares Android, diga imediatamente que SIM! Apresente o servi\xE7o com total confian\xE7a profissional e entusiasmo t\xE9cnico. Jamais diminua ou recuse esses servi\xE7os, pois eles s\xE3o fontes fundamentais de faturamento da nossa assist\xEAncia.
- Qualidade de Telas e Baterias Premium: Nossas telas de reposi\xE7\xE3o s\xE3o de qualidade OLED Premium e j\xE1 v\xEAm com o recurso True Tone ativo de f\xE1brica naturalmente (sem precisar de nenhum transplante). A imagem e o toque s\xE3o perfeitos como a original. Nossas baterias Premium tamb\xE9m possuem excelente durabilidade e rendimento id\xEAnticos aos da original de f\xE1brica.
- Diferencial T\xE9cnico Opcional (EPROM/BMS): Oferecemos um procedimento opcional de transplante do chip EEPROM original (da tela) e do controlador BMS (da bateria) para aqueles clientes mais exigentes que n\xE3o desejam ver a mensagem de aviso de "tela desconhecida" ou "bateria desconhecida" nas configura\xE7\xF5es do iOS. Como estamos no interior de Pernambuco, a grande maioria dos clientes desconhece esses termos t\xE9cnicos e quase nunca pede isso. Por isso, N\xC3O ofere\xE7a esse servi\xE7o proativamente. Sempre informe o pre\xE7o padr\xE3o da tela/bateria primeiro. Apenas mencione o transplante se o cliente demonstrar forte preocupa\xE7\xE3o com avisos de pe\xE7as nas configura\xE7\xF5es ou com a sa\xFAde da bateria. Explique de maneira simples: "fazemos um procedimento opcional de transfer\xEAncia do chip original do seu aparelho para manter todas as fun\xE7\xF5es 100% ativas e sem nenhuma mensagem de aviso no sistema". Este servi\xE7o de alta precis\xE3o \xE9 opcional e tem um custo adicional de aproximadamente R$ 150 sobre o valor da troca.
- Garantia de Qualidade Premium: Fa\xE7a quest\xE3o de enfatizar que todas as nossas telas e baterias utilizadas s\xE3o de alt\xEDssima qualidade Premium. N\xF3s somos uma empresa s\xE9ria e consolidada na regi\xE3o, por isso oferecemos total seguran\xE7a e garantias estendidas reais de 90 dias (3 meses), 180 dias (6 meses) ou at\xE9 360 dias (12 meses) dependendo da pe\xE7a selecionada pelo cliente. Garantia e zelo de verdade!
- Estrat\xE9gia de Pre\xE7os e Visita F\xEDsica (Crucial para Convers\xE3o): Quando o cliente perguntar sobre valores ou or\xE7amentos, utilize sempre a nossa estrat\xE9gia h\xEDbrida de vendas no WhatsApp:
  1. Gere valor primeiro: Destaque com entusiasmo a qualidade superior (Premium) da pe\xE7a, o alto zelo t\xE9cnico da nossa equipe especializada e a nossa garantia estendida de verdade.
  2. Informe a estimativa ou faixa de pre\xE7o de forma transparente (ex: 'A troca de tela premium para esse modelo de iPhone fica a partir de R$ 380, dependendo da marca final selecionada').
  3. Logo em seguida, explique que o diagn\xF3stico completo e o or\xE7amento definitivo s\xE3o realizados presencialmente no nosso laborat\xF3rio de forma 100% gratuita e sem nenhum compromisso.
  4. Conduza ativamente para a loja f\xEDsica: Convide e incentive o cliente de forma acolhedora a trazer o aparelho para avalia\xE7\xE3o ou a agendar um hor\xE1rio direto ('Gostaria de agendar um hor\xE1rio hoje ou prefere dar uma passada aqui \xE0 tarde para nosso t\xE9cnico avaliar gratuitamente para voc\xEA?'). As empresas s\xE9rias e de sucesso no mercado premium sempre priorizam construir essa rela\xE7\xE3o de confian\xE7a e atrair o cliente para o ambiente f\xEDsico da loja, onde a convers\xE3o do servi\xE7o \xE9 garantida!
- Limite de Vidros e Placas de PC: Se perguntarem especificamente sobre "troca de vidro" de tela ou "reparo de placa de notebook/computador", decline polidamente explicando que trabalhamos apenas com a substitui\xE7\xE3o do m\xF3dulo completo de tela (mencionando que estamos trazendo o maquin\xE1rio de vidro em breve) e que nossos reparos avan\xE7ados de placas l\xF3gicas por micro-soldagem s\xE3o focados exclusivamente na linha de smartphones (iPhone e Android).

Data e Hora Atual de Atendimento (Fuso Hor\xE1rio de Caruaru/PE, Brasil):
- Dia da semana: ${brazilTime.weekday}
- Data de hoje: ${brazilTime.date}
- Hor\xE1rio atual: ${brazilTime.time}
- Status de Funcionamento Atual da Loja F\xEDsica: ${brazilStatus.statusMessage}

Base de Conhecimento (Perguntas Frequentes / FAQs):
${faqText}

Diretrizes de Conversa\xE7\xE3o (MUITO IMPORTANTE):
1. Estilo Bate-Papo de WhatsApp: Fale de forma extremamente curta, fluida e natural, como um ser humano conversando de verdade. Evite respostas longas, explica\xE7\xF5es gigantescas ou apresenta\xE7\xF5es corporativas formais de uma s\xF3 vez.
2. Tamanho M\xE1ximo de Resposta: Cada mensagem enviada deve conter no m\xE1ximo 1 ou 2 par\xE1grafos curtos (e cada par\xE1grafo com apenas 1 a 2 linhas curtas). Seja o mais breve e sucinto poss\xEDvel!
3. Uma Coisa de Cada Vez: N\xE3o jogue toda a informa\xE7\xE3o ou todas as FAQs de uma vez. V\xE1 conduzindo a conversa aos poucos. Fa\xE7a perguntas para entender a real necessidade do cliente antes de explicar tudo.
4. Mem\xF3ria Recente: Preste muita aten\xE7\xE3o ao hist\xF3rico de mensagens anteriores. Se o cliente acabou de dizer o nome do aparelho, qual o problema ou o que ele deseja, d\xEA continuidade e jamais repita a mesma pergunta ou pe\xE7a para ele dizer novamente.
5. N\xE3o invente dados do aparelho: Se o cliente fornecer apenas a marca ou uma informa\xE7\xE3o incompleta do aparelho, nunca complete o modelo sozinho. Fa\xE7a uma pergunta curta de confirma\xE7\xE3o, como: "Perfeito, j\xE1 entendi a marca. Me diga o modelo completo do aparelho, por exemplo Xiaomi Note 12 4G.".
6. Se o cliente disser que n\xE3o sabe o modelo, n\xE3o tente fechar a venda nem presumir o aparelho. Mantenha a conversa objetiva, pe\xE7a o modelo ou ofere\xE7a outra forma de identificar o equipamento, como uma foto ou uma descri\xE7\xE3o breve.
7. Limite de Emojis: Use no m\xE1ximo 1 ou 2 emojis por mensagem para manter a conversa amig\xE1vel mas profissional.
8. Gerenciamento do Hor\xE1rio de Atendimento (MUITO CR\xCDTICO):
   O status atual de funcionamento da loja f\xEDsica \xE9: ${brazilStatus.statusMessage}.
   - Se o status indicar que a loja est\xE1 "FECHADA" (ou seja, hoje \xE9 Domingo, S\xE1bado fora do hor\xE1rio, ou dias de semana \xE0 noite/almo\xE7o):
     * Voc\xEA DEVE ser 100% transparente com o cliente. Logo nas primeiras mensagens, deixe absolutamente claro que a loja f\xEDsica est\xE1 FECHADA no momento ou que estamos fora do hor\xE1rio de expediente comercial.
     * Diga explicitamente algo amig\xE1vel como: "Ol\xE1! No momento nossa loja f\xEDsica est\xE1 fechada/fora do hor\xE1rio de atendimento, mas eu sou o assistente virtual da AndMicrocell e posso ir registrando todos os detalhes do seu aparelho para adiantar seu atendimento!"
     * Comunique com total clareza que, mesmo fora do hor\xE1rio de funcionamento comercial, voc\xEA est\xE1 ativo para dar andamento na conversa, coletar as informa\xE7\xF5es do aparelho e do problema t\xE9cnico para deixar tudo pronto no sistema.
     * Explique que assim que a equipe t\xE9cnica retornar no primeiro hor\xE1rio \xFAtil, eles analisar\xE3o tudo para resolver, ou que voc\xEA ir\xE1 verificar com a equipe a possibilidade de um t\xE9cnico de plant\xE3o prestar um suporte especial emergencial.
     * NUNCA d\xEA a entender que o atendimento presencial ou final est\xE1 ativo agora se estiver FECHADA. Deixe bem n\xEDtido que a loja est\xE1 fechada, mas que o assistente virtual (voc\xEA) resolve tudo por aqui e deixa engatilhado para os t\xE9cnicos.
   - Se o status indicar que a loja est\xE1 "ABERTA":
     * Siga com o atendimento normal de expediente comercial.
9. Honestidade e Seguran\xE7a: NUNCA invente informa\xE7\xF5es sobre pre\xE7os, servi\xE7os ou pol\xEDticas que n\xE3o estejam descritas acima. Se n\xE3o souber a resposta ou se o cliente fizer uma pergunta muito espec\xEDfica fora da base de conhecimento, pe\xE7a educadamente para ele aguardar um momento que um atendente humano ir\xE1 assumir o atendimento para dar todos os detalhes.
10. Responda sempre em Portugu\xEAs do Brasil.
11. Encerramento Objetivo da Conversa: Quando o cliente se despedir, agradecer ("Obrigado", "Valeu", "Tudo certo", "Entendido", "Tchau", "Boa noite", etc.) ou der sinais claros de que a d\xFAvida foi resolvida e o atendimento se encerrou, responda de forma final, extremamente direta, amig\xE1vel e objetiva. NUNCA fa\xE7a novas perguntas redundantes ("Posso ajudar em algo mais?") ou tente prolongar a conversa desnecessariamente. Apenas agrade\xE7a, deseje um excelente dia/noite ou agende um hor\xE1rio para ele trazer o aparelho, e encerre por ali.`;
  };
  app.post("/api/agent/chat", async (req, res) => {
    try {
      const { config, messages } = req.body;
      if (!config) {
        return res.status(400).json({ error: "Configura\xE7\xE3o do agente ausente." });
      }
      const systemPrompt = buildSystemInstruction(config);
      const latestUserMessage = messages[messages.length - 1]?.text || "";
      const lowCostReply = getLowCostInstantReply(latestUserMessage, config);
      if (lowCostReply) {
        return res.json({ text: sanitizeReplyText(lowCostReply) });
      }
      const recentMessages = Array.isArray(messages) ? messages.slice(-AI_CHAT_HISTORY_LIMIT) : [];
      const contents = recentMessages.map((m) => {
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
            maxOutputTokens: AI_CHAT_MAX_OUTPUT_TOKENS
          }
        );
        const replyText = finalizeReplyText(
          response.text || "Desculpe, n\xE3o entendi a sua mensagem. Poderia repetir?",
          latestUserMessage,
          config
        );
        return res.json({ text: replyText });
      } catch (geminiError) {
        console.warn("Gemini unavailable (/api/agent/chat):", geminiError.message);
        return res.status(503).json({
          error: "IA temporariamente indispon\xEDvel. Tente novamente em instantes.",
          code: "GEMINI_UNAVAILABLE"
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Erro interno no servidor." });
    }
  });
  app.post("/api/agent/review-reply", async (req, res) => {
    try {
      const { config, rating, comment, authorName } = req.body;
      if (!config) {
        return res.status(400).json({ error: "Configura\xE7\xE3o do agente ausente." });
      }
      const systemInstruction = `Voc\xEA \xE9 o propriet\xE1rio/gerente da empresa "${config.name}".
Voc\xEA est\xE1 respondendo a uma avalia\xE7\xE3o p\xFAblica deixada por um cliente chamado "${authorName}" no Google Meu Neg\xF3cio (Google Business Profile).
Ramo da empresa: ${config.category}
Tom de resposta: ${config.tone}

Instru\xE7\xF5es importantes:
1. Responda educadamente em Portugu\xEAs do Brasil.
2. Se a avalia\xE7\xE3o for boa (4-5 estrelas), agrade\xE7a imensamente, valorize o cliente e reforce a nossa dedica\xE7\xE3o \xE0 qualidade no segmento de ${config.category}.
3. Se a avalia\xE7\xE3o for m\xE9dia (3 estrelas), agrade\xE7a pelo feedback construtivo e coloque-se \xE0 disposi\xE7\xE3o para melhorar a experi\xEAncia.
4. Se a avalia\xE7\xE3o for ruim (1-2 estrelas), mantenha a compostura absoluta, pe\xE7a desculpas sinceras pelo inconveniente, mostre que nos importamos com feedbacks negativos e convide o cliente a entrar em contato diretamente pelo WhatsApp (${config.phone}) para que possamos resolver o problema pessoalmente. NUNCA seja reativo ou grosseiro.
5. N\xE3o utilize formata\xE7\xE3o complexa (como negritos em markdown), responda como uma mensagem direta de texto profissional e acolhedora.`;
      try {
        const client = getGeminiClient();
        const { response } = await generateContentWithModelFallback(
          client,
          AI_MODEL_REVIEW,
          `Cliente: ${authorName}
Nota: ${rating} estrelas
Coment\xE1rio: "${comment || "Sem coment\xE1rio escrito, apenas atribuiu estrelas"}"`,
          {
            systemInstruction,
            temperature: 0.5,
            maxOutputTokens: AI_REVIEW_MAX_OUTPUT_TOKENS
          }
        );
        const replyText = response.text || `Muito obrigado pela sua avalia\xE7\xE3o, ${authorName}! Ficamos felizes em te atender.`;
        return res.json({ reply: replyText });
      } catch (geminiError) {
        console.warn("Gemini unavailable (/api/agent/review-reply):", geminiError.message);
        return res.status(503).json({
          error: "IA temporariamente indispon\xEDvel. Tente novamente em instantes.",
          code: "GEMINI_UNAVAILABLE"
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Erro interno no servidor." });
    }
  });
  app.get("/api/config", async (req, res) => {
    const config = await getFirebaseConfig();
    if (config) {
      return res.json(config);
    }
    return res.status(404).json({ error: "Configura\xE7\xE3o n\xE3o encontrada" });
  });
  app.get("/api/tunnel", (req, res) => {
    try {
      const logPath = import_path.default.join(process.cwd(), "lt.log");
      if (import_fs.default.existsSync(logPath)) {
        const content = import_fs.default.readFileSync(logPath, "utf8");
        const match = content.match(/your url is: (https:\/\/[^\s]+)/i);
        if (match && match[1]) {
          return res.json({ url: match[1] });
        }
      }
      return res.json({ url: null });
    } catch (err) {
      return res.json({ url: null, error: err.message });
    }
  });
  const handlePrivacyRequest = async (req, res) => {
    const config = await getFirebaseConfig() || { name: "AndMicrocell - Assist\xEAncia T\xE9cnica" };
    const companyName = config.name || "AndMicrocell - Assist\xEAncia T\xE9cnica";
    const supportEmail = "suporte@andmicrocell.com.br";
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pol\xEDtica de Privacidade | ${companyName}</title>
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
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">Pol\xEDtica de Privacidade</h1>
        <p class="text-slate-500 text-sm mt-3">\xDAltima atualiza\xE7\xE3o: 7 de julho de 2026</p>
      </div>

      <div class="space-y-6 text-slate-600 leading-relaxed text-[15px]">
        <p>
          A presente Pol\xEDtica de Privacidade regula o tratamento de dados pessoais obtidos atrav\xE9s da nossa integra\xE7\xE3o com a API da Meta (WhatsApp Business API) para atendimento ao cliente da <strong>${companyName}</strong>. 
        </p>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">1. Informa\xE7\xF5es que Coletamos</h2>
          <p>
            Quando voc\xEA entra em contato conosco via WhatsApp, n\xF3s recebemos e processamos as seguintes informa\xE7\xF5es:
          </p>
          <ul class="list-disc list-inside pl-4 space-y-1">
            <li>N\xFAmero de telefone celular (ID de usu\xE1rio do WhatsApp);</li>
            <li>Nome de perfil p\xFAblico do WhatsApp;</li>
            <li>Conte\xFAdo das mensagens de texto e m\xEDdia enviadas para nossa conta corporativa.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">2. Como Utilizamos Seus Dados</h2>
          <p>
            Utilizamos suas informa\xE7\xF5es estritamente para as seguintes finalidades:
          </p>
          <ul class="list-disc list-inside pl-4 space-y-1">
            <li>Fornecer suporte t\xE9cnico e responder a d\xFAvidas sobre consertos e servi\xE7os;</li>
            <li>Automatizar respostas imediatas de atendimento ao cliente por meio do nosso assistente de Intelig\xEAncia Artificial baseado na tecnologia Google Gemini;</li>
            <li>Melhorar continuamente a qualidade do nosso atendimento.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">3. Compartilhamento de Dados</h2>
          <p>
            Os seus dados pessoais s\xE3o confidenciais. N\xF3s <strong>n\xE3o vendemos, alugamos ou comercializamos</strong> suas informa\xE7\xF5es para terceiros. O processamento dos dados \xE9 realizado de forma segura atrav\xE9s dos seguintes canais:
          </p>
          <ul class="list-disc list-inside pl-4 space-y-1">
            <li><strong>Meta Platforms, Inc.</strong>: Provedora da infraestrutura de comunica\xE7\xE3o do WhatsApp;</li>
            <li><strong>Google Cloud / Google Gemini API</strong>: Provedora dos servi\xE7os de intelig\xEAncia artificial de processamento de linguagem natural, operando em ambiente de servidor seguro que n\xE3o utiliza seus dados de atendimento para o treinamento p\xFAblico de modelos de IA.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">4. Armazenamento e Seguran\xE7a dos Dados</h2>
          <p>
            Todos os logs de conversa\xE7\xE3o e dados cadastrais s\xE3o armazenados em servidores seguros com criptografia de ponta e estrito controle de acesso, em total conformidade com a Lei Geral de Prote\xE7\xE3o de Dados Pessoais (LGPD).
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">5. Seus Direitos (Dele\xE7\xE3o e Consulta)</h2>
          <p>
            Como titular dos dados, voc\xEA possui o direito de solicitar a qualquer momento a confirma\xE7\xE3o de tratamento, o acesso aos dados, a corre\xE7\xE3o ou a <strong>exclus\xE3o definitiva dos seus dados pessoais e hist\xF3rico de conversas</strong> dos nossos sistemas de atendimento.
          </p>
          <p>
            Para exercer esses direitos ou em caso de d\xFAvidas, envie um e-mail para o nosso Encarregado de Prote\xE7\xE3o de Dados (DPO) atrav\xE9s do canal oficial: <a href="mailto:${supportEmail}" class="text-indigo-600 hover:underline font-medium">${supportEmail}</a>.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">6. Altera\xE7\xF5es nesta Pol\xEDtica</h2>
          <p>
            Podemos atualizar esta Pol\xEDtica de Privacidade de tempos em tempos. Recomendamos que voc\xEA a revise periodicamente nesta p\xE1gina.
          </p>
        </section>
      </div>
    </article>
  </main>

  <footer class="bg-slate-100 border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
    <div class="max-w-4xl mx-auto px-4">
      <p>&copy; 2026 ${companyName}. Todos os direitos reservados.</p>
      <p class="mt-1">Em total conformidade com a LGPD (Lei Geral de Prote\xE7\xE3o de Dados) e pol\xEDticas da Meta.</p>
    </div>
  </footer>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  };
  app.get("/privacy", handlePrivacyRequest);
  app.get("/politica", handlePrivacyRequest);
  app.get("/meta-icon.jpg", (req, res) => {
    const iconPath = import_path.default.join(process.cwd(), "src", "assets", "images", "andmicrocell_meta_icon_1783827325456.jpg");
    res.setHeader("Content-Type", "image/jpeg");
    res.sendFile(iconPath);
  });
  app.get("/meta-icon.png", (req, res) => {
    const iconPath = import_path.default.join(process.cwd(), "src", "assets", "images", "andmicrocell_meta_icon_png_1783828881971.jpg");
    res.setHeader("Content-Type", "image/png");
    res.sendFile(iconPath);
  });
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await getFirebasePosts();
      return res.json(posts);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
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
        const post = posts;
        if (!post.id) {
          post.id = `post-${Date.now()}`;
          post.publishedAt = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
          post.views = 0;
          post.readTime = `${Math.ceil((post.content || "").split(/\s+/).length / 200) || 3} min`;
        }
        await saveFirebasePost(post);
        return res.json({ success: true, post });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await deleteFirebasePost(id);
      return res.json({ success: true, message: "Post deletado com sucesso." });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/posts/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      if (db) {
        const postRef = (0, import_firestore.doc)(db, "posts", id);
        const snapshot = await (0, import_firestore.getDoc)(postRef);
        if (snapshot.exists()) {
          const currentData = snapshot.data();
          const updatedViews = (currentData.views || 0) + 1;
          await (0, import_firestore.updateDoc)(postRef, { views: updatedViews });
        }
      }
      const currentPosts = loadStoredPosts();
      const post = currentPosts.find((p) => p.id === id);
      if (post) {
        post.views = (post.views || 0) + 1;
        saveStoredPosts(currentPosts);
      }
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/posts/generate", async (req, res) => {
    try {
      const { topic, category } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "O tema do post \xE9 obrigat\xF3rio." });
      }
      const storedConfig = await getFirebaseConfig() || { name: "AndMicrocell" };
      const companyName = storedConfig.name || "AndMicrocell";
      const businessCategory = storedConfig.category || "Conserto de Smartphones, Notebooks e Venda de Acess\xF3rios";
      const systemInstruction = `Voc\xEA \xE9 um redator de tecnologia s\xEAnior, especialista em smartphones (celulares), tablets, notebooks (laptops) e assist\xEAncia t\xE9cnica de hardware e software.
Voc\xEA trabalha para a marca de assist\xEAncia t\xE9cnica "${companyName}", que \xE9 especializada em "${businessCategory}".

Sua tarefa \xE9 escrever um artigo de blog completo, cativante e de alta qualidade em Portugu\xEAs do Brasil baseado no tema enviado pelo usu\xE1rio.

REGRAS CR\xCDTICAS DE CONTEXTO E NICHO DE ATUA\xC7\xC3O:
1. SEMPRE adapte temas gen\xE9ricos ao nicho espec\xEDfico de smartphones (celulares), tablets e notebooks/laptops da empresa.
   - Exemplo: Se o tema ou t\xEDtulo sugerido for gen\xE9rico como "como limpar a tela do aparelho", "limpeza de tela", "manuten\xE7\xE3o de visor" ou "cuidados com a tela", voc\xEA DEVE focar EXCLUSIVAMENTE em telas de smartphones (celulares), tablets ou notebooks/laptops. NUNCA escreva sobre telas de TV, monitores de mesa, janelas de vidro ou outros tipos de aparelhos eletr\xF4nicos fora do nicho de assist\xEAncia.
   - Sempre interprete palavras como "aparelho", "dispositivo", "tela", "equipamento", "computador" ou "celular" de forma a focar estritamente no segmento de manuten\xE7\xE3o de celulares e laptops.
2. O conte\xFAdo deve ser altamente informativo, profissional e amig\xE1vel. D\xEA dicas \xFAteis e seguras para o usu\xE1rio (como usar pano de microfibra e \xE1lcool isoprop\xEDlico apropriado, alertar sobre o risco de \xE1lcool comum e \xE1gua que podem danificar o display de celulares ou notebooks).
3. No final do texto do conte\xFAdo (campo "content"), mencione sutilmente que se o leitor precisar de uma limpeza t\xE9cnica interna, troca de tela quebrada, troca de bateria, pel\xEDcula protetora de vidro ou qualquer outro reparo de hardware especializado em smartphones, notebooks ou tablets, ele pode contar com a equipe t\xE9cnica da ${companyName} para um diagn\xF3stico e or\xE7amento 100% gratuito.

O artigo deve estar formatado estritamente em formato JSON com os seguintes campos:
- title: Um t\xEDtulo atraente e otimizado para SEO.
- category: A categoria do post (ex: Dicas, Guias, Manuten\xE7\xE3o, Novidades).
- excerpt: Um resumo cativante de 1-2 frases para atrair o leitor na listagem.
- content: O conte\xFAdo completo do post. Use subt\xEDtulos em markdown (como ### Subt\xEDtulo), listas, negritos e par\xE1grafos bem espa\xE7ados. Deve ser informativo, amig\xE1vel e focado em dar solu\xE7\xF5es reais ou curiosidades para o leitor, mencionando sutilmente os servi\xE7os da ${companyName} no final de forma acolhedora.

IMPORTANTE: Retorne APENAS o objeto JSON v\xE1lido, sem cercas de c\xF3digo (markdown fences) como \`\`\`json ou qualquer outro texto explicativo fora do JSON.`;
      const prompt = `Tema/T\xEDtulo solicitado pelo propriet\xE1rio: "${topic}"${category ? `
Categoria sugerida: "${category}"` : ""}`;
      try {
        const client = getGeminiClient();
        const { response } = await generateContentWithModelFallback(
          client,
          AI_MODEL_CONTENT,
          [{ role: "user", parts: [{ text: prompt }] }],
          {
            systemInstruction,
            temperature: 0.8
          }
        );
        let text = response.text || "";
        text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        const postData = JSON.parse(text);
        const titleVal = postData.title || postData.titulo || topic || "Nova Publica\xE7\xE3o";
        const categoryVal = postData.category || postData.categoria || category || "Dicas";
        const excerptVal = postData.excerpt || postData.resumo || "";
        const contentVal = postData.content || postData.conteudo || "";
        postData.title = titleVal;
        postData.category = categoryVal;
        postData.excerpt = excerptVal;
        postData.content = contentVal;
        postData.id = `post-${Date.now()}`;
        postData.slug = titleVal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
        postData.publishedAt = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        postData.views = 0;
        postData.readTime = `${Math.ceil(contentVal.split(/\s+/).length / 200) || 3} min`;
        const getRelevantCoverImage = (title, categoryName) => {
          const combined = (title + " " + categoryName).toLowerCase();
          if (combined.includes("bateria") || combined.includes("saude") || combined.includes("sa\xFAde") || combined.includes("carreg") || combined.includes("ciclo") || combined.includes("carga")) {
            return "https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=800&auto=format&fit=crop";
          }
          if (combined.includes("tela") || combined.includes("display") || combined.includes("vidro") || combined.includes("trinc") || combined.includes("quebr") || combined.includes("touch") || combined.includes("risco")) {
            return "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop";
          }
          if (combined.includes("\xE1gua") || combined.includes("agua") || combined.includes("liqui") || combined.includes("l\xEDqui") || combined.includes("molhad") || combined.includes("umid")) {
            return "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=800&auto=format&fit=crop";
          }
          if (combined.includes("notebook") || combined.includes("laptop") || combined.includes("macbook") || combined.includes("computador") || combined.includes("teclado")) {
            return "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop";
          }
          if (combined.includes("placa") || combined.includes("circuito") || combined.includes("solda") || combined.includes("micro-solda") || combined.includes("curto") || combined.includes("reparo") || combined.includes("conserto")) {
            return "https://images.unsplash.com/photo-1601524909162-be87252be298?w=800&auto=format&fit=crop";
          }
          if (combined.includes("acess\xF3rio") || combined.includes("acessorio") || combined.includes("capinh") || combined.includes("pelicul") || combined.includes("fone") || combined.includes("carregador")) {
            return "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=800&auto=format&fit=crop";
          }
          return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop";
        };
        postData.coverImage = getRelevantCoverImage(titleVal, categoryVal);
        return res.json({ success: true, post: postData });
      } catch (geminiError) {
        console.warn("Gemini unavailable (/api/posts/generate):", geminiError.message);
        return res.status(503).json({
          success: false,
          error: "IA temporariamente indispon\xEDvel. Tente novamente em instantes.",
          code: "GEMINI_UNAVAILABLE"
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Erro interno na gera\xE7\xE3o por IA." });
    }
  });
  app.post("/api/posts/ideas", async (req, res) => {
    try {
      const { category } = req.body;
      const targetCategory = category || "Todas";
      const storedConfig = await getFirebaseConfig() || { name: "AndMicrocell" };
      const companyName = storedConfig.name || "AndMicrocell";
      const businessCategory = storedConfig.category || "Conserto de Smartphones, Notebooks e Venda de Acess\xF3rios";
      const systemInstruction = `Voc\xEA \xE9 um analista de tend\xEAncias de tecnologia s\xEAnior especializado em marketing de conte\xFAdo para assist\xEAncia t\xE9cnica de smartphones, tablets e notebooks.
Sua miss\xE3o \xE9 gerar uma lista de 5 temas/ideias de posts/artigos de blog altamente atraentes e relevantes baseados na categoria de filtro solicitada pelo usu\xE1rio (Dicas, Guias, Manuten\xE7\xE3o, Novidades ou Todas).

Voc\xEA trabalha para a marca de assist\xEAncia t\xE9cnica "${companyName}", que atua no segmento de "${businessCategory}".

As ideias devem ser focadas em problemas comuns de usu\xE1rios, novidades do mundo mobile/laptops ou guias passo a passo instrutivos, sempre voltados para levar o leitor a compreender a import\xE2ncia de um t\xE9cnico qualificado.

O resultado deve ser um array JSON contendo exatamente 5 objetos, cada um com as seguintes propriedades:
- title: O t\xEDtulo sugerido do post (curto, intrigante e atrativo, ex: "Como salvar seu celular ap\xF3s cair no vaso sanit\xE1rio").
- category: A categoria (Dicas, Guias, Manuten\xE7\xE3o ou Novidades).
- source: Uma fonte fict\xEDcia realista de onde vem essa tend\xEAncia de pesquisa (ex: "Tend\xEAncia Google Trends", "Foco T\xE9cnico", "TechTudo Alerta", "Dica De Olho", "Tend\xEAncia Nacional").
- icon: Um emoji representativo apropriado (ex: "\u{1F50B}", "\u{1F52C}", "\u{1F4A7}", "\u26A1", "\u{1F4F1}", "\u{1F4BB}", "\u{1F525}", "\u2699\uFE0F", "\u{1F6E0}\uFE0F").

IMPORTANTE: Retorne APENAS o array JSON v\xE1lido, sem cercas de c\xF3digo (markdown fences) como \`\`\`json ou qualquer outro texto explicativo fora do JSON.`;
      const prompt = `Filtro de categoria solicitado: "${targetCategory}". Por favor, sugira 5 temas excelentes e atuais para o blog da ${companyName}.`;
      try {
        const client = getGeminiClient();
        const { response } = await generateContentWithModelFallback(
          client,
          AI_MODEL_CONTENT,
          [{ role: "user", parts: [{ text: prompt }] }],
          {
            systemInstruction,
            temperature: 0.8
          }
        );
        let text = response.text || "";
        text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        const ideas = JSON.parse(text);
        if (Array.isArray(ideas)) {
          return res.json({ success: true, ideas });
        }
        throw new Error("Invalid output format from Gemini");
      } catch (geminiError) {
        console.warn("Gemini unavailable (/api/posts/ideas):", geminiError.message);
        return res.status(503).json({
          success: false,
          error: "IA temporariamente indispon\xEDvel. Tente novamente em instantes.",
          code: "GEMINI_UNAVAILABLE"
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Erro ao buscar novas ideias de post." });
    }
  });
  app.post("/api/config", async (req, res) => {
    try {
      const config = req.body;
      await saveFirebaseConfig(config);
      return res.json({ success: true, message: "Configura\xE7\xE3o salva com sucesso no servidor." });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/webhook/logs", (req, res) => {
    return res.json(webhookLogs);
  });
  app.post("/api/webhook/logs/verbose", (req, res) => {
    try {
      const enable = req.body?.enable;
      setVerboseLogs(!!enable);
      return res.json({ success: true, verboseLogs });
    } catch (e) {
      return res.status(500).json({ error: e.message || String(e) });
    }
  });
  app.post("/api/webhook/logs/clear", (req, res) => {
    webhookLogs = [
      { id: `wlog-${Date.now()}`, timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR"), direction: "system", message: "Logs de Webhook limpos", details: "Monitor redefinido" }
    ];
    return res.json({ success: true });
  });
  app.post("/api/webhook/reset", async (req, res) => {
    try {
      const { fromNumber } = req.body || {};
      await clearWhatsAppHistory(fromNumber);
      return res.json({
        success: true,
        message: fromNumber ? `Hist\xF3rico limpo para ${fromNumber}.` : "Hist\xF3rico de WhatsApp limpo e cache de deduplica\xE7\xE3o reiniciado."
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Erro ao limpar o hist\xF3rico." });
    }
  });
  app.get("/api/webhook/whatsapp", async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const storedConfig = await getFirebaseConfig();
    const verifyToken = storedConfig?.whatsappVerifyToken || "zetachat_secret_token";
    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook WhatsApp verificado com sucesso!");
      addWebhookLog("system", "Webhook verificado com sucesso pelo Meta Portal", `Token de verifica\xE7\xE3o correspondente: ${verifyToken}`);
      res.set("Content-Type", "text/plain");
      return res.status(200).send(String(challenge));
    } else {
      console.warn("Falha na verifica\xE7\xE3o do Webhook. Token incorreto.");
      addWebhookLog("error", "Falha de verifica\xE7\xE3o do Webhook pelo Meta", `Token enviado: ${token || "Nenhum"}. Esperado: ${verifyToken}`);
      return res.sendStatus(403);
    }
  });
  app.post("/api/webhook/whatsapp", async (req, res) => {
    try {
      const body = req.body;
      verboseLog("debug", "Webhook POST received", JSON.stringify({ entry: body.entry?.length ? body.entry[0].changes?.[0]?.value?.messages?.[0] : {} }).slice(0, 1e3));
      verboseLog("debug", "Webhook headers snapshot", JSON.stringify({ headers: req.headers }).slice(0, 1e3));
      try {
        verboseLog("debug", "Webhook body length", String(JSON.stringify(body).length));
      } catch (e) {
      }
      const entries = Array.isArray(body.entry) ? body.entry : [];
      let value = null;
      let message = null;
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
        return res.status(200).send("EVENT_RECEIVED");
      }
      const fromNumber = message.from;
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
        addWebhookLog("system", `Resposta recente ignorada`, `Mensagem duplicada ou retry detectado para ${fromNumber}.`);
        return res.status(200).send("EVENT_RECEIVED");
      }
      if (processedMessageIds.has(messageId)) {
        console.log(`[Deduplication] Message ${messageId} already processed or currently processing (in-memory). Ignoring retry.`);
        return res.status(200).send("EVENT_RECEIVED");
      }
      processedMessageIds.add(messageId);
      if (processedMessageIds.size > 1e3) {
        const firstItem = processedMessageIds.values().next().value;
        if (firstItem) processedMessageIds.delete(firstItem);
      }
      res.status(200).send("EVENT_RECEIVED");
      (async () => {
        try {
          const existingLock = processingLocks.get(fromNumber);
          if (existingLock && Date.now() - existingLock < PROCESSING_LOCK_MS) {
            console.info(`[Webhook] skipped by processing lock from=${fromNumber}`);
            addWebhookLog("system", `Ignorando processamento concorrente`, `H\xE1 um processamento ativo recente para ${fromNumber}. Evitando resposta duplicada.`);
            if (messageId && db) {
              try {
                await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "processed_messages", messageId), { processedAt: (/* @__PURE__ */ new Date()).toISOString(), concurrentIgnored: true });
              } catch (e) {
              }
            }
            return;
          }
          processingLocks.set(fromNumber, Date.now());
          if (messageType !== "text" || !messageText) {
            console.info(`[Webhook] skipped non-text message from=${fromNumber} type=${messageType}`);
            addWebhookLog("system", `Mensagem ignorada de ${customerName}`, `Tipo de mensagem recebida: ${messageType}. Apenas mensagens de texto n\xE3o vazias s\xE3o processadas automaticamente.`);
            if (messageId && db) {
              try {
                await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "processed_messages", messageId), { processedAt: (/* @__PURE__ */ new Date()).toISOString() });
              } catch (e) {
              }
            }
            return;
          }
          if (isWhatsAppUninterested(messageText)) {
            console.info(`[Webhook] skipped uninterested contact from=${fromNumber}`);
            addWebhookLog("system", `Contato n\xE3o qualificado`, `Usu\xE1rio de ${fromNumber} indicou falta de interesse: "${messageText}". Pulando resposta de IA.`);
            if (messageId && db) {
              try {
                await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "processed_messages", messageId), { processedAt: (/* @__PURE__ */ new Date()).toISOString(), fromNumber, customerName, messageText, uninterested: true });
              } catch (e) {
              }
            }
            return;
          }
          const storedConfig = await getFirebaseConfig();
          if (!storedConfig) {
            addWebhookLog("error", `Falha ao processar mensagem`, `Configura\xE7\xE3o da empresa ausente no servidor. Configure os dados no painel.`);
            return;
          }
          const businessPhoneNumber = value?.metadata?.display_phone_number;
          const normalizedFrom = fromNumber ? String(fromNumber).replace(/\D/g, "") : "";
          const normalizedBusiness = businessPhoneNumber ? String(businessPhoneNumber).replace(/\D/g, "") : "";
          const normalizedConfigPhone = storedConfig?.phone ? String(storedConfig.phone).replace(/\D/g, "") : "";
          const isOwnNumber = normalizedBusiness && normalizedFrom === normalizedBusiness || normalizedConfigPhone && normalizedFrom.slice(-8) === normalizedConfigPhone.slice(-8);
          if (isOwnNumber) {
            console.log(`[Loop Prevention] Message is from the business's own number (${fromNumber}). Ignoring to prevent infinite response loop.`);
            addWebhookLog("system", `Mensagem do n\xFAmero pr\xF3prio ignorada`, `Evitando loop de auto-resposta para o pr\xF3prio n\xFAmero da empresa (${fromNumber}).`);
            if (messageId && db) {
              try {
                await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "processed_messages", messageId), { processedAt: (/* @__PURE__ */ new Date()).toISOString() });
              } catch (e) {
              }
            }
            return;
          }
          const incomingPhoneNumberId = value?.metadata?.phone_number_id;
          const { whatsappAccessToken, whatsappPhoneNumberId } = storedConfig;
          if (whatsappPhoneNumberId && incomingPhoneNumberId && String(whatsappPhoneNumberId).trim() !== String(incomingPhoneNumberId).trim()) {
            console.info(`[Webhook] skipped by phone_number_id mismatch incoming=${incomingPhoneNumberId} configured=${whatsappPhoneNumberId}`);
            addWebhookLog("system", `Mensagem recebida para o ID de Telefone ${incomingPhoneNumberId} ignorada`, `O servidor est\xE1 configurado para responder apenas ao ID ${whatsappPhoneNumberId}. Isso evita conflitos com o n\xFAmero de teste ou outros n\xFAmeros da conta.`);
            console.log(`Webhook ignored: incoming phone_number_id (${incomingPhoneNumberId}) does not match configured ID (${whatsappPhoneNumberId})`);
            if (messageId && db) {
              try {
                await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "processed_messages", messageId), { processedAt: (/* @__PURE__ */ new Date()).toISOString() });
              } catch (e) {
              }
            }
            return;
          }
          if (storedConfig.autoRespondWhatsApp === false || storedConfig.autoRespondWhatsApp === "false") {
            console.info(`[Webhook] skipped because autoRespondWhatsApp=false from=${fromNumber}`);
            addWebhookLog("system", `Mensagem recebida de ${customerName}, mas Auto-Resposta est\xE1 desativada`, `O rob\xF4 n\xE3o responder\xE1 automaticamente no momento porque o Auto-WhatsApp est\xE1 desativado no painel.`);
            if (messageId && db) {
              try {
                await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "processed_messages", messageId), { processedAt: (/* @__PURE__ */ new Date()).toISOString() });
              } catch (e) {
              }
            }
            return;
          }
          if (messageId) {
            const claimed = await claimProcessedMessage(messageId, {
              fromNumber,
              customerName,
              messageText: messageText || ""
            });
            if (!claimed) {
              console.info(`[Webhook] skipped by atomic messageId claim id=${messageId}`);
              addWebhookLog("system", `Mensagem duplicada ignorada (claim at\xF4mico)`, `MessageId j\xE1 processado: ${messageId}`);
              return;
            }
          }
          const fingerprintClaimed = await claimInboundFingerprint(fromNumber, messageText);
          if (!fingerprintClaimed) {
            console.info(`[Webhook] skipped by content fingerprint from=${fromNumber}`);
            addWebhookLog("system", `Mensagem duplicada por conte\xFAdo ignorada`, `Fingerprint repetido em janela curta para ${fromNumber}.`);
            return;
          }
          addWebhookLog("inbound", `Mensagem recebida de ${customerName} (${fromNumber})`, messageText);
          if (whatsappAccessToken && whatsappPhoneNumberId && messageId) {
            try {
              await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${whatsappAccessToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  status: "read",
                  message_id: messageId
                })
              });
            } catch (readErr) {
              console.warn("Failed to mark message as read:", readErr.message);
            }
          }
          const systemInstruction = buildSystemInstruction(storedConfig);
          const historyData = await getWhatsAppHistory(fromNumber);
          const history = Array.isArray(historyData) ? historyData.slice(-AI_CHAT_HISTORY_LIMIT) : [];
          const contents = history.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }]
          }));
          contents.push({
            role: "user",
            parts: [{ text: messageText }]
          });
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
                  maxOutputTokens: AI_CHAT_MAX_OUTPUT_TOKENS
                }
              );
              replyText = response.text || "Ol\xE1! Desculpe, n\xE3o entendi.";
            } catch (geminiError) {
              console.error(`[Webhook] Gemini failure from=${fromNumber}:`, geminiError.message || geminiError);
              addWebhookLog("error", "Falha no Gemini", `N\xFAmero: ${fromNumber}. Motivo: ${geminiError.message}`);
              replyText = "Tive uma instabilidade r\xE1pida aqui. Me confirma, por favor, o modelo do aparelho e o defeito para eu continuar seu atendimento agora.";
            }
          }
          replyText = finalizeReplyText(replyText, messageText, storedConfig);
          const dedupKey = `${fromNumber}:${normalizeForDedup(messageText)}`;
          recentReplyCache.set(dedupKey, { timestamp: Date.now(), replyText });
          if (recentReplyCache.size > MAX_REPLY_CACHE_ENTRIES) {
            const oldestKey = recentReplyCache.keys().next().value;
            if (oldestKey) recentReplyCache.delete(oldestKey);
          }
          verboseLog("debug", `Prepared reply for ${fromNumber}`, String(replyText).slice(0, 300));
          try {
            const simpleHash = (s) => require("crypto").createHash("sha1").update(s).digest("hex").slice(0, 8);
            verboseLog("debug", `Reply/Incoming hashes`, `in:${simpleHash(messageText || "")} out:${simpleHash(replyText || "")}`);
          } catch (e) {
          }
          try {
            if (db) {
              const persistent = await getPersistentLastReply(fromNumber);
              if (persistent && persistent.replyText) {
                const persistentTs = Date.parse(persistent.timestamp || "") || 0;
                if (Date.now() - persistentTs < REPLY_SIMILARITY_GUARD_MS && areRepliesSimilar(persistent.replyText, replyText)) {
                  addWebhookLog("system", `Envio evitado \u2014 resposta similar j\xE1 enviada (persistente)`, `N\xFAmero: ${fromNumber}. Resposta anterior persistente: ${String(persistent.replyText).slice(0, 120)}`);
                  lastReplyByNumber.set(fromNumber, { timestamp: Date.now(), replyText: persistent.replyText });
                  return;
                }
              }
            }
          } catch (e) {
            console.error("Error checking persistent last reply:", e.message || e);
          }
          const lastEntry = lastReplyByNumber.get(fromNumber);
          if (lastEntry && Date.now() - lastEntry.timestamp < REPLY_SIMILARITY_GUARD_MS && areRepliesSimilar(lastEntry.replyText, replyText)) {
            addWebhookLog("system", `Envio evitado \u2014 resposta similar j\xE1 enviada`, `N\xFAmero: ${fromNumber}. Resposta anterior: ${String(lastEntry.replyText).slice(0, 120)}`);
            lastReplyByNumber.set(fromNumber, { timestamp: Date.now(), replyText: lastEntry.replyText });
            return;
          }
          const lastModelEntry = [...history].reverse().find((m) => m?.role === "model" && m?.text);
          if (lastModelEntry) {
            const lastModelTs = Date.parse(lastModelEntry.timestamp || "") || 0;
            if (Date.now() - lastModelTs < REPLY_SIMILARITY_GUARD_MS && areRepliesSimilar(String(lastModelEntry.text || ""), replyText)) {
              addWebhookLog("system", `Envio evitado \u2014 resposta similar detectada no hist\xF3rico`, `N\xFAmero: ${fromNumber}. \xDAltima resposta: ${String(lastModelEntry.text).slice(0, 120)}`);
              return;
            }
          }
          const updatedHistory = [
            ...history,
            { role: "user", text: messageText, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
            { role: "model", text: replyText, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
          ];
          await saveWhatsAppHistory(fromNumber, updatedHistory);
          addWebhookLog("outbound", `Resposta gerada pela IA`, replyText);
          if (whatsappAccessToken && whatsappPhoneNumberId) {
            try {
              lastReplyByNumber.set(fromNumber, { timestamp: Date.now(), replyText });
              if (db) {
                await setPersistentLastReply(fromNumber, replyText);
              }
            } catch (reserveErr) {
              verboseLog("debug", "Error reserving last reply before send", reserveErr?.message || String(reserveErr));
            }
            const simulatedTypingMs = Math.min(Math.max(1500, replyText.length * 18), 4500);
            addWebhookLog("system", `Simulando digita\xE7\xE3o do atendente`, `Aguardando ${simulatedTypingMs}ms antes de enviar para imitar a digita\xE7\xE3o humana.`);
            await new Promise((resolve) => setTimeout(resolve, simulatedTypingMs));
            try {
              const fbResponse = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${whatsappAccessToken}`,
                  "Content-Type": "application/json"
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
                addWebhookLog("system", `Mensagem oficial enviada via API do WhatsApp`, `Mensagem enviada com sucesso para ${fromNumber}. ID: ${fbResult.messages?.[0]?.id || "N/A"}`);
                try {
                  lastReplyByNumber.set(fromNumber, { timestamp: Date.now(), replyText });
                  verboseLog("debug", `Persisting last reply for ${fromNumber}`, String(replyText).slice(0, 300));
                  if (db) {
                    await setPersistentLastReply(fromNumber, replyText);
                  }
                } catch (e) {
                  verboseLog("debug", "Error persisting last reply", String(e));
                }
              } else {
                console.error(`[Webhook] WhatsApp API send failure to=${fromNumber}:`, JSON.stringify(fbResult));
                addWebhookLog("error", `Falha ao enviar mensagem via API do WhatsApp`, JSON.stringify(fbResult));
              }
            } catch (fetchError) {
              console.error(`[Webhook] request error while sending to=${fromNumber}:`, fetchError.message || fetchError);
              addWebhookLog("error", `Erro na requisi\xE7\xE3o para a API do WhatsApp`, fetchError.message);
            }
          } else {
            addWebhookLog("system", `Mensagem de IA pronta, mas envio oficial desativado`, `Insira as credenciais do WhatsApp Cloud API no painel de Integra\xE7\xE3o para enviar respostas oficiais diretamente.`);
          }
        } finally {
          try {
            processingLocks.delete(fromNumber);
          } catch (e) {
          }
        }
      })().catch((asyncErr) => {
        console.error("Critical error in async background webhook processing:", asyncErr);
        addWebhookLog("error", `Erro cr\xEDtico no processamento ass\xEDncrono`, asyncErr.message);
      });
    } catch (err) {
      console.error("Error in whatsapp webhook post:", err);
      addWebhookLog("error", `Erro cr\xEDtico no processamento do Webhook`, err.message);
      try {
        res.status(500).send("INTERNAL_SERVER_ERROR");
      } catch (e) {
      }
    }
  });
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      time: /* @__PURE__ */ new Date(),
      appVersion: APP_VERSION,
      dedupe: {
        inboundFingerprintCooldownMs: INBOUND_FINGERPRINT_COOLDOWN_MS,
        replySimilarityGuardMs: REPLY_SIMILARITY_GUARD_MS
      }
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  if (String(process.env.RESET_WHATSAPP_HISTORY_ON_BOOT || "false").toLowerCase() === "true") {
    await clearWhatsAppHistory();
    console.warn("WhatsApp history was reset on boot because RESET_WHATSAPP_HISTORY_ON_BOOT=true");
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (http://localhost:${PORT})`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
