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
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_fs2 = __toESM(require("fs"), 1);
var import_app = require("firebase/app");

// src/env.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
function loadRuntimeEnv() {
  const envFiles = [
    import_path.default.resolve(process.cwd(), ".env.local"),
    import_path.default.resolve(process.cwd(), ".env")
  ];
  for (const envFile of envFiles) {
    if (import_fs.default.existsSync(envFile)) {
      import_dotenv.default.config({ path: envFile, override: false });
    }
  }
  return process.env;
}

// server.ts
var import_firestore = require("firebase/firestore");

// src/audio-transcription.ts
function normalizeAudioBase64(audioBase64) {
  if (!audioBase64) return "";
  const withoutPrefix = audioBase64.replace(/^data:audio\/[a-zA-Z0-9.-]+(?:;[a-zA-Z0-9.-=]+)*;base64,/, "");
  return withoutPrefix.replace(/^data:audio\/[a-zA-Z0-9.-]+;base64,/, "");
}
function normalizeMimeType(mimeType) {
  if (!mimeType) return "audio/webm";
  const normalized = mimeType.split(";")[0].trim().toLowerCase();
  if (normalized === "audio/opus" || normalized === "audio/oga" || normalized === "application/ogg" || normalized === "video/ogg") {
    return "audio/ogg";
  }
  if (normalized === "audio/x-m4a" || normalized === "audio/m4a") {
    return "audio/mp4";
  }
  if (normalized === "audio/mpeg") {
    return "audio/mp3";
  }
  if (normalized.startsWith("audio/")) {
    return normalized;
  }
  return "audio/webm";
}

// server.ts
loadRuntimeEnv();
process.on("uncaughtException", (err) => {
  console.error(" [FATAL] Uncaught Exception absorvida pelo servidor:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error(" [FATAL] Unhandled Rejection absorvida pelo servidor:", reason);
});
var resolvedFilename = typeof __filename !== "undefined" ? __filename : process.cwd();
var resolvedDirname = typeof __dirname !== "undefined" ? __dirname : process.cwd();
var webhookLogs = [
  { id: "init-log-1", timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR"), direction: "system", message: "Sistema de Webhook Oficial Inicializado", details: "Aguardando requisi\xE7\xF5es do Meta Developer Portal" }
];
var addWebhookLog = (direction, message, details) => {
  const newLog = {
    id: `wlog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR"),
    direction,
    message,
    details
  };
  webhookLogs = [newLog, ...webhookLogs.slice(0, 99)];
  if (db) {
    (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "webhook_logs", newLog.id), {
      ...newLog,
      createdAtMs: Date.now()
    }).catch((e) => {
      console.warn("Failed to persist webhook log to Firestore:", e.message);
    });
  }
};
var configDir = import_path2.default.join(process.cwd(), "data");
var configFilePath = import_path2.default.join(configDir, "config.json");
var postsFilePath = import_path2.default.join(configDir, "posts.json");
function ensureConfigDir() {
  if (!import_fs2.default.existsSync(configDir)) {
    import_fs2.default.mkdirSync(configDir, { recursive: true });
  }
}
function loadStoredPosts() {
  ensureConfigDir();
  if (import_fs2.default.existsSync(postsFilePath)) {
    try {
      return JSON.parse(import_fs2.default.readFileSync(postsFilePath, "utf8"));
    } catch (e) {
      console.error("Error reading posts file:", e);
    }
  }
  return [];
}
function saveStoredPosts(posts) {
  ensureConfigDir();
  try {
    import_fs2.default.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing posts file:", e);
  }
}
function loadStoredConfig() {
  ensureConfigDir();
  if (import_fs2.default.existsSync(configFilePath)) {
    try {
      return JSON.parse(import_fs2.default.readFileSync(configFilePath, "utf8"));
    } catch (e) {
      console.error("Error reading config file:", e);
    }
  }
  return null;
}
function saveStoredConfig(config) {
  ensureConfigDir();
  try {
    import_fs2.default.writeFileSync(configFilePath, JSON.stringify(config, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing config file:", e);
  }
}
var db = null;
try {
  let firebaseConfig = null;
  const firebaseConfigPath = import_path2.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs2.default.existsSync(firebaseConfigPath)) {
    try {
      firebaseConfig = JSON.parse(import_fs2.default.readFileSync(firebaseConfigPath, "utf8"));
      console.log("Firebase config loaded successfully from firebase-applet-config.json");
    } catch (parseErr) {
      console.error("Failed to parse firebase-applet-config.json:", parseErr.message);
    }
  }
  if (!firebaseConfig) {
    const envApiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
    const envProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const envAppId = process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID;
    if (envApiKey && envProjectId && envAppId) {
      firebaseConfig = {
        apiKey: envApiKey,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
        projectId: envProjectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.firebasestorage.app`,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: envAppId,
        firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.DATABASE_ID
      };
      console.log("Firebase config loaded from environment variables");
    }
  }
  if (firebaseConfig) {
    const firebaseApp = (0, import_app.initializeApp)({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId
    });
    const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
    db = (0, import_firestore.getFirestore)(firebaseApp, databaseId);
    console.log("Firebase Firestore initialized successfully in server with Database ID:", databaseId);
  } else {
    console.warn("No Firebase configuration found (neither firebase-applet-config.json nor environment variables are set). Falling back to local files.");
  }
} catch (e) {
  console.error("Failed to initialize Firebase:", e.message);
}
async function getFirebaseConfig() {
  const localConfig = loadStoredConfig() || {};
  if (db) {
    try {
      const configDocRef = (0, import_firestore.doc)(db, "config", "business");
      const snapshot = await (0, import_firestore.getDoc)(configDocRef);
      if (snapshot.exists()) {
        const firestoreData = snapshot.data();
        return {
          ...localConfig,
          ...firestoreData,
          chatwootApiAccessToken: (firestoreData.chatwootApiAccessToken || localConfig.chatwootApiAccessToken || "Q1DpLpBXSGYWVP7VGunkEkwL").trim(),
          chatwootUrl: (firestoreData.chatwootUrl || localConfig.chatwootUrl || "https://atendimento.andmicrocell.com.br").trim()
        };
      }
    } catch (e) {
      console.error("Error reading config from Firestore:", e.message);
    }
  }
  return localConfig;
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
      if (localConfig && (localConfig.phone !== firestoreConfig.phone || localConfig.name !== firestoreConfig.name || localConfig.address !== firestoreConfig.address || localConfig.category !== firestoreConfig.category || localConfig.chatwootApiAccessToken && localConfig.chatwootApiAccessToken !== firestoreConfig.chatwootApiAccessToken || localConfig.chatwootUrl && localConfig.chatwootUrl !== firestoreConfig.chatwootUrl)) {
        console.log("Local config differs from Firestore. Syncing local changes (including Chatwoot token/URL) to Firestore...");
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
async function downloadAudio(rawUrl, baseUrl, apiToken) {
  if (!rawUrl) {
    throw new Error("URL de \xE1udio n\xE3o fornecida.");
  }
  let targetUrl = rawUrl.trim();
  if (targetUrl.startsWith("/")) {
    const cleanBase = (baseUrl || "https://atendimento.andmicrocell.com.br").replace(/\/+$/, "");
    targetUrl = `${cleanBase}${targetUrl}`;
  }
  console.log(`[Audio Downloader] Baixando de: ${targetUrl}`);
  const isExternalStorage = /^https?:\/\/[^\/]*(s3[.-]|amazonaws\.com|cloudflarestorage\.com|storage\.googleapis\.com|digitaloceanspaces\.com|backblazeb2\.com)/i.test(targetUrl);
  if (isExternalStorage) {
    console.log(`[Audio Downloader] Link direto de armazenamento (S3/Cloud). Baixando sem headers extras...`);
    try {
      const res2 = await fetch(targetUrl);
      if (res2.ok) {
        const arrayBuffer2 = await res2.arrayBuffer();
        return Buffer.from(arrayBuffer2);
      }
    } catch (e) {
      console.warn(`[Audio Downloader] Falha ao baixar diretamente do S3: ${e.message}`);
    }
  }
  const headers = {};
  if (apiToken) {
    headers["api-access-token"] = apiToken;
  }
  let res = await fetch(targetUrl, { headers });
  if (!res.ok) {
    console.warn(`[Audio Downloader] Falha ao baixar com token da API (Status ${res.status}). Tentando sem headers...`);
    res = await fetch(targetUrl);
  }
  if (!res.ok && apiToken) {
    console.warn(`[Audio Downloader] Tentando com cabe\xE7alho Bearer...`);
    res = await fetch(targetUrl, {
      headers: { "Authorization": `Bearer ${apiToken}` }
    });
  }
  if (!res.ok) {
    throw new Error(`N\xE3o foi poss\xEDvel baixar o arquivo de \xE1udio. Status retornado: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
async function getWhatsAppHistory(fromNumber) {
  const cleanNumber = String(fromNumber).replace(/\D/g, "");
  if (!cleanNumber) return [];
  if (db) {
    try {
      const historyDocRef = (0, import_firestore.doc)(db, "whatsapp_history", cleanNumber);
      const snapshot = await (0, import_firestore.getDoc)(historyDocRef);
      if (snapshot.exists()) {
        const messages = snapshot.data().messages || [];
        try {
          ensureConfigDir();
          const historyFilePath = import_path2.default.join(configDir, `history_${cleanNumber}.json`);
          import_fs2.default.writeFileSync(historyFilePath, JSON.stringify({ messages }, null, 2), "utf8");
        } catch (e) {
        }
        inMemoryHistoryCache[cleanNumber] = messages;
        return messages;
      }
    } catch (e) {
      console.error(`Error reading WhatsApp history from Firestore for ${cleanNumber}:`, e.message);
    }
  }
  try {
    ensureConfigDir();
    const historyFilePath = import_path2.default.join(configDir, `history_${cleanNumber}.json`);
    if (import_fs2.default.existsSync(historyFilePath)) {
      const fileData = JSON.parse(import_fs2.default.readFileSync(historyFilePath, "utf8"));
      const messages = fileData.messages || [];
      inMemoryHistoryCache[cleanNumber] = messages;
      return messages;
    }
  } catch (fileErr) {
    console.error(`Error reading local backup history file for ${cleanNumber}:`, fileErr.message);
  }
  return inMemoryHistoryCache[cleanNumber] || [];
}
async function saveWhatsAppHistory(fromNumber, messages, customerName) {
  const cleanNumber = String(fromNumber).replace(/\D/g, "");
  if (!cleanNumber) return;
  const sliced = messages.slice(-15);
  const docData = {
    messages: sliced,
    customerPhone: cleanNumber,
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (customerName) {
    docData.customerName = customerName;
  }
  if (db) {
    try {
      const historyDocRef = (0, import_firestore.doc)(db, "whatsapp_history", cleanNumber);
      await (0, import_firestore.setDoc)(historyDocRef, docData, { merge: true });
    } catch (e) {
      console.error(`Error saving WhatsApp history to Firestore for ${cleanNumber}:`, e.message);
    }
  }
  try {
    ensureConfigDir();
    const historyFilePath = import_path2.default.join(configDir, `history_${cleanNumber}.json`);
    let existingData = {};
    if (import_fs2.default.existsSync(historyFilePath)) {
      try {
        existingData = JSON.parse(import_fs2.default.readFileSync(historyFilePath, "utf8"));
      } catch (e) {
      }
    }
    const mergedLocal = { ...existingData, ...docData };
    import_fs2.default.writeFileSync(historyFilePath, JSON.stringify(mergedLocal, null, 2), "utf8");
  } catch (fileErr) {
    console.error(`Error writing local backup history file for ${cleanNumber}:`, fileErr.message);
  }
  inMemoryHistoryCache[cleanNumber] = sliced;
}
function getStaticGreetingResponse(messageText, historyLength) {
  if (!messageText) return null;
  if (historyLength > 0) return null;
  const text = messageText.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  const shortGreetings = [
    "oi",
    "oii",
    "oiii",
    "ola",
    "ol\xE1",
    "bom dia",
    "boa tarde",
    "boa noite",
    "tudo bem",
    "tudo bem?",
    "opa",
    "salve",
    "ol\xE1 bom dia",
    "ol\xE1 boa tarde",
    "ol\xE1 boa noite",
    "oi bom dia",
    "oi boa tarde",
    "oi boa noite",
    "opa tudo bem",
    "tem algu\xE9m a\xED",
    "tem algu\xE9m",
    "atendimento",
    "suporte",
    "ol\xE1!",
    "oi!",
    "bom dia!",
    "boa tarde!",
    "boa noite!"
  ];
  const isDirectGreeting = shortGreetings.includes(text) || shortGreetings.some((g) => text.startsWith(g) && text.length <= g.length + 3);
  const techKeywords = [
    "conserto",
    "formata\xE7\xE3o",
    "formatar",
    "tela",
    "bateria",
    "celular",
    "iphone",
    "placa",
    "notebook",
    "conector",
    "sensor",
    "camera",
    "c\xE2mera",
    "carregar",
    "v\xEDcio",
    "viciado",
    "viciada",
    "valor",
    "pre\xE7o",
    "or\xE7amento",
    "quanto",
    "molhou",
    "desoxida\xE7\xE3o",
    "consertar",
    "quebrou",
    "trincou",
    "parou",
    "liga",
    "conecta",
    "troca",
    "trocar",
    "or\xE7amento",
    "conserto",
    "computador"
  ];
  const containsTech = techKeywords.some((keyword) => text.includes(keyword));
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if ((isDirectGreeting || wordCount <= 3 && !containsTech) && !containsTech) {
    return "Ol\xE1! Seja muito bem-vindo(a) \xE0 *Andmicrocell Solu\xE7\xF5es*! \u{1F31F}\n\nPara que eu possa te passar as informa\xE7\xF5es e estimativas de pre\xE7o de forma super r\xE1pida, por favor me envie:\n\n1\uFE0F\u20E3 O *modelo e marca* do seu aparelho (ex: Samsung A32, iPhone 11, etc.)\n2\uFE0F\u20E3 O *defeito ou problema* que ele est\xE1 apresentando\n\nAssim que voc\xEA me enviar esses detalhes, eu j\xE1 te passo as op\xE7\xF5es e valores na hora! \u{1F609}";
  }
  return null;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
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
    const cleanPath = req.path.replace(/\/$/, "");
    if (cleanPath === "/webhook") {
      req.url = "/api/webhook/whatsapp";
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
      const apiKey = [
        process.env.GEMINI_API_KEY,
        process.env.GOOGLE_API_KEY,
        process.env.VITE_GEMINI_API_KEY
      ].find((key) => typeof key === "string" && key.trim() && key !== "MY_GEMINI_API_KEY");
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY/GOOGLE_API_KEY environment variable is not configured.");
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
    const { name, category, address, phone, businessHours, specialOffers, tone, faqs, pricingTable } = config;
    let faqText = faqs && faqs.length > 0 ? faqs.map((f) => `P: ${f.question}
R: ${f.answer}`).join("\n\n") : "Nenhuma cadastrada.";
    let pricingText = pricingTable && pricingTable.length > 0 ? pricingTable.map((p) => `- Aparelho/Modelo: ${p.deviceModel} | Servi\xE7o: ${p.serviceName} | Estimativa de Pre\xE7o: ${p.priceEstimate}${p.notes ? ` (Notas: ${p.notes})` : ""}`).join("\n") : `Tabela de Pre\xE7os Geral de Refer\xEAncia:
- Aparelho/Modelo: iPhone 11 | Servi\xE7o: Troca de Tela Premium (OLED) | Estimativa de Pre\xE7o: A partir de R$ 320 (Notas: Tela qualidade premium com True Tone ativo naturalmente.)
- Aparelho/Modelo: iPhone 11 | Servi\xE7o: Troca de Bateria Premium | Estimativa de Pre\xE7o: A partir de R$ 180 (Notas: Excelente durabilidade, similar \xE0 original de f\xE1brica.)
- Aparelho/Modelo: iPhone 12 | Servi\xE7o: Troca de Tela Premium (OLED) | Estimativa de Pre\xE7o: A partir de R$ 550 (Notas: Tela qualidade premium com True Tone ativo.)
- Aparelho/Modelo: iPhone 12 | Servi\xE7o: Troca de Bateria Premium | Estimativa de Pre\xE7o: A partir de R$ 260 (Notas: Excelente durabilidade, similar \xE0 original de f\xE1brica.)
- Aparelho/Modelo: iPhone 13 | Servi\xE7o: Troca de Tela Premium (OLED) | Estimativa de Pre\xE7o: A partir de R$ 850 (Notas: Tela premium, cores e toque perfeitos.)
- Aparelho/Modelo: iPhone 13 | Servi\xE7o: Troca de Bateria Premium | Estimativa de Pre\xE7o: A partir de R$ 350 (Notas: Excelente durabilidade, similar \xE0 original de f\xE1brica.)
- Aparelho/Modelo: Samsung Linha S (S20/S21) | Servi\xE7o: Troca de Tela Premium | Estimativa de Pre\xE7o: A partir de R$ 650 (Notas: Qualidade premium com alta defini\xE7\xE3o de toque.)
- Aparelho/Modelo: Notebooks (Dell, Lenovo, HP, etc) | Servi\xE7o: Instala\xE7\xE3o de SSD 240GB + Limpeza Interna + Formata\xE7\xE3o | Estimativa de Pre\xE7o: A partir de R$ 220 (Notas: Garante at\xE9 10x mais velocidade de inicializa\xE7\xE3o.)
- Aparelho/Modelo: Notebooks (Dell, Lenovo, HP, etc) | Servi\xE7o: Instala\xE7\xE3o de SSD 480GB + Limpeza Interna + Formata\xE7\xE3o | Estimativa de Pre\xE7o: A partir de R$ 290 (Notas: Garante at\xE9 10x mais velocidade de inicializa\xE7\xE3o e muito mais espa\xE7o.)
- Aparelho/Modelo: Notebooks (Qualquer marca) | Servi\xE7o: Limpeza F\xEDsica Interna + Troca de Pasta T\xE9rmica Prata | Estimativa de Pre\xE7o: R$ 100 (Notas: Essencial para evitar lentid\xE3o e desligamento por superaquecimento.)
- Aparelho/Modelo: iPhone (Qualquer modelo) | Servi\xE7o: Servi\xE7o Adicional de Transplante (EEPROM ou BMS) | Estimativa de Pre\xE7o: R$ 150 adicionais (Notas: Procedimento de micro-solda opcional para remover a mensagem de pe\xE7a desconhecida.)
- Aparelho/Modelo: Celulares (Geral) | Servi\xE7o: Desoxida\xE7\xE3o Qu\xEDmica Profissional (Aparelhos molhados) | Estimativa de Pre\xE7o: A partir de R$ 120 (Notas: Processo de lavagem qu\xEDmica em cuba ultrass\xF4nica para remover oxida\xE7\xF5es.)`;
    const brazilTime = getBrazilDateTime();
    const brazilStatus = getBrazilStatus();
    const formattingPricesText = `
Tabela de Pre\xE7os - Formata\xE7\xE3o e Backup (PCs e Notebooks):
- Formata\xE7\xE3o Simples (sem backup de arquivos): R$ 90,00
- Formata\xE7\xE3o com Backup de at\xE9 70 GB: R$ 110,00
- Formata\xE7\xE3o com Backup de 70 GB a 200 GB: R$ 120,00
- Formata\xE7\xE3o com Backup de 200 GB a 400 GB: R$ 160,00
- Formata\xE7\xE3o com Backup de 400 GB a 600 GB: R$ 190,00
- Formata\xE7\xE3o com Backup de 600 GB a 1000 GB (1 TB): R$ 230,00
`;
    const hardwareRulesText = `
Regras Espec\xEDficas de Pre\xE7os de Computadores e Notebooks (MUITO IMPORTANTE):
1. Manuten\xE7\xE3o Preventiva de Notebooks:
   - Notebook B\xE1sico/Comum: R$ 90,00.
   - Notebook Gamer ou topo de linha/caro: Valor sob consulta (o risco e a complexidade de manuseio s\xE3o maiores, por isso exige responsabilidade diferenciada do t\xE9cnico).
2. Manuten\xE7\xE3o Preventiva de Computadores (Desktops):
   - PC Gamer: R$ 250,00.
     * Como identificar se \xE9 PC Gamer? Caracterizado por pe\xE7as como: gabinete com 3 ou mais fans/ventoinhas, placa de v\xEDdeo dedicada (offboard), refrigera\xE7\xE3o l\xEDquida (watercooler) ou componentes de alta performance. Mesmo se n\xE3o tiver watercooler, se for de jogos, \xE9 considerado PC Gamer.
3. Instala\xE7\xE3o de Mem\xF3ria RAM ou Armazenamento SSD (Servi\xE7o Simples):
   - PC ou Notebook Simples/Comum: R$ 60,00.
   - PC ou Notebook Gamer ou topo de linha: R$ 150,00 a R$ 180,00 (devido \xE0 complexidade de desmontagem, dissipadores robustos de calor e cuidados de manipula\xE7\xE3o).
4. Outros servi\xE7os n\xE3o listados: Sempre informe que \xE9 necess\xE1rio analisar presencialmente ou consultar o t\xE9cnico.

Regra de Or\xE7amento Inteligente com Margem em Cascata para Reparos de Celular (Telas, Baterias, etc.):
- Se o cliente perguntar o pre\xE7o de uma troca de tela ou bateria de celular que n\xE3o esteja na tabela de pre\xE7os padr\xE3o, e voc\xEA souber ou for consultar o custo da pe\xE7a do fornecedor:
  * A f\xF3rmula oficial em cascata \xE9: Pre\xE7o Final = (Custo da Pe\xE7a + 50%) + 40%.
  * Exemplo explicativo: Se a pe\xE7a custa R$ 100,00 no fornecedor, adicionamos 50% (R$ 150,00) e depois adicionamos 40% (R$ 210,00) sobre o subtotal. O valor repassado ao cliente \xE9 R$ 210,00.

Nova Categoria Premium de Servi\xE7os: Sistemas de Gest\xE3o e Automa\xE7\xE3o de WhatsApp para Empresas:
- Al\xE9m de assist\xEAncia t\xE9cnica f\xEDsica para computadores, notebooks e celulares, a AndMicrocell possui agora um setor de engenharia de software premium.
- N\xF3s desenvolvemos sistemas de gest\xE3o comercial e de controle de estoque super completos, al\xE9m de rob\xF4s inteligentes integrados com intelig\xEAncia artificial para automatizar o WhatsApp de outras empresas (exatamente como este assistente que est\xE1 conversando com voc\xEA!).
- Diretriz de Prospec\xE7\xE3o (MUITO IMPORTANTE):
  * No in\xEDcio da conversa (seja na sauda\xE7\xE3o de boas-vindas ou na primeira intera\xE7\xE3o oportuna), inclua de forma super amig\xE1vel e breve um gancho promocional, por exemplo:
    "Sabia que al\xE9m de consertar aparelhos, n\xF3s tamb\xE9m desenvolvemos sistemas de estoque e rob\xF4s inteligentes para o WhatsApp de outras empresas? Se quiser automatizar seu neg\xF3cio, me avisa! \u{1F609}"
  * Se o cliente demonstrar qualquer interesse, interesse em or\xE7amento ou curiosidade sobre esse servi\xE7o de automa\xE7\xE3o ou sistema de estoque:
    1. Explique brevemente que nossos rob\xF4s atendem clientes 24h, tiram d\xFAvidas de suporte, fazem or\xE7amentos e agendamentos autom\xE1ticos, enquanto nossos sistemas organizam todo o estoque e vendas de forma profissional.
    2. Ofere\xE7a para agendar uma demonstra\xE7\xE3o gratuita e sem compromisso diretamente com o nosso Diretor de Tecnologia e Engenheiro Respons\xE1vel, o Anderson.
    3. Colete o nome do cliente, o nome da empresa dele e o segmento para que o Anderson entre em contato com um plano personalizado!
`;
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

PORTF\xD3LIO DE SERVI\xC7OS, REGRAS DE POSICIONAMENTO COMERCIAL E DIRETRIZES DE ATENDIMENTO (BASE DE CONHECIMENTO):

1. ESCOPO DE ATENDIMENTO E DISPOSITIVOS SUPORTADOS:
   - Smartphones / Celulares: iPhone (iOS) e Android (suporte e reparo completos).
   - Inform\xE1tica: Notebooks e Computadores de mesa (Desktop) (suporte t\xE9cnico e manuten\xE7\xE3o).
   - AirPods (Apple): Reparos dispon\xEDveis, mas N\xC3O divulgue ativamente. Informar/confirmar apenas se o cliente perguntar diretamente.
   - Macbooks e outros produtos: N\xC3O prestamos suporte no momento.

2. TIPOS DE REPARO E LIMITA\xC7\xD5ES T\xC9CNICAS:
   - Celulares e iPhones (iOS / Android): Realizamos reparos avan\xE7ados em placas eletr\xF4nicas por micro-soldagem.
   - Notebooks e Computadores (Desktops): N\xC3O realizamos reparos avan\xE7ados em placas-m\xE3e por raz\xF5es t\xE9cnicas. Nossos reparos eletr\xF4nicos de placa s\xE3o voltados \xFAnica e exclusivamente para a linha de celulares.
   - Servi\xE7os autorizados/permitidos em placas de notebooks/PCs: Troca de entrada de carga / conector DC Jack, regrava\xE7\xE3o de EPROM (BIOS) e outros reparos de componentes perif\xE9ricos/b\xE1sicos de hardware.

3. REGRA DE IDENTIFICA\xC7\xC3O DE DEFEITO DE PLACA (TRIAGEM DA IA):
   - Como a IA identifica se \xE9 problema de placa?
     * Crit\xE9rio Principal: Verificar se o aparelho j\xE1 passou por outra assist\xEAncia t\xE9cnica especializada em reparos e se o cliente possui um laudo/diagn\xF3stico pr\xE9vio.
     * Aten\xE7\xE3o: Se o cliente disser apenas "n\xE3o d\xE1 sinal de nada" ou "acho que \xE9 placa", orientar educadamente que pode ser outro defeito mais simples (como conector, bateria, fonte ou regrava\xE7\xE3o de EPROM) pass\xEDvel de conserto na nossa loja f\xEDsica.
     * Orienta\xE7\xE3o ao Cliente: Mesmo que o cliente j\xE1 tenha um laudo de placa com defeito vindo de outra assist\xEAncia, ele pode trazer o equipamento para uma nova avalia\xE7\xE3o t\xE9cnica presencial gratuita e sem compromisso conosco.

4. LINHA GAMER E COMPUTADORES/NOTEBOOKS:
   - Somos altamente especialistas em Linha Gamer: fazemos manuten\xE7\xE3o preventiva e corretiva completa para PCs e Notebooks Gamer (desmontagem, limpeza, troca de pasta t\xE9rmica de prata, etc.).
   - Software para PCs/Notebooks: Realizamos formata\xE7\xE3o, reinstala\xE7\xE3o de sistema e instala\xE7\xE3o de programas de forma profissional.

5. SERVI\xC7OS DE SOFTWARE PARA CELULARES:
   - Servi\xE7os Permitidos:
     * Atualiza\xE7\xE3o/passagem de sistema para resolver falhas/bugs.
     * Desbloqueio de senha da tela:
       - Modalidade 1: Tentativa sem perda de dados.
       - Modalidade 2: Em caso de falha da Modalidade 1 (e com autoriza\xE7\xE3o/ci\xEAncia pr\xE9via do cliente), fazemos reinstala\xE7\xE3o do sistema zerando tudo.
       - Nota iPhone: O cliente precisa obrigatoriamente saber a senha do iCloud para reativar ap\xF3s o procedimento.
   - N\xC3O Realizados (Estritamente Proibidos):
     * N\xC3O fazemos remo\xE7\xE3o de Conta Google (FRP).
     * N\xC3O fazemos remo\xE7\xE3o de Conta Xiaomi (Mi Account).
     * N\xC3O fazemos desbloqueio Payjoy.

6. RECICLAGEM E COMPRA DE APARELHOS:
   - Doa\xE7\xE3o: Recebemos aparelhos de celular/notebook/PC para doa\xE7\xE3o e reciclagem adequada.
   - Compra de Aparelhos: Compramos apenas se for valor simb\xF3lico/baixo (para descarte/reaproveitamento de pe\xE7as) e se tiver proced\xEAncia garantida (clientes conhecidos/da casa).
   - N\xC3O compramos de pessoas que dizem ter "achado" o aparelho ou se estiver bloqueado/duvidoso.
   - Conduta da IA: A IA deve encaminhar esse tipo de atendimento (sobre compra de aparelhos ou ofertas suspeitas) diretamente para o atendimento humano.

7. LIMPEZA DE CONECTOR E BRINDES:
   - Limpeza de Conector de Carga:
     * Servi\xE7o pago e profissional (realizado em bancada sob microsc\xF3pio para preservar a integridade do pino de carga).
     * Cortesia (Gr\xE1tis): Exclusivamente para clientes realizando servi\xE7os principais como troca de tela, bateria ou reparo de placa.
     * Triagem da IA: Se perguntarem quanto \xE9 a limpeza de conector, a IA N\xC3O deve dar diagn\xF3stico pr\xE9vio dizendo que \xE9 "s\xF3 sujeira" (pois pode ser defeito el\xE9trico ou f\xEDsico no pr\xF3prio conector/circuito). Oriente o cliente a trazer para avalia\xE7\xE3o presencial.
   - Brindes: Pel\xEDcula gr\xE1tis exclusivamente para quem realizar troca de tela completa do celular.

8. HOR\xC1RIO DE ATENDIMENTO E SERVI\xC7O DE URG\xCANCIA (FORA DE HOR\xC1RIO / PLANT\xC3O):
   - Hor\xE1rio de Funcionamento: Mant\xE9m o hor\xE1rio padr\xE3o de funcionamento comercial da loja.
   - Atendimento de Urg\xEAncia / Plant\xE3o: Realizamos atendimentos fora do hor\xE1rio comercial, finais de semana ou domingos, mediante taxa/valor adicional pelo servi\xE7o de urg\xEAncia.
   - Casos t\xEDpicos de Urg\xEAncia:
     * Clientes vindos de outras cidades que buscam atendimento especializado de urg\xEAncia.
     * Casos de aparelhos que ca\xEDram em l\xEDquidos (urg\xEAncia para evitar corros\xE3o avan\xE7ada na placa do aparelho).
   - Triagem da IA: A IA pode informar sobre a possibilidade de atendimento de urg\xEAncia/fora do hor\xE1rio com taxa adicional e encaminhar o cliente diretamente para o atendimento humano confirmar a disponibilidade do t\xE9cnico de plant\xE3o.

9. POL\xCDTICA PARA APARELHOS MOLHADOS / CONTATO COM L\xCDQUIDOS:
   - Casos Gerais (\xC1gua/L\xEDquidos): Atendemos normalmente com alta prioridade e recomenda\xE7\xE3o de urg\xEAncia.
   - Aparelhos que Ca\xEDram na Privada / Vaso Sanit\xE1rio / Esgoto / Efluentes:
     * Regra R\xEDgida: N\xC3O realizamos manuten\xE7\xE3o nesse tipo de servi\xE7o por s\xE9rias quest\xF5es sanit\xE1rias, de higiene do laborat\xF3rio e contamina\xE7\xE3o biol\xF3gica.
     * Exce\xE7\xF5es Raras: Apenas se a \xE1gua estava 100% limpa, mas passar\xE1 por rigorosa verifica\xE7\xE3o presencial. Se for constatado qualquer odor ou vest\xEDgio org\xE2nico/urina/fezes no momento do recebimento, o servi\xE7o \xE9 recusado e descartado imediatamente.
     * Conduta da IA: Se a IA perceber ou o cliente mencionar que o aparelho caiu no vaso sanit\xE1rio, efluentes ou esgoto, a IA deve orientar de forma educada que n\xE3o realizamos manuten\xE7\xE3o nesse tipo de ocorr\xEAncia por normas sanit\xE1rias e de biosseguran\xE7a do laborat\xF3rio t\xE9cnico.

10. PROCESSO DE ORDEM DE SERVI\xC7O (OS) E GARANTIA:
    - Abertura de OS: Todo atendimento presencial gera uma Ordem de Servi\xE7o (OS) completa, registrando dados do cliente, modelo e relato minucioso do defeito.
    - Garantia: Finalizado o conserto, emitimos o termo de garantia oficial do servi\xE7o realizado para total seguran\xE7a.

11. SEGURAN\xC7A E TRANSPAR\xCANCIA DO LABORAT\xD3RIO (CLIENTES DESCONFIADOS):
    - Monitoramento por C\xE2meras: Nosso laborat\xF3rio e loja possuem sistema completo de circuito interno de TV com filmagem e monitoramento cont\xEDnuo das bancadas.
    - Clientes Desconfiados/Complicados: Se a IA identificar um cliente inseguro, desconfiado ou muito exigente quanto ao processo de reparo, ela pode e deve refor\xE7ar a transpar\xEAncia do nosso trabalho, destacando a abertura formal de OS e a seguran\xE7a do laborat\xF3rio 100% monitorado por c\xE2meras.

12. QUALIDADE DE PE\xC7AS E PROCEDIMENTOS (DIFERENCIAIS):
    - Qualidade de Telas e Baterias Premium: Nossas telas de reposi\xE7\xE3o s\xE3o de qualidade OLED Premium e j\xE1 v\xEAm com o recurso True Tone ativo de f\xE1brica naturalmente (sem precisar de nenhum transplante). A imagem e o toque s\xE3o perfeitos como a original. Nossas baterias Premium tamb\xE9m possuem excelente durabilidade e rendimento id\xEAnticos aos da original de f\xE1brica.
    - Diferencial T\xE9cnico Opcional (EPROM/BMS): Oferecemos um procedimento opcional de transplante do chip EEPROM original (da tela) e do controlador BMS (da bateria) para aqueles clientes mais exigentes que n\xE3o desejam ver a mensagem de aviso de "tela desconhecida" ou "bateria desconhecida" nas configura\xE7\xF5es do iOS. Como estamos no interior de Pernambuco, a grande maioria dos clientes desconhece esses termos t\xE9cnicos e quase nunca pede isso. Por isso, N\xC3O ofere\xE7a esse servi\xE7o proativamente. Sempre informe o pre\xE7o padr\xE3o da tela/bateria primeiro. Apenas mencione o transplante se o cliente demonstrar forte preocupa\xE7\xE3o com avisos de pe\xE7as nas configura\xE7\xF5es ou com a sa\xFAde da bateria. Explique de maneira simples: "fazemos um procedimento opcional de transfer\xEAncia do chip original do seu aparelho para manter todas as fun\xE7\xF5es 100% ativas e sem nenhuma mensagem de aviso no sistema". Este servi\xE7o de alta precis\xE3o \xE9 opcional e tem um custo adicional de aproximadamente R$ 150 sobre o valor da troca.
    - Troca de Vidro da Tela: N\xC3O realizamos o servi\xE7o de troca exclusiva de vidro da tela no momento. Se o cliente perguntar por troca de vidro, explique educadamente que trabalhamos com a substitui\xE7\xE3o do m\xF3dulo completo de tela premium, mas destaque que j\xE1 estamos planejando e viabilizando a compra dos maquin\xE1rios especiais para implantar o servi\xE7o de troca de vidro em breve!

Data e Hora Atual de Atendimento (Fuso Hor\xE1rio de Caruaru/PE, Brasil):
- Dia da semana: ${brazilTime.weekday}
- Data de hoje: ${brazilTime.date}
- Hor\xE1rio atual: ${brazilTime.time}
- Status de Funcionamento Atual da Loja F\xEDsica: ${brazilStatus.statusMessage}

Base de Conhecimento (Perguntas Frequentes / FAQs):
${faqText}

Tabela de Pre\xE7os Geral de Refer\xEAncia para Or\xE7amentos (S\xD3 passe o valor se o cliente insistir ou pedir or\xE7amento espec\xEDfico, priorizando sempre a visita f\xEDsica logo em seguida):
${pricingText}
${formattingPricesText}
${hardwareRulesText}

Diretrizes de Conversa\xE7\xE3o (MUITO IMPORTANTE):
1. Estilo Bate-Papo de WhatsApp: Fale de forma extremamente curta, direta e objetiva, exatamente como um ser humano digitaria no WhatsApp de forma r\xE1pida. Evite par\xE1grafos longos, explica\xE7\xF5es prolixas e mensagens cheias de rodeios ou tentativas for\xE7adas de engajamento em massa.
2. Limite de Tamanho Rigoroso (CR\xCDTICO): Cada resposta enviada por voc\xEA DEVE conter no m\xE1ximo 1 ou 2 par\xE1grafos curtos, e cada par\xE1grafo deve ter no m\xE1ximo 1 ou 2 linhas curtas! Seja extremamente sucinto. Reduza seu vocabul\xE1rio ao essencial.
3. Exemplos Pr\xE1ticos de Estilo:
   * EXEMPLO RUIM (N\xC3O responda assim de forma alguma):
     "Com certeza posso te dar uma estimativa! \u{1F609} Para a formata\xE7\xE3o completa, que j\xE1 inclui o backup de todos os seus dados e a otimiza\xE7\xE3o do sistema, o valor come\xE7a a partir de R$ 120. Mas olha, para te dar um valor exato e ver se seu notebook n\xE3o precisa de mais nada para ficar voando, o ideal \xE9 nosso t\xE9cnico fazer uma avalia\xE7\xE3o 100% gratuita no nosso laborat\xF3rio. Assim, voc\xEA tem um or\xE7amento super preciso e sem compromisso! Que tal trazer ele na segunda-feira, a partir das 8h? Nossa loja estar\xE1 aberta e pronta para te atender! \u{1F60A}"
   * EXEMPLO BOM (Responda exatamente com este n\xEDvel de objetividade e rapidez):
     "A formata\xE7\xE3o simples \xE9 R$ 90, e com backup fica a partir de R$ 110. \u{1F609}

Que tal trazer o aparelho aqui na loja para fazermos uma avalia\xE7\xE3o gratuita?"
4. Uma Coisa de Cada Vez: N\xE3o entregue todas as informa\xE7\xF5es ou m\xFAltiplos caminhos de uma s\xF3 vez. Fa\xE7a perguntas curtas para entender a necessidade real do cliente passo a passo.
5. Mem\xF3ria Recente: Preste muita aten\xE7\xE3o ao hist\xF3rico de mensagens anteriores. Se o cliente acabou de dizer o nome do aparelho, qual o problema ou o que ele deseja, d\xEA continuidade e jamais repita a mesma pergunta ou pe\xE7a para ele dizer novamente.
6. Limite de Emojis: Use no m\xE1ximo 1 emoji por mensagem. Mensagens com m\xFAltiplos emojis parecem artificiais.
7. Gerenciamento do Hor\xE1rio de Atendimento (MUITO CR\xCDTICO):
   O status atual de funcionamento da loja f\xEDsica \xE9: ${brazilStatus.statusMessage}.
   - Se o status indicar que a loja est\xE1 "FECHADA" (ou seja, hoje \xE9 Domingo, S\xE1bado fora do hor\xE1rio, ou dias de semana \xE0 noite/almo\xE7o):
     * Voc\xEA DEVE ser 100% transparente com o cliente. Logo nas primeiras mensagens, deixe absolutamente claro que a loja f\xEDsica est\xE1 FECHADA no momento ou que estamos fora do hor\xE1rio de expediente comercial.
     * Diga explicitamente algo amig\xE1vel como: "Ol\xE1! No momento nossa loja f\xEDsica est\xE1 fechada/fora do hor\xE1rio de atendimento, mas eu sou o assistente virtual da AndMicrocell e posso ir registrando todos os detalhes do seu aparelho para adiantar seu atendimento!"
     * Comunique com total clareza que, mesmo fora do hor\xE1rio de funcionamento comercial, voc\xEA est\xE1 ativo para dar andamento na conversa, coletar as informa\xE7\xF5es do aparelho e do problema t\xE9cnico para deixar tudo pronto no sistema.
     * Explique que assim que a equipe t\xE9cnica retornar no primeiro hor\xE1rio \xFAtil, eles analisar\xE3o tudo para resolver, ou que voc\xEA ir\xE1 verificar com a equipe a possibilidade de un t\xE9cnico de plant\xE3o prestar um suporte especial emergencial.
     * NUNCA d\xEA a entender que o atendimento presencial ou final est\xE1 ativo agora se estiver FECHADA. Deixe bem n\xEDtido que a loja est\xE1 fechada, mas que o assistente virtual (voc\xEA) resolve tudo por aqui e deixa engatilhado para os t\xE9cnicos.
    - Se o status indicar que a loja est\xE1 "ABERTA":
      * Siga com o atendimento normal de expediente comercial.
8. Honestidade e Seguran\xE7a: NUNCA invente informa\xE7\xF5es sobre pre\xE7os, servi\xE7os ou pol\xEDticas que n\xE3o estejam descritas acima. Se n\xE3o souber a resposta ou se o cliente fizer uma pergunta muito espec\xEDfica de pre\xE7o que n\xE3o conste na tabela de pre\xE7os nem na base de conhecimento, explique de forma amig\xE1vel e profissional que n\xE3o tem o valor exato no sistema e convide-o calorosamente a trazer para uma avalia\xE7\xE3o gratuita na loja ou pe\xE7a para ele aguardar um momento que um atendente humano ir\xE1 assumir o atendimento para dar todos os detalhes.
9. Responda sempre em Portugu\xEAs do Brasil.
10. Encerramento Objetivo da Conversa: Quando o cliente se despedir, agradecer ("Obrigado", "Valeu", "Tudo certo", "Entendido", "Tchau", "Boa noite", etc.) ou der sinais claros de que a d\xFAvida foi resolvida e o atendimento se encerrou, responda de forma final, extremamente direta, amig\xE1vel e objetiva. NUNCA fa\xE7a novas perguntas redundantes ("Posso ajudar em algo mais?") ou tente prolongar a conversa desnecessariamente. Apenas agrade\xE7a, deseje um excelente dia/noite ou agende um hor\xE1rio para ele trazer o aparelho, e encerre por ali.`;
  };
  const buildOperationsSystemInstruction = (config) => {
    const { name, category, phone, businessHours, address, specialOffers } = config || {};
    return `Voc\xEA \xE9 a Agente Operacional da empresa ${name || "AndMicrocell"}, com perfil de execu\xE7\xE3o estrat\xE9gica e melhoria cont\xEDnua.

  Objetivo:
  - Atuar como assistente de opera\xE7\xE3o, gest\xE3o e tomada de decis\xE3o.
  - Responder para o time interno (n\xE3o para clientes finais).
  - Transformar pedidos simples do operador em plano de a\xE7\xE3o claro e execut\xE1vel.

  Contexto da empresa:
  - Segmento: ${category || "assist\xEAncia t\xE9cnica"}
  - Telefone principal: ${phone || "n\xE3o informado"}
  - Hor\xE1rio comercial: ${businessHours || "n\xE3o informado"}
  - Endere\xE7o: ${address || "n\xE3o informado"}
  - Ofertas atuais: ${specialOffers || "n\xE3o informado"}

  Diretrizes de resposta:
  1. Use Portugu\xEAs do Brasil.
  2. Entenda comandos em linguagem simples e informal, sem exigir termos t\xE9cnicos.
  3. Converse de forma natural (como um operador experiente), sem respostas rob\xF3ticas ou repetitivas.
  4. Nunca responder como atendimento ao cliente; o foco \xE9 opera\xE7\xE3o interna.
  5. Evite loop: n\xE3o repetir frases de abertura como "Agente IA online" ou equivalentes.
  6. Se a pergunta for curta (ex: "arruma isso", "melhora o robo"), devolva uma resposta curta com a\xE7\xE3o imediata.
  7. Quando o usu\xE1rio pedir para fazer/configurar/melhorar, responda em 3 partes curtas:
    - O que vou fazer agora
    - Passos de execu\xE7\xE3o
    - Como validar que deu certo
  8. Para incidentes t\xE9cnicos, use 4 blocos curtos: Situa\xE7\xE3o, A\xE7\xE3o, Risco, Pr\xF3ximo passo.
  9. Em integra\xE7\xF5es, considerar sempre as camadas Meta API -> Chatwoot -> Backend -> Gemini.
  10. Em melhorias de site, incluir pelo menos 1 ganho t\xE9cnico e 1 ganho comercial.
  11. Limite de tamanho: no m\xE1ximo 6 linhas curtas, sem markdown e sem text\xE3o.
  12. Finalize com uma \xFAnica pr\xF3xima a\xE7\xE3o objetiva.
  `;
  };
  const compactOperationsReply = (rawText) => {
    const cleaned = (rawText || "").replace(/\*\*/g, "").replace(/^\s*[-*]\s+/gm, "").replace(/\r/g, "").trim();
    if (!cleaned) {
      return "Situa\xE7\xE3o: solicita\xE7\xE3o recebida.\nA\xE7\xE3o Recomendada: me diga a tarefa em 1 frase para eu montar execu\xE7\xE3o imediata.\nRisco: sem escopo, h\xE1 retrabalho.\nPr\xF3ximo Passo: enviar objetivo e prazo desejado.";
    }
    const condensed = cleaned.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 8).join("\n");
    const safeText = condensed.replace(/atendimento ao cliente/gi, "opera\xE7\xE3o interna").replace(/cliente final/gi, "opera\xE7\xE3o interna").replace(/suporte ao cliente/gi, "suporte operacional");
    return safeText.length > 900 ? `${safeText.slice(0, 900)}...` : safeText;
  };
  const isLoopLikeReply = (reply, lastAi, lastUser) => {
    const r = (reply || "").toLowerCase().trim();
    const a = (lastAi || "").toLowerCase().trim();
    const u = (lastUser || "").toLowerCase().trim();
    if (!r) return true;
    const genericStarts = [
      "agente ia online",
      "situa\xE7\xE3o:",
      "acao recomendada:",
      "a\xE7\xE3o recomendada:",
      "pedido operacional identificado"
    ];
    const startsGeneric = genericStarts.some((s) => r.startsWith(s));
    const tooSimilar = a && (r === a || r.includes(a) || a.includes(r));
    const tooUnrelated = u.length > 8 && !r.includes(u.split(" ")[0]);
    return startsGeneric || tooSimilar || tooUnrelated;
  };
  const buildDirectOpsReply = (lastUserMessage) => {
    const msg = (lastUserMessage || "").trim();
    return `Entendido. Vou tratar isso agora de forma operacional.
O que vou fazer: atacar ${msg || "essa tarefa"} com prioridade alta.
Passos: validar contexto, executar ajuste, testar resultado.
Valida\xE7\xE3o: confirmar comportamento esperado sem erro e com resposta objetiva.
Pr\xF3ximo passo: me diga apenas o resultado esperado em 1 frase.`;
  };
  app.post("/api/agent/transcribe-audio", async (req, res) => {
    try {
      const { audioBase64, mimeType = "audio/webm" } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: "Nenhum dado de \xE1udio fornecido." });
      }
      const cleanBase64 = normalizeAudioBase64(audioBase64);
      const cleanMimeType = normalizeMimeType(mimeType);
      if (!cleanBase64) {
        return res.status(400).json({ error: "O payload de \xE1udio est\xE1 vazio ou inv\xE1lido." });
      }
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: cleanMimeType
            }
          },
          "Transcreva este \xE1udio em portugu\xEAs brasileiro de forma extremamente limpa, natural e fiel. Retorne APENAS a transcri\xE7\xE3o literal do \xE1udio falado, sem adicionar nenhuma explica\xE7\xE3o, sem aspas, sem prefixos ou coment\xE1rios adicionais."
        ]
      });
      const transcription = (response.text || "").trim();
      return res.json({
        success: true,
        transcription: transcription || "\xC1udio recebido (sem fala compreens\xEDvel)"
      });
    } catch (err) {
      console.error("[Transcribe Audio API Error]:", err.message);
      return res.status(500).json({
        success: false,
        error: err.message || "Falha ao transcrever o \xE1udio."
      });
    }
  });
  app.post("/api/agent/chat", async (req, res) => {
    try {
      const { config, messages, mode } = req.body;
      const normalizedMode = mode === "operations" ? "operations" : "customer_support";
      if (!config) {
        return res.status(400).json({ error: "Configura\xE7\xE3o do agente ausente." });
      }
      if (normalizedMode === "customer_support") {
        const lastUserMessage2 = messages[messages.length - 1]?.text || "";
        const historyLength = messages.length - 1;
        const staticResponse = getStaticGreetingResponse(lastUserMessage2, historyLength);
        if (staticResponse) {
          return res.json({ text: staticResponse });
        }
      }
      const systemPrompt = normalizedMode === "operations" ? buildOperationsSystemInstruction(config) : buildSystemInstruction(config);
      const lastUserMessage = messages[messages.length - 1]?.text || "";
      const lastAiMessage = [...messages].reverse().find((m) => {
        const sender = typeof m?.sender === "string" ? m.sender.toLowerCase() : "";
        return sender === "agent" || sender === "model";
      })?.text || "";
      const contents = messages.slice(-6).map((m) => {
        const sender = typeof m?.sender === "string" ? m.sender.toLowerCase() : "";
        return {
          role: sender === "customer" || sender === "user" ? "user" : "model",
          parts: [{ text: m.text }]
        };
      });
      try {
        const client = getGeminiClient();
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: normalizedMode === "operations" ? 0.25 : 0.7,
            maxOutputTokens: normalizedMode === "operations" ? 220 : 900
          }
        });
        const baseReplyText = response.text || "Desculpe, n\xE3o entendi a sua mensagem. Poderia repetir?";
        let replyText = normalizedMode === "operations" ? compactOperationsReply(baseReplyText) : baseReplyText;
        if (normalizedMode === "operations" && isLoopLikeReply(replyText, lastAiMessage, lastUserMessage)) {
          replyText = compactOperationsReply(buildDirectOpsReply(lastUserMessage));
        }
        return res.json({ text: replyText });
      } catch (geminiError) {
        console.warn("Using fallback response because Gemini API failed or is unconfigured:", geminiError.message);
        if (normalizedMode === "operations") {
          const lastUserMessage3 = messages[messages.length - 1]?.text?.toLowerCase() || "";
          const topics = [];
          if (lastUserMessage3.includes("site")) topics.push("site");
          if (lastUserMessage3.includes("chatwoot")) topics.push("chatwoot");
          if (lastUserMessage3.includes("meta") || lastUserMessage3.includes("whatsapp")) topics.push("meta api");
          if (lastUserMessage3.includes("gemini") || lastUserMessage3.includes("ia")) topics.push("gemini");
          if (lastUserMessage3.includes("painel")) topics.push("painel");
          if (lastUserMessage3.includes("robo") || lastUserMessage3.includes("bot")) topics.push("robo");
          const foco = topics.length > 0 ? topics.join(", ") : "opera\xE7\xE3o geral";
          const opsFallback = `Entendido. Foco atual: ${foco}.
Vou agir assim: validar Meta API -> Chatwoot -> Backend -> Gemini, com prioridade em logs e autentica\xE7\xE3o.
Risco: sem essa checagem, o problema volta em loop.
Pr\xF3ximo passo: me diga a tarefa exata em 1 frase para eu devolver execu\xE7\xE3o imediata.`;
          return res.json({
            text: opsFallback,
            isSimulatedFallback: true,
            apiKeyNotice: "Configure a GEMINI_API_KEY no painel Secrets para respostas mais avan\xE7adas e din\xE2micas."
          });
        }
        const lastUserMessage2 = messages[messages.length - 1]?.text?.toLowerCase() || "";
        let fallbackResponse = `Ol\xE1! Sou o assistente virtual da ${config.name}. Como posso ajudar?`;
        if (lastUserMessage2.includes("horario") || lastUserMessage2.includes("hor\xE1rio") || lastUserMessage2.includes("abre") || lastUserMessage2.includes("fecha")) {
          fallbackResponse = `Nosso hor\xE1rio de funcionamento \xE9: ${config.businessHours || "de segunda a sexta, das 9h \xE0s 18h"}. Ficamos muito felizes com o seu interesse!`;
        } else if (lastUserMessage2.includes("endereco") || lastUserMessage2.includes("endere\xE7o") || lastUserMessage2.includes("onde") || lastUserMessage2.includes("localizacao") || lastUserMessage2.includes("localiza\xE7\xE3o")) {
          fallbackResponse = config.address ? `N\xF3s estamos localizados em: ${config.address}. Venha nos visitar!` : `N\xF3s atuamos principalmente de forma digital ou com entregas diretas!`;
        } else if (lastUserMessage2.includes("preco") || lastUserMessage2.includes("pre\xE7o") || lastUserMessage2.includes("quanto") || lastUserMessage2.includes("valor")) {
          fallbackResponse = `Para valores e or\xE7amentos detalhados do nosso segmento de ${config.category}, fale com nossos especialistas! O que exatamente voc\xEA procura?`;
        } else if (config.faqs && config.faqs.length > 0) {
          const matchedFaq = config.faqs.find(
            (f) => lastUserMessage2.includes(f.question.toLowerCase()) || f.question.toLowerCase().split(" ").some((word) => word.length > 4 && lastUserMessage2.includes(word))
          );
          if (matchedFaq) {
            fallbackResponse = matchedFaq.answer;
          }
        }
        return res.json({
          text: fallbackResponse,
          isSimulatedFallback: true,
          apiKeyNotice: "Configure a GEMINI_API_KEY no painel Secrets do AI Studio para obter respostas din\xE2micas em tempo real com IA!"
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
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Cliente: ${authorName}
Nota: ${rating} estrelas
Coment\xE1rio: "${comment || "Sem coment\xE1rio escrito, apenas atribuiu estrelas"}"`,
          config: {
            systemInstruction,
            temperature: 0.8
          }
        });
        const replyText = response.text || `Muito obrigado pela sua avalia\xE7\xE3o, ${authorName}! Ficamos felizes em te atender.`;
        return res.json({ reply: replyText });
      } catch (geminiError) {
        console.warn("Using fallback response for review reply:", geminiError.message);
        let replyText = `Muito obrigado pela sua avalia\xE7\xE3o de ${rating} estrelas, ${authorName}! Ficamos muito gratos pelo feedback e trabalhamos constantemente para oferecer o melhor em ${config.category}.`;
        if (rating <= 2) {
          replyText = `Ol\xE1, ${authorName}. Lamentamos muito que sua experi\xEAncia n\xE3o tenha sido ideal. Valorizamos muito o seu feedback e gostar\xEDamos de entender melhor o ocorrido. Por favor, entre em contato conosco pelo telefone ${config.phone} para que possamos resolver a situa\xE7\xE3o diretamente.`;
        } else if (rating === 3) {
          replyText = `Ol\xE1, ${authorName}. Agradecemos por sua avalia\xE7\xE3o e pelo feedback construtivo. Estamos sempre buscando evoluir em nossos servi\xE7os de ${config.category} para oferecer uma experi\xEAncia 5 estrelas na sua pr\xF3xima visita!`;
        }
        return res.json({
          reply: replyText,
          isSimulatedFallback: true,
          apiKeyNotice: "Configure a GEMINI_API_KEY no painel Secrets do AI Studio para obter respostas personalizadas autom\xE1ticas!"
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
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "";
    const baseUrl = `${protocol}://${host}`;
    const url = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || baseUrl;
    res.json({ url });
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
    const iconPath = import_path2.default.join(process.cwd(), "src", "assets", "images", "andmicrocell_meta_icon_1783827325456.jpg");
    res.setHeader("Content-Type", "image/jpeg");
    res.sendFile(iconPath);
  });
  app.get("/meta-icon.png", (req, res) => {
    const iconPath = import_path2.default.join(process.cwd(), "src", "assets", "images", "andmicrocell_meta_icon_png_1783828881971.jpg");
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
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            temperature: 0.8
          }
        });
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
        console.warn("Gemini generation failed for post, using smart dynamic backup:", geminiError.message);
        const normalizedTopic = topic.toLowerCase();
        let finalTitle = topic;
        let finalExcerpt = `Confira uma an\xE1lise detalhada sobre "${topic}", preparada para ajudar voc\xEA a cuidar melhor do seu dispositivo.`;
        let finalCategory = category || "Dicas";
        let finalContent = "";
        let finalCoverImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop";
        if (normalizedTopic.includes("bateria") || normalizedTopic.includes("saude") || normalizedTopic.includes("sa\xFAde") || normalizedTopic.includes("carrega") || normalizedTopic.includes("ciclo")) {
          finalTitle = topic.length > 15 ? topic : "Guia Completo de Sa\xFAde de Bateria do iPhone";
          finalExcerpt = "Aprenda pr\xE1ticas reais para otimizar os ciclos de carga e manter a integridade da bateria do seu iPhone por muito mais tempo.";
          finalCategory = "Dicas";
          finalCoverImage = "https://images.unsplash.com/photo-1601524909162-be87252be298?w=600&auto=format&fit=crop";
          finalContent = `### Por que a sa\xFAde da bateria cai?

A bateria do seu iPhone \xE9 baseada na tecnologia de \xEDons de l\xEDtio, o que significa que ela sofre desgaste qu\xEDmico natural ao longo do tempo. No entanto, certos h\xE1bitos di\xE1rios aceleram drasticamente esse processo, reduzindo a vida \xFAtil do componente muito antes do esperado.

### 5 h\xE1bitos reais que danificam a vida \xFAtil da sua bateria

1. **Utilizar carregadores paralelos ou cabos danificados**: Acess\xF3rios sem certifica\xE7\xE3o n\xE3o controlam a oscila\xE7\xE3o da corrente el\xE9trica, causando superaquecimento e degradando as c\xE9lulas qu\xEDmicas da bateria.
2. **Expor o aparelho a altas temperaturas**: Deixar o celular no painel do carro sob o sol ou us\xE1-lo para jogos pesados enquanto carrega s\xE3o os piores inimigos da bateria. O calor extremo acelera o desgaste qu\xEDmico de forma irrevers\xEDvel.
3. **Deixar a bateria zerar completamente**: Deixar o iPhone descarregar at\xE9 0% gera um estresse desnecess\xE1rio nas c\xE9lulas de carga. O ideal \xE9 manter o n\xEDvel sempre entre **20% e 80%**.
4. **Carregar o celular com capas muito espessas**: Capinhas pesadas ret\xEAm o calor produzido durante a recarga. Se notar que o celular esquenta muito enquanto carrega, remova a capa.
5. **Ciclos de carga mal aproveitados**: Tente evitar cargas curtas e repetitivas se o aparelho estiver quente. Aproveite recursos como o *Carregamento Otimizado* do pr\xF3prio iOS.

### Quando \xE9 a hora de fazer a troca?

Geralmente, quando a capacidade m\xE1xima de sa\xFAde da bateria no iOS fica abaixo de **80%**, ou quando o aparelho come\xE7a a desligar sozinho e apresentar lentid\xE3o severa. 

### Conte com a ${companyName}!

Se a sua bateria j\xE1 est\xE1 desgastada e durando pouco, n\xF3s fazemos a substitui\xE7\xE3o r\xE1pida por componentes de alt\xEDssima qualidade homologados, preservando o desempenho original do seu iPhone. Traga o seu dispositivo para um diagn\xF3stico e or\xE7amento 100% gratuito e r\xE1pido em nossa loja!`;
        } else if (normalizedTopic.includes("placa") || normalizedTopic.includes("curto") || normalizedTopic.includes("solda") || normalizedTopic.includes("micro-solda") || normalizedTopic.includes("reparo")) {
          finalTitle = topic.length > 15 ? topic : "Recupera\xE7\xE3o Avan\xE7ada: Como funciona o reparo de placa de iPhone";
          finalExcerpt = "Descubra como a engenharia eletr\xF4nica e a micro-soldagem especializada salvam celulares dados como 'sem conserto'.";
          finalCategory = "Manuten\xE7\xE3o";
          finalCoverImage = "https://images.unsplash.com/photo-1597733336794-12d05021d510?w=600&auto=format&fit=crop";
          finalContent = `### O Cora\xE7\xE3o do seu iPhone: A Placa L\xF3gica

A placa l\xF3gica do iPhone \xE9 um circuito de alt\xEDssima densidade, onde centenas de microcomponentes (capacitores, resistores, circuitos integrados) trabalham juntos em um espa\xE7o menor do que um cart\xE3o de cr\xE9dito. Qualquer falha em uma \xFAnica trilha pode apagar o celular por completo.

### Sintomas comuns de falhas na placa

- O iPhone n\xE3o liga e n\xE3o d\xE1 sinais de carregamento, mesmo com tela e bateria novas.
- Consumo excessivo de bateria ou aquecimento extremo repentino nas costas do aparelho.
- Falhas intermitentes de fun\xE7\xF5es como Wi-Fi, sinal de operadora (baseband) ou \xE1udio (codec).
- Reinicializa\xE7\xF5es constantes na logo da Apple (conhecido como loop infinito).

### O Processo de Micro-soldagem de Alta Precis\xE3o

Diferente de assist\xEAncias comuns que apenas trocam pe\xE7as modulares, a **${companyName}** trabalha com microeletr\xF4nica avan\xE7ada. 
Utilizando microsc\xF3pios de alta defini\xE7\xE3o, esta\xE7\xF5es de retrabalho de ar quente e esquemas el\xE9tricos digitais detalhados, nossa equipe consegue rastrear curtos-circuitos em malhas principais e substituir microcomponentes milim\xE9tricos com precis\xE3o cir\xFArgica.

### Vale a pena reparar a placa?

Com certeza! Na imensa maioria das vezes, o reparo da placa l\xF3gica custa uma fra\xE7\xE3o do valor de um aparelho novo, al\xE9m de recuperar todos os seus dados e fotos pessoais importantes que n\xE3o estavam salvos no iCloud.

### Confie em quem entende de verdade!

Nossa equipe possui certifica\xE7\xF5es avan\xE7adas em microrreparos de placas. Se disseram que seu iPhone n\xE3o tem conserto, traga-o para a **${companyName}**. N\xF3s faremos uma an\xE1lise t\xE9cnica minuciosa e honesta de forma 100% gratuita!`;
        } else if (normalizedTopic.includes("\xE1gua") || normalizedTopic.includes("liquido") || normalizedTopic.includes("l\xEDquido") || normalizedTopic.includes("arroz") || normalizedTopic.includes("molhado")) {
          finalTitle = topic.length > 15 ? topic : "Celular Caiu na \xC1gua? O Guia de Sobreviv\xEAncia Definitivo";
          finalExcerpt = "Entenda quais atitudes tomar imediatamente e por que colocar o aparelho no pote de arroz pode destruir seus componentes internos.";
          finalCategory = "Guias";
          finalCoverImage = "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=600&auto=format&fit=crop";
          finalContent = `### O desespero do acidente com \xE1gua

Deixar o celular cair na piscina, na pia ou at\xE9 mesmo no banheiro \xE9 um dos acidentes mais comuns. Embora muitos smartphones modernos possuam certifica\xE7\xE3o de resist\xEAncia IP68, essa prote\xE7\xE3o se desgasta com o tempo e com impactos, permitindo a entrada de umidade.

### O Grande Perigo do Mito do Arroz

Colocar o celular no arroz **N\xC3O** funciona e pode danificar ainda mais o seu celular. Embora o arroz absorva umidade superficial, ele libera um amido em p\xF3 extremamente fino que entra nos conectores, alto-falantes e c\xE2mera do aparelho. Ao entrar em contato com a \xE1gua interna, esse p\xF3 vira uma pasta condutiva e corrosiva, acelerando o curto-circuito e destruindo trilhas de solda essenciais na placa.

### Passo a passo para salvar seu dispositivo imediatamente

1. **Desligue o aparelho na mesma hora**: Se o celular continuar ligado, a eletricidade em contato com a \xE1gua criar\xE1 eletr\xF3lise instant\xE2nea, corroendo componentes em minutos.
2. **Remova a gaveta do chip SIM**: Isso cria uma abertura adicional para ajudar na circula\xE7\xE3o de ar.
3. **Seque apenas por fora**: Use uma toalha macia ou papel absorvente. **NUNCA** use secador de cabelo quente, pois ele empurra a \xE1gua ainda mais para dentro e pode derreter veda\xE7\xF5es e componentes pl\xE1sticos.
4. **N\xE3o carregue o celular**: Ligar o carregador em um dispositivo molhado \xE9 garantia de queimar circuitos cr\xEDticos irreversivelmente.

### O Processo Profissional de Desoxida\xE7\xE3o

O \xFAnico m\xE9todo real e seguro \xE9 levar o aparelho o quanto antes a uma assist\xEAncia que realize a abertura total e fa\xE7a uma **desoxida\xE7\xE3o qu\xEDmica profissional** utilizando banheira de ultrassom e \xE1lcool isoprop\xEDlico de alta pureza.

### Traga correndo para a ${companyName}!

Tempo \xE9 precioso nesses casos! Traga o seu iPhone imediatamente para a nossa assist\xEAncia. N\xF3s abriremos o seu aparelho na hora, desconectaremos a bateria para cessar a energia e realizaremos o procedimento de limpeza qu\xEDmica completo para salvar o seu smartphone!`;
        } else if (normalizedTopic.includes("tela") || normalizedTopic.includes("vidro") || normalizedTopic.includes("trincado") || normalizedTopic.includes("display")) {
          finalTitle = topic.length > 15 ? topic : "Tela Quebrada do iPhone: Trocar o vidro ou o display completo?";
          finalExcerpt = "Esclarecemos a diferen\xE7a crucial entre a troca apenas do vidro e a troca do display inteiro para voc\xEA economizar sem perder a qualidade original.";
          finalCategory = "Guias";
          finalCoverImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop";
          finalContent = `### A tela trincou, e agora?

Deixar o iPhone cair e ver a tela rachada \xE9 uma das piores sensa\xE7\xF5es para qualquer usu\xE1rio. No entanto, o mercado oferece diferentes formas de reparo, e compreender como a tela \xE9 constru\xEDda pode fazer voc\xEA economizar bastante dinheiro mantendo as caracter\xEDsticas originais do seu display.

### A Estrutura de uma Tela Moderna

As telas de smartphones s\xE3o formadas por camadas principais integradas:
1. **O Vidro Externo**: A camada de prote\xE7\xE3o f\xEDsica que tocamos.
2. **O Painel Touch (Sensibilidade)**: Detecta os toques dos dedos.
3. **O Display (OLED ou LCD)**: Respons\xE1vel por gerar as cores, brilho e a imagem em si.

### Trocar apenas o Vidro ou a Tela Completa?

- **Quando trocar APENAS o vidro**: Se o seu iPhone quebrou o vidro externo, mas a imagem continua perfeitamente limpa (sem manchas pretas, linhas coloridas ou listras) e o toque (touchscreen) funciona em toda a superf\xEDcie de forma fluida. Nesse cen\xE1rio, o processo de lamina\xE7\xE3o profissional substitui apenas o vidro quebrado, mantendo o seu painel LCD/OLED original e economizando at\xE9 **60%** do custo de uma tela nova!
- **Quando trocar o Display Completo**: Se a tela est\xE1 preta, apresenta manchas escuras, vazamento de cristal l\xEDquido, listras verticais verdes/rosas ou se o toque parou de responder completamente. Nesse caso, a substitui\xE7\xE3o da pe\xE7a inteira \xE9 obrigat\xF3ria.

### Riscos de Telas Paralelas de Baixa Qualidade

Telas de qualidade inferior (paralelas/incell de baixo custo) apresentam cores lavadas, brilho fraco, consomem mais bateria do celular e quebram com extrema facilidade ao menor impacto. Na **${companyName}**, priorizamos telas de qualidade premium com garantia estendida, calibra\xE7\xE3o correta de cores e manuten\xE7\xE3o do recurso True Tone.

### Fa\xE7a seu or\xE7amento gratuito na ${companyName}!

Nossos laborat\xF3rios contam com m\xE1quinas de lamina\xE7\xE3o a v\xE1cuo de alta tecnologia para restaurar apenas o vidro do seu iPhone com acabamento de f\xE1brica. Economize com intelig\xEAncia! Venha fazer uma avalia\xE7\xE3o gratuita do seu display hoje mesmo com a nossa equipe!`;
        } else {
          finalTitle = topic;
          finalExcerpt = `Entenda as melhores pr\xE1ticas, cuidados e recomenda\xE7\xF5es t\xE9cnicas para tratar o tema "${topic}" com seguran\xE7a no seu dispositivo.`;
          finalContent = `### Compreendendo mais sobre: ${topic}

Muitas vezes, nos deparamos com desafios relacionados a **${topic}** no dia a dia do uso de aparelhos de alta tecnologia como iPhones, smartphones e notebooks. Para garantir a longevidade, o bom desempenho e a seguran\xE7a dos seus dados, \xE9 essencial compreender os aspectos t\xE9cnicos envolvidos.

### Pontos Fundamentais de Aten\xE7\xE3o

Para evitar dores de cabe\xE7a e gastos desnecess\xE1rios com manuten\xE7\xE3o corretiva, siga estas orienta\xE7\xF5es gerais de engenharia e cuidado preventivo:

- **Manuten\xE7\xE3o Preventiva**: A limpeza f\xEDsica adequada dos conectores de carga, sa\xEDdas de som e desoxida\xE7\xE3o preventiva salvam componentes internos de desgaste prematuro.
- **Uso de Acess\xF3rios Homologados**: Sempre invista em cabos, carregadores e adaptadores de marcas renomadas e certificadas. A qualidade da energia fornecida influencia diretamente o funcionamento correto da placa principal e a sa\xFAde t\xE9rmica dos chips.
- **Evitar Solu\xE7\xF5es Caseiras Extremas**: Ao notar qualquer comportamento estranho no funcionamento, evite tutoriais m\xE1gicos da internet que envolvam calor excessivo ou produtos qu\xEDmicos corrosivos.

### Diagn\xF3stico T\xE9cnico Seguro

Dispositivos modernos possuem designs extremamente compactos e integrados de microeletr\xF4nica. Qualquer tentativa de abertura sem o ferramental adequado (como chaves de precis\xE3o, mantas t\xE9rmicas controladas e pulseiras antiest\xE1ticas) pode causar danos severos irrevers\xEDveis na placa l\xF3gica ou rompimento de cabos flex\xEDveis delicados.

### Traga seu dispositivo para a ${companyName}!

Seja qual for a necessidade de reparo, manuten\xE7\xE3o ou d\xFAvida t\xE9cnica sobre **${topic}**, a equipe altamente qualificada da **${companyName}** est\xE1 pronta para ajudar. N\xF3s realizamos a an\xE1lise detalhada e emitimos o diagn\xF3stico t\xE9cnico com or\xE7amento 100% gratuito. 

Clique no bot\xE3o de atendimento do nosso site para iniciar uma conversa direto pelo WhatsApp com o nosso time especializado!`;
        }
        const slug = topic.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
        const postData = {
          id: `post-${Date.now()}`,
          title: finalTitle,
          slug,
          excerpt: finalExcerpt,
          content: finalContent,
          category: finalCategory,
          publishedAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          views: 0,
          readTime: `${Math.max(2, Math.ceil(finalContent.split(/\s+/).length / 200))} min`,
          coverImage: finalCoverImage
        };
        return res.json({
          success: true,
          post: postData,
          isSimulatedFallback: true,
          apiKeyNotice: `Rascunho contextual gerado devido a limite tempor\xE1rio de quota do Gemini (${geminiError.message}). Configure sua GEMINI_API_KEY no painel Secrets do AI Studio para habilitar a reda\xE7\xE3o profunda sem limites!`
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
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            temperature: 0.8
          }
        });
        let text = response.text || "";
        text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        const ideas = JSON.parse(text);
        if (Array.isArray(ideas)) {
          return res.json({ success: true, ideas });
        }
        throw new Error("Invalid output format from Gemini");
      } catch (geminiError) {
        console.warn("Gemini generation failed for ideas, using curated backups:", geminiError.message);
        const backupData = {
          "Dicas": [
            { title: "Por que a sa\xFAde da bateria do seu iPhone cai r\xE1pido? 5 h\xE1bitos reais que danificam a vida \xFAtil", category: "Dicas", source: "Google Trends", icon: "\u{1F50B}" },
            { title: "Como liberar muito espa\xE7o no celular sem apagar suas fotos preciosas", category: "Dicas", source: "TechTudo Dicas", icon: "\u{1F4BE}" },
            { title: "O perigo de carregar o celular debaixo do travesseiro: Riscos reais e mitos", category: "Dicas", source: "Dica De Olho", icon: "\u{1F525}" },
            { title: "Sinais secretos de que seu smartphone tem um v\xEDrus ou app malicioso", category: "Dicas", source: "Tend\xEAncia Tech", icon: "\u{1F6E1}\uFE0F" },
            { title: "Cuidado com o \xE1lcool em gel! O produto correto para desinfetar o seu visor", category: "Dicas", source: "Alerta Nacional", icon: "\u{1F9FC}" }
          ],
          "Guias": [
            { title: "Celular caiu na \xE1gua? Erros fatais que voc\xEA deve evitar em casa (e o mito do arroz)", category: "Guias", source: "TechTudo Alerta", icon: "\u{1F4A7}" },
            { title: "Guia Definitivo: Como transferir todos os dados de um celular antigo para o novo sem perder nada", category: "Guias", source: "Manual Pr\xE1tico", icon: "\u{1F4F2}" },
            { title: "Tela travada ou preta? Como for\xE7ar a reinicializa\xE7\xE3o em qualquer smartphone", category: "Guias", source: "Guia R\xE1pido", icon: "\u2699\uFE0F" },
            { title: "Como configurar o backup autom\xE1tico e nunca mais perder seus arquivos e fotos", category: "Guias", source: "Foco Pr\xE1tico", icon: "\u2601\uFE0F" },
            { title: "O que fazer quando o celular n\xE3o quer carregar? Guia b\xE1sico de auto-socorro", category: "Guias", source: "Suporte F\xE1cil", icon: "\u{1F50C}" }
          ],
          "Manuten\xE7\xE3o": [
            { title: "Reparo de placa de iPhone vs Comprar um aparelho novo: Quando realmente vale a pena?", category: "Manuten\xE7\xE3o", source: "Dica De Olho", icon: "\u{1F52C}" },
            { title: "Curto-circuito na placa do iPhone: Como a micro-soldagem avan\xE7ada recupera o seu aparelho", category: "Manuten\xE7\xE3o", source: "Foco T\xE9cnico", icon: "\u26A1" },
            { title: "Por que o conector de carga fica folgado? Como a limpeza t\xE9cnica resolve na hora", category: "Manuten\xE7\xE3o", source: "Dica de Bancada", icon: "\u{1F6E0}\uFE0F" },
            { title: "Os perigos invis\xEDveis de usar uma tela paralela de m\xE1 qualidade no seu smartphone", category: "Manuten\xE7\xE3o", source: "Alerta T\xE9cnico", icon: "\u{1F4F1}" },
            { title: "Sinais claros de que a bateria do seu celular est\xE1 estufada (e o risco de explos\xE3o)", category: "Manuten\xE7\xE3o", source: "Preven\xE7\xE3o T\xE9cnica", icon: "\u26A0\uFE0F" }
          ],
          "Novidades": [
            { title: "As novas regras de reparabilidade de celulares: O que muda para o consumidor em 2026?", category: "Novidades", source: "Tecnologia Hoje", icon: "\u{1F4E1}" },
            { title: "Os novos recursos de Intelig\xEAncia Artificial do novo sistema operacional que voc\xEA precisa testar", category: "Novidades", source: "Novidade Mobile", icon: "\u2728" },
            { title: "Carregamento ultra-r\xE1pido de 120W: Isso realmente vicia ou estraga a vida \xFAtil?", category: "Novidades", source: "Mundo Digital", icon: "\u26A1" },
            { title: "Telas dobr\xE1veis em 2026: Vale a pena comprar ou o custo de manuten\xE7\xE3o ainda \xE9 alto?", category: "Novidades", source: "Tend\xEAncia Global", icon: "\u{1F4D0}" },
            { title: "Como a biometria sob a tela funciona e o que fazer se ela parar de responder ap\xF3s trocar o vidro", category: "Novidades", source: "Futuro Tech", icon: "\u261D\uFE0F" }
          ]
        };
        const allBackupIdeas = [
          ...backupData["Dicas"],
          ...backupData["Guias"],
          ...backupData["Manuten\xE7\xE3o"],
          ...backupData["Novidades"]
        ];
        let selectedBackup = allBackupIdeas;
        if (targetCategory !== "Todas" && backupData[targetCategory]) {
          selectedBackup = backupData[targetCategory];
        }
        const shuffled = [...selectedBackup].sort(() => 0.5 - Math.random());
        const finalIdeas = shuffled.slice(0, 5);
        return res.json({ success: true, ideas: finalIdeas });
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
  app.get("/api/webhook/logs", async (req, res) => {
    if (db) {
      try {
        const logsCol = (0, import_firestore.collection)(db, "webhook_logs");
        const q = (0, import_firestore.query)(logsCol, (0, import_firestore.orderBy)("createdAtMs", "desc"), (0, import_firestore.limit)(100));
        const snap = await (0, import_firestore.getDocs)(q);
        const logs = [];
        snap.forEach((doc2) => {
          logs.push(doc2.data());
        });
        if (logs.length > 0) {
          return res.json(logs);
        }
      } catch (e) {
        console.warn("Error fetching webhook_logs from Firestore:", e.message);
      }
    }
    return res.json(webhookLogs);
  });
  app.post("/api/webhook/logs/clear", async (req, res) => {
    webhookLogs = [
      { id: `wlog-${Date.now()}`, timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR"), direction: "system", message: "Logs de Webhook limpos", details: "Monitor redefinido" }
    ];
    if (db) {
      try {
        const logsCol = (0, import_firestore.collection)(db, "webhook_logs");
        const snap = await (0, import_firestore.getDocs)((0, import_firestore.query)(logsCol, (0, import_firestore.limit)(100)));
        for (const d of snap.docs) {
          await (0, import_firestore.deleteDoc)(d.ref);
        }
      } catch (e) {
      }
    }
    return res.json({ success: true });
  });
  app.get("/api/whatsapp/sessions", async (req, res) => {
    try {
      const sessionsMap = /* @__PURE__ */ new Map();
      if (db) {
        try {
          const historyCol = (0, import_firestore.collection)(db, "whatsapp_history");
          const snap = await (0, import_firestore.getDocs)(historyCol);
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            const cleanNumber = docSnap.id;
            sessionsMap.set(cleanNumber, {
              id: `session-${cleanNumber}`,
              customerName: data.customerName || `Cliente (+${cleanNumber})`,
              customerPhone: `+${cleanNumber}`,
              lastMessage: data.messages?.[data.messages.length - 1]?.text || "",
              unreadCount: 0,
              messages: (data.messages || []).map((m, idx) => ({
                id: `msg-${cleanNumber}-${idx}`,
                sender: m.role === "user" ? "customer" : "agent",
                text: m.text,
                timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""
              }))
            });
          });
        } catch (e) {
          console.error("Error listing sessions from Firestore:", e.message);
        }
      }
      try {
        if (import_fs2.default.existsSync(configDir)) {
          const files = import_fs2.default.readdirSync(configDir);
          for (const file of files) {
            if (file.startsWith("history_") && file.endsWith(".json")) {
              const cleanNumber = file.replace("history_", "").replace(".json", "");
              if (sessionsMap.has(cleanNumber)) continue;
              const filePath = import_path2.default.join(configDir, file);
              try {
                const fileData = JSON.parse(import_fs2.default.readFileSync(filePath, "utf8"));
                const messages = fileData.messages || [];
                sessionsMap.set(cleanNumber, {
                  id: `session-${cleanNumber}`,
                  customerName: fileData.customerName || `Cliente (+${cleanNumber})`,
                  customerPhone: `+${cleanNumber}`,
                  lastMessage: messages[messages.length - 1]?.text || "",
                  unreadCount: 0,
                  messages: messages.map((m, idx) => ({
                    id: `msg-${cleanNumber}-${idx}`,
                    sender: m.role === "user" ? "customer" : "agent",
                    text: m.text,
                    timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""
                  }))
                });
              } catch (err) {
              }
            }
          }
        }
      } catch (e) {
        console.error("Error listing sessions from local filesystem:", e.message);
      }
      return res.json(Array.from(sessionsMap.values()));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { customerPhone, text } = req.body;
      if (!customerPhone || !text) {
        return res.status(400).json({ error: "Faltam par\xE2metros obrigat\xF3rios (customerPhone e text)." });
      }
      const cleanNumber = String(customerPhone).replace(/\D/g, "");
      const config = await getFirebaseConfig();
      if (!config) {
        return res.status(400).json({ error: "Configura\xE7\xE3o do agente ausente." });
      }
      const { whatsappAccessToken, whatsappPhoneNumberId } = config;
      const currentHistory = await getWhatsAppHistory(cleanNumber);
      const updatedHistory = [
        ...currentHistory,
        { role: "model", text, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      ];
      await saveWhatsAppHistory(cleanNumber, updatedHistory);
      let sentOfficially = false;
      if (whatsappAccessToken && whatsappPhoneNumberId) {
        try {
          const fbResponse = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${whatsappAccessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: cleanNumber,
              type: "text",
              text: { body: text }
            })
          });
          const fbResult = await fbResponse.json();
          if (fbResponse.ok) {
            sentOfficially = true;
            addWebhookLog("system", `Mensagem manual enviada via Painel para +${cleanNumber}`, text);
          } else {
            console.warn("Meta API error in manual send:", fbResult);
          }
        } catch (err) {
          console.error("Meta API exception in manual send:", err.message);
        }
      }
      return res.json({ success: true, sentOfficially });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.get(["/api/webhook/whatsapp", "/webhook", "/api/webhook"], async (req, res) => {
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
  app.post(["/api/webhook/whatsapp", "/webhook", "/api/webhook"], async (req, res) => {
    try {
      const body = req.body;
      console.log("[Chatwoot Webhook] Payload recebido:", JSON.stringify(body, null, 2));
      const event = body?.event;
      const messageType = body?.message_type;
      if (!body) {
        console.warn("[Chatwoot Webhook] Corpo da requisi\xE7\xE3o vazio.");
        return res.status(400).send("EMPTY_BODY");
      }
      if (event !== "message_created") {
        console.log(`[Chatwoot Webhook] Ignorando evento n\xE3o relacionado a mensagens: ${event}`);
        return res.status(200).send("EVENT_IGNORED");
      }
      if (messageType !== "incoming") {
        console.log(`[Chatwoot Webhook] Ignorando mensagem de tipo n\xE3o-incoming (evita loops): ${messageType}`);
        return res.status(200).send("EVENT_IGNORED");
      }
      const rawMessageId = body.id ? String(body.id) : null;
      const messageId = rawMessageId ? `cw-${rawMessageId}` : `cw-${Date.now()}`;
      let messageText = body.content || "";
      const chatwootAccountId = body.account?.id || body.account_id;
      const chatwootConversationId = body.conversation?.id || body.conversation_id;
      const customerName = body.sender?.name || body.contact?.name || body.conversation?.contact?.name || "Cliente Chatwoot";
      const fromNumber = body.contact?.phone_number || body.sender?.phone_number || body.conversation?.contact?.phone_number || `cw-${chatwootConversationId}`;
      const attachments = [
        ...Array.isArray(body?.attachments) ? body.attachments : [],
        ...Array.isArray(body?.message?.attachments) ? body.message.attachments : [],
        ...Array.isArray(body?.conversation?.messages?.[0]?.attachments) ? body.conversation.messages[0].attachments : [],
        ...body?.attachment ? [body.attachment] : []
      ];
      const audioAttachment = attachments.find((att) => {
        if (!att) return false;
        const type = String(att.file_type || att.type || "").toLowerCase();
        const mime = String(att.content_type || att.mime_type || "").toLowerCase();
        const ext = String(att.extension || "").toLowerCase();
        const url = String(att.data_url || att.file_url || att.url || att.download_url || att.blob_url || "").toLowerCase();
        return type === "audio" || type === "voice" || mime.startsWith("audio/") || mime.startsWith("video/ogg") || ["ogg", "oga", "opus", "mp3", "wav", "m4a", "aac", "weba", "webm"].includes(ext) || /\.(ogg|oga|opus|mp3|wav|m4a|aac|weba|webm)(\?.*)?$/i.test(url);
      });
      const rawAudioUrl = audioAttachment ? audioAttachment.data_url || audioAttachment.file_url || audioAttachment.url || audioAttachment.download_url || audioAttachment.blob_url : null;
      if ((!messageText || !messageText.trim()) && !audioAttachment && !rawAudioUrl) {
        console.log("[Chatwoot Webhook] Ignorando mensagem vazia ou sem texto/\xE1udio.");
        return res.status(200).send("EMPTY_MESSAGE_IGNORED");
      }
      if (messageId) {
        if (processedMessageIds.has(messageId)) {
          console.log(`[Deduplication] Message ${messageId} already processed or currently processing (in-memory). Ignoring retry.`);
          return res.status(200).send("EVENT_RECEIVED");
        }
        processedMessageIds.add(messageId);
        if (processedMessageIds.size > 1e3) {
          const firstItem = processedMessageIds.values().next().value;
          if (firstItem) processedMessageIds.delete(firstItem);
        }
      }
      res.status(200).send("EVENT_RECEIVED");
      (async () => {
        if (messageId && db) {
          try {
            const msgRef = (0, import_firestore.doc)(db, "processed_messages", messageId);
            const msgSnap = await (0, import_firestore.getDoc)(msgRef);
            if (msgSnap.exists()) {
              console.log(`[Deduplication] Message ${messageId} already processed (Firestore). Ignoring retry.`);
              return;
            }
          } catch (e) {
            console.error("[Deduplication] Error checking Firestore for duplicates:", e.message);
          }
        }
        const storedConfig = await getFirebaseConfig();
        if (!storedConfig) {
          addWebhookLog("error", `Falha ao processar mensagem do Chatwoot`, `Configura\xE7\xE3o da empresa ausente no servidor. Configure os dados no painel.`);
          return;
        }
        const chatwootUrl = (storedConfig?.chatwootUrl || "https://atendimento.andmicrocell.com.br").trim();
        const rawToken = (storedConfig?.chatwootApiAccessToken || process.env.CHATWOOT_API_ACCESS_TOKEN || "Q1DpLpBXSGYWVP7VGunkEkwL").trim();
        const chatwootApiAccessToken = rawToken.replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "").trim();
        const cleanUrl = chatwootUrl.endsWith("/") ? chatwootUrl.slice(0, -1) : chatwootUrl;
        if (storedConfig.autoRespondWhatsApp !== true) {
          addWebhookLog("system", `Mensagem do Chatwoot recebida (Rob\xF4 Desativado)`, `O rob\xF4 recebeu a mensagem de ${customerName}, mas n\xE3o respondeu porque o bot\xE3o "Responder Automaticamente" est\xE1 desativado nas configura\xE7\xF5es.`);
          console.log("[Chatwoot Webhook] Responder Automaticamente est\xE1 desativado. Ignorando processamento.");
          return;
        }
        const mutedPhones = storedConfig.mutedPhones || [];
        const isMuted = mutedPhones.some((phone) => {
          const cleanPhone = String(phone).replace(/\D/g, "");
          const cleanFrom = String(fromNumber).replace(/\D/g, "");
          return cleanFrom === cleanPhone || cleanFrom.endsWith(cleanPhone) || cleanPhone.endsWith(cleanFrom);
        });
        if (isMuted) {
          console.log(`[Silence Mode] Contact ${fromNumber} is muted/silenced. Skipping AI response.`);
          addWebhookLog("system", `Mensagem recebida de ${customerName} (${fromNumber}) [Silenciado]`, `O rob\xF4 est\xE1 SILENCIADO para esta conversa espec\xEDfica. O atendente humano pode responder diretamente.`);
          if (messageId && db) {
            try {
              await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "processed_messages", messageId), { processedAt: (/* @__PURE__ */ new Date()).toISOString() });
            } catch (e) {
            }
          }
          return;
        }
        if (rawAudioUrl) {
          try {
            console.log(`[Audio Processing] Iniciando download do \xE1udio de: ${rawAudioUrl}`);
            addWebhookLog("system", `Processando \xE1udio de ${customerName}`, `Baixando arquivo de voz para transcri\xE7\xE3o...`);
            const fileBuffer = await downloadAudio(rawAudioUrl, cleanUrl, chatwootApiAccessToken);
            let cleanMime = (audioAttachment?.content_type || audioAttachment?.mime_type || "audio/ogg").split(";")[0].trim().toLowerCase();
            if (cleanMime === "audio/opus" || cleanMime === "audio/oga" || cleanMime === "application/ogg" || cleanMime === "video/ogg") {
              cleanMime = "audio/ogg";
            } else if (cleanMime === "audio/x-m4a" || cleanMime === "audio/m4a") {
              cleanMime = "audio/mp4";
            } else if (cleanMime === "audio/mpeg") {
              cleanMime = "audio/mp3";
            } else if (!cleanMime.startsWith("audio/")) {
              cleanMime = "audio/ogg";
            }
            console.log(`[Audio Processing] Download conclu\xEDdo (${fileBuffer.length} bytes, MIME: ${cleanMime}). Transcrevendo com Gemini...`);
            addWebhookLog("system", `Transcrevendo \xE1udio de ${customerName}`, `Enviando arquivo ao Gemini (${fileBuffer.length} bytes, formato ${cleanMime})...`);
            const client = getGeminiClient();
            const response = await client.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [
                {
                  inlineData: {
                    data: fileBuffer.toString("base64"),
                    mimeType: cleanMime
                  }
                },
                "Transcreva este \xE1udio em portugu\xEAs brasileiro de forma extremamente fiel e limpa. Retorne APENAS a transcri\xE7\xE3o literal do \xE1udio, sem adicionar nenhuma introdu\xE7\xE3o, explica\xE7\xF5es, coment\xE1rios ou tags adicionais."
              ]
            });
            const audioTranscription = (response.text || "").trim();
            console.log(`[Audio Processing] Transcri\xE7\xE3o conclu\xEDda: "${audioTranscription}"`);
            if (audioTranscription) {
              addWebhookLog("system", `\xC1udio de ${customerName} transcrito com sucesso`, `Texto: "${audioTranscription}"`);
              messageText = `[\xC1udio do cliente]: ${audioTranscription}`;
            } else {
              console.log("[Audio Processing] O \xE1udio parece estar silencioso ou sem fala compreens\xEDvel.");
              addWebhookLog("system", `\xC1udio de ${customerName} processado`, `O \xE1udio est\xE1 silencioso ou n\xE3o foi poss\xEDvel extrair a fala.`);
              messageText = `[\xC1udio do cliente]: (\xE1udio curto ou silencioso)`;
            }
          } catch (audioErr) {
            console.error("[Audio Processing] Erro ao baixar ou transcrever \xE1udio:", audioErr.message);
            addWebhookLog("error", `Falha ao processar \xE1udio de ${customerName}`, `Erro: ${audioErr.message}`);
            const errorMessage = `Ol\xE1, ${customerName}! Recebi a sua mensagem de \xE1udio, mas tive uma pequena oscila\xE7\xE3o t\xE9cnica de conex\xE3o ao tentar reproduzir. \u{1F3A7} Poderia, por favor, me enviar sua d\xFAvida ou modelo por mensagem de texto? Eu j\xE1 te respondo na hora com o or\xE7amento completo!`;
            const currentHistory = await getWhatsAppHistory(fromNumber);
            const updatedHistory = [
              ...currentHistory,
              { role: "user", text: "[Mensagem de \xC1udio - Falha no processamento]", timestamp: (/* @__PURE__ */ new Date()).toISOString() },
              { role: "model", text: errorMessage, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
            ];
            await saveWhatsAppHistory(fromNumber, updatedHistory, customerName);
            const fallbackAccountId = chatwootAccountId || storedConfig.chatwootAccountId || 1;
            if (chatwootApiAccessToken && fallbackAccountId && chatwootConversationId) {
              await fetch(`${cleanUrl}/api/v1/accounts/${fallbackAccountId}/conversations/${chatwootConversationId}/messages`, {
                method: "POST",
                headers: {
                  "api-access-token": chatwootApiAccessToken,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  content: errorMessage,
                  message_type: "outgoing",
                  private: false
                })
              });
            }
            return;
          }
        }
        if (messageId && db) {
          try {
            await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "processed_messages", messageId), {
              processedAt: (/* @__PURE__ */ new Date()).toISOString(),
              fromNumber,
              customerName,
              messageText: messageText || ""
            });
          } catch (e) {
            console.error("[Deduplication] Error marking message as processed in Firestore:", e.message);
          }
        }
        addWebhookLog("inbound", `Mensagem de ${customerName} recebida via Chatwoot (Conversa #${chatwootConversationId})`, messageText);
        if (chatwootApiAccessToken && chatwootAccountId && chatwootConversationId) {
          try {
            await fetch(`${cleanUrl}/api/v1/accounts/${chatwootAccountId}/conversations/${chatwootConversationId}/update_last_seen`, {
              method: "POST",
              headers: {
                "api-access-token": chatwootApiAccessToken,
                "Content-Type": "application/json"
              }
            });
            console.log(`[Chatwoot] Marcada como lida conversa #${chatwootConversationId} (dois tracinhos azuis).`);
          } catch (readErr) {
            console.warn("[Chatwoot] Aviso ao atualizar status de leitura:", readErr.message);
          }
          try {
            await fetch(`${cleanUrl}/api/v1/accounts/${chatwootAccountId}/conversations/${chatwootConversationId}/toggle_typing_status`, {
              method: "POST",
              headers: {
                "api-access-token": chatwootApiAccessToken,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ typing_status: "on" })
            });
          } catch (e) {
          }
        }
        const history = await getWhatsAppHistory(fromNumber);
        const staticResponse = getStaticGreetingResponse(messageText, history.length);
        let replyText = "";
        if (staticResponse) {
          replyText = staticResponse;
          const updatedHistory = [
            ...history,
            { role: "user", text: messageText, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
            { role: "model", text: replyText, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
          ];
          await saveWhatsAppHistory(fromNumber, updatedHistory, customerName);
        } else {
          const systemInstruction = buildSystemInstruction(storedConfig);
          const contentsList = history.filter((m) => m && m.text && typeof m.text === "string" && m.text.trim()).slice(-6).map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text.trim() }]
          }));
          if (messageText && typeof messageText === "string" && messageText.trim()) {
            contentsList.push({
              role: "user",
              parts: [{ text: messageText.trim() }]
            });
          }
          const contents = [];
          for (const msg of contentsList) {
            if (contents.length > 0 && contents[contents.length - 1].role === msg.role) {
              const lastMsg = contents[contents.length - 1];
              if (lastMsg.parts && lastMsg.parts[0] && msg.parts && msg.parts[0]) {
                lastMsg.parts[0].text = `${lastMsg.parts[0].text}
${msg.parts[0].text}`;
              }
            } else {
              contents.push(msg);
            }
          }
          try {
            const client = getGeminiClient();
            const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
            let generated = false;
            for (const modelName of candidateModels) {
              try {
                const response = await client.models.generateContent({
                  model: modelName,
                  contents,
                  config: {
                    systemInstruction,
                    temperature: 0.7
                  }
                });
                if (response?.text) {
                  replyText = response.text;
                  generated = true;
                  break;
                }
              } catch (modelErr) {
                console.warn(`[Gemini Model ${modelName} Error] ${modelErr.message}. Trying next candidate...`);
                await new Promise((r) => setTimeout(r, 600));
              }
            }
            if (!generated) {
              replyText = `Ol\xE1, ${customerName}! Sou o assistente da ${storedConfig.name}. Como posso te ajudar hoje? Nosso hor\xE1rio \xE9 ${storedConfig.businessHours}.`;
            }
            const updatedHistory = [
              ...history,
              { role: "user", text: messageText, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
              { role: "model", text: replyText, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
            ];
            await saveWhatsAppHistory(fromNumber, updatedHistory, customerName);
          } catch (geminiError) {
            console.warn("Fallback response used in Chatwoot webhook because Gemini failed:", geminiError.message);
            replyText = `Ol\xE1, ${customerName}! Sou o assistente inteligente da ${storedConfig.name}. Como posso te ajudar com seu aparelho hoje?`;
            const updatedHistory = [
              ...history,
              { role: "user", text: messageText, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
              { role: "model", text: replyText, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
            ];
            await saveWhatsAppHistory(fromNumber, updatedHistory, customerName);
          }
        }
        addWebhookLog("outbound", `Resposta gerada pela IA (Chatwoot)`, replyText);
        const finalAccountId = chatwootAccountId || storedConfig.chatwootAccountId || 1;
        if (chatwootApiAccessToken && finalAccountId && chatwootConversationId) {
          const simulatedTypingMs = Math.min(Math.max(600, replyText.length * 8), 1800);
          addWebhookLog("system", `Enviando resposta ao cliente`, `Aguardando ${simulatedTypingMs}ms para digita\xE7\xE3o natural.`);
          await new Promise((resolve) => setTimeout(resolve, simulatedTypingMs));
          try {
            const targetUrl = `${cleanUrl}/api/v1/accounts/${finalAccountId}/conversations/${chatwootConversationId}/messages`;
            const maskedTokenDebug = chatwootApiAccessToken ? `${chatwootApiAccessToken.substring(0, 4)}...${chatwootApiAccessToken.substring(chatwootApiAccessToken.length - 4)} (len: ${chatwootApiAccessToken.length})` : "undefined";
            console.log(`[Chatwoot API DEBUG] Sending to ${targetUrl} using token ${maskedTokenDebug}`);
            const cwResponse = await fetch(targetUrl, {
              method: "POST",
              headers: {
                "api-access-token": chatwootApiAccessToken,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                content: replyText,
                message_type: "outgoing",
                private: false
              })
            });
            const cwResult = await cwResponse.json().catch(() => ({}));
            if (cwResponse.ok) {
              addWebhookLog("system", `Mensagem enviada com sucesso via API do Chatwoot`, `Enviado para a conversa #${chatwootConversationId}.`);
            } else {
              if (cwResponse.status === 401 || cwResponse.status === 403) {
                addWebhookLog("error", `Token do Chatwoot Inv\xE1lido (HTTP ${cwResponse.status})`, `O Chatwoot recusou a autentica\xE7\xE3o.`);
              } else {
                addWebhookLog("error", `Falha ao enviar mensagem via Chatwoot`, `C\xF3digo HTTP: ${cwResponse.status}. Detalhes: ${JSON.stringify(cwResult)}`);
              }
              console.error("[Chatwoot API Error]", cwResult);
            }
          } catch (cwErr) {
            addWebhookLog("error", `Erro ao conectar com a API do Chatwoot`, cwErr.message);
            console.error("[Chatwoot Connection Error]", cwErr);
          } finally {
            try {
              await fetch(`${cleanUrl}/api/v1/accounts/${finalAccountId}/conversations/${chatwootConversationId}/toggle_typing_status`, {
                method: "POST",
                headers: {
                  "api-access-token": chatwootApiAccessToken,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ typing_status: "off" })
              });
              await fetch(`${cleanUrl}/api/v1/accounts/${finalAccountId}/conversations/${chatwootConversationId}/update_last_seen`, {
                method: "POST",
                headers: {
                  "api-access-token": chatwootApiAccessToken,
                  "Content-Type": "application/json"
                }
              });
            } catch (e) {
            }
          }
        } else {
          addWebhookLog("error", `Chatwoot n\xE3o p\xF4de responder`, `Credenciais pendentes ou ausentes na configura\xE7\xE3o (Token: ${chatwootApiAccessToken ? "OK" : "AUSENTE"}, Account ID: ${chatwootAccountId}, Conversation ID: ${chatwootConversationId}).`);
          console.warn("[Chatwoot] Cannot send response because credentials or IDs are missing");
        }
      })().catch((asyncErr) => {
        console.error("Critical error in async background Chatwoot webhook processing:", asyncErr);
        addWebhookLog("error", `Erro cr\xEDtico no processamento ass\xEDncrono`, asyncErr.message);
      });
    } catch (err) {
      console.error("Error in Chatwoot webhook POST:", err);
      addWebhookLog("error", `Erro cr\xEDtico no processamento do Webhook`, err.message);
      try {
        res.status(500).send("INTERNAL_SERVER_ERROR");
      } catch (e) {
      }
    }
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: /* @__PURE__ */ new Date() });
  });
  app.post("/api/chatwoot/test-connection", async (req, res) => {
    try {
      const { chatwootUrl, chatwootApiAccessToken } = req.body;
      if (!chatwootUrl || !chatwootApiAccessToken) {
        return res.status(400).json({ success: false, error: "A URL do Chatwoot e o Token s\xE3o obrigat\xF3rios para o teste." });
      }
      const cleanUrl = chatwootUrl.trim().endsWith("/") ? chatwootUrl.trim().slice(0, -1) : chatwootUrl.trim();
      const rawToken = String(chatwootApiAccessToken || "").trim();
      const token = rawToken.replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "").trim();
      const targetUrl = `${cleanUrl}/api/v1/profile`;
      console.log(`[Chatwoot Test] Testando conex\xE3o com ${cleanUrl}/api/v1/profile`);
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "api-access-token": token,
          "Accept": "application/json"
        }
      });
      if (response.ok) {
        const data = await response.json();
        return res.json({
          success: true,
          message: "Conex\xE3o estabelecida com sucesso!",
          profile: {
            name: data.name || "Agente/Usu\xE1rio",
            email: data.email || ""
          }
        });
      } else {
        const status = response.status;
        let errMsg = `Erro de resposta do servidor Chatwoot (C\xF3digo: ${status})`;
        if (status === 401 || status === 403) {
          errMsg = "Token de acesso pessoal \xE0 API inv\xE1lido. Por favor, cole o Token de Acesso de API obtido em 'Configura\xE7\xF5es do Perfil' no canto inferior esquerdo do seu painel Chatwoot.";
        }
        return res.json({ success: false, error: errMsg });
      }
    } catch (err) {
      console.error("[Chatwoot Test Connection Exception]", err.message);
      return res.json({
        success: false,
        error: `N\xE3o foi poss\xEDvel conectar com a URL informada. Detalhes: ${err.message}. Verifique se a URL est\xE1 correta (ex: https://atendimento.andmicrocell.com.br) e se sua inst\xE2ncia est\xE1 online.`
      });
    }
  });
  app.get("/api/debug-status", async (req, res) => {
    try {
      const storedConfig = await getFirebaseConfig();
      const hasDb = db !== null;
      const maskedToken = storedConfig?.chatwootApiAccessToken ? `${storedConfig.chatwootApiAccessToken.substring(0, 4)}...${storedConfig.chatwootApiAccessToken.substring(storedConfig.chatwootApiAccessToken.length - 4)}` : "MISSING";
      res.json({
        firebaseConnected: hasDb,
        chatwootUrl: storedConfig?.chatwootUrl || "https://atendimento.andmicrocell.com.br (DEFAULT)",
        chatwootTokenLength: storedConfig?.chatwootApiAccessToken?.length || 0,
        chatwootTokenMasked: maskedToken,
        autoRespondWhatsApp: storedConfig?.autoRespondWhatsApp || false,
        envGeminiApiKeySet: !!process.env.GEMINI_API_KEY,
        nodeEnv: process.env.NODE_ENV,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (http://0.0.0.0:${PORT})`);
    const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
    if (keepAliveUrl) {
      console.log(`[Keep-Alive] Configurando ping autom\xE1tico a cada 4 minutos para ${keepAliveUrl}/api/health`);
      setInterval(() => {
        fetch(`${keepAliveUrl}/api/health`).then((res) => console.log(`[Keep-Alive] Ping OK (${res.status})`)).catch((err) => console.warn(`[Keep-Alive] Falha no ping:`, err.message));
      }, 4 * 60 * 1e3);
    }
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
