import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { loadRuntimeEnv } from "./src/env.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { spawn } from "child_process";
import { normalizeAudioBase64, normalizeMimeType } from "./src/audio-transcription.js";

loadRuntimeEnv();

// Prevenção de quebra do servidor em produção (Render / Cloud Run) para nunca derrubar o processo Node.js
process.on('uncaughtException', (err) => {
  console.error(" [FATAL] Uncaught Exception absorvida pelo servidor:", err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(" [FATAL] Unhandled Rejection absorvida pelo servidor:", reason);
});

// Safe resolution of __filename and __dirname for both ESM and CJS bundled environments
const resolvedFilename = typeof __filename !== "undefined" ? __filename : process.cwd();
const resolvedDirname = typeof __dirname !== "undefined" ? __dirname : process.cwd();

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

const addWebhookLog = (direction: WebhookLog['direction'], message: string, details?: string) => {
  const newLog: WebhookLog = {
    id: `wlog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toLocaleTimeString('pt-BR'),
    direction,
    message,
    details
  };
  webhookLogs = [newLog, ...webhookLogs.slice(0, 99)]; // Keep last 100 webhook logs

  if (db) {
    setDoc(doc(db, "webhook_logs", newLog.id), {
      ...newLog,
      createdAtMs: Date.now()
    }).catch(e => {
      console.warn("Failed to persist webhook log to Firestore:", e.message);
    });
  }
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
    } catch (e) {
      console.error("Error reading config file:", e);
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
  let firebaseConfig: any = null;
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  
  if (fs.existsSync(firebaseConfigPath)) {
    try {
      firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
      console.log("Firebase config loaded successfully from firebase-applet-config.json");
    } catch (parseErr: any) {
      console.error("Failed to parse firebase-applet-config.json:", parseErr.message);
    }
  }

  // Fallback to environment variables if JSON config is missing or invalid
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
        firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.DATABASE_ID,
      };
      console.log("Firebase config loaded from environment variables");
    }
  }

  if (firebaseConfig) {
    const firebaseApp = initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    });
    // Initialize Firestore with custom databaseId if configured, else default
    const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
    db = getFirestore(firebaseApp, databaseId);
    console.log("Firebase Firestore initialized successfully in server with Database ID:", databaseId);
  } else {
    console.warn("No Firebase configuration found (neither firebase-applet-config.json nor environment variables are set). Falling back to local files.");
  }
} catch (e: any) {
  console.error("Failed to initialize Firebase:", e.message);
}

// Wrapper for Firestore Config loading/saving with Local File backup/fallback
async function getFirebaseConfig() {
  const localConfig = loadStoredConfig() || {};
  if (db) {
    try {
      const configDocRef = doc(db, "config", "business");
      const snapshot = await getDoc(configDocRef);
      if (snapshot.exists()) {
        const firestoreData = snapshot.data();
        return {
          ...localConfig,
          ...firestoreData,
          chatwootApiAccessToken: (firestoreData.chatwootApiAccessToken || localConfig.chatwootApiAccessToken || "Q1DpLpBXSGYWVP7VGunkEkwL").trim(),
          chatwootUrl: (firestoreData.chatwootUrl || localConfig.chatwootUrl || "https://atendimento.andmicrocell.com.br").trim()
        };
      }
    } catch (e: any) {
      console.error("Error reading config from Firestore:", e.message);
    }
  }
  return localConfig;
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
        localConfig.category !== firestoreConfig.category ||
        (localConfig.chatwootApiAccessToken && localConfig.chatwootApiAccessToken !== firestoreConfig.chatwootApiAccessToken) ||
        (localConfig.chatwootUrl && localConfig.chatwootUrl !== firestoreConfig.chatwootUrl)
      )) {
        console.log("Local config differs from Firestore. Syncing local changes (including Chatwoot token/URL) to Firestore...");
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

// Helper to download audio attachment with authentication headers and storage redirects
async function downloadAudio(rawUrl: string, baseUrl?: string, apiToken?: string): Promise<Buffer> {
  if (!rawUrl) {
    throw new Error("URL de áudio não fornecida.");
  }

  // Handle relative URLs (e.g. /rails/active_storage/blobs/redirect/...)
  let targetUrl = rawUrl.trim();
  if (targetUrl.startsWith("/")) {
    const cleanBase = (baseUrl || "https://atendimento.andmicrocell.com.br").replace(/\/+$/, "");
    targetUrl = `${cleanBase}${targetUrl}`;
  }

  console.log(`[Audio Downloader] Baixando de: ${targetUrl}`);

  // Check if URL points to external storage (S3, Cloudflare R2, Google Cloud Storage, MinIO, Wasabi, etc.)
  const isExternalStorage = /^https?:\/\/[^\/]*(s3[.-]|amazonaws\.com|cloudflarestorage\.com|storage\.googleapis\.com|digitaloceanspaces\.com|backblazeb2\.com)/i.test(targetUrl);

  // If it's direct cloud storage, S3 rejects custom unrecognized headers like 'api-access-token' with 400 Bad Request
  if (isExternalStorage) {
    console.log(`[Audio Downloader] Link direto de armazenamento (S3/Cloud). Baixando sem headers extras...`);
    try {
      const res = await fetch(targetUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (e: any) {
      console.warn(`[Audio Downloader] Falha ao baixar diretamente do S3: ${e.message}`);
    }
  }

  // Try with api-access-token header if available
  const headers: any = {};
  if (apiToken) {
    headers['api-access-token'] = apiToken;
  }
  
  let res = await fetch(targetUrl, { headers });
  
  if (!res.ok) {
    console.warn(`[Audio Downloader] Falha ao baixar com token da API (Status ${res.status}). Tentando sem headers...`);
    res = await fetch(targetUrl);
  }
  
  if (!res.ok && apiToken) {
    console.warn(`[Audio Downloader] Tentando com cabeçalho Bearer...`);
    res = await fetch(targetUrl, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
  }
  
  if (!res.ok) {
    throw new Error(`Não foi possível baixar o arquivo de áudio. Status retornado: ${res.status}`);
  }
  
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helper to get conversation history
async function getWhatsAppHistory(fromNumber: string): Promise<any[]> {
  const cleanNumber = String(fromNumber).replace(/\D/g, "");
  if (!cleanNumber) return [];

  // Try reading from Firestore first
  if (db) {
    try {
      const historyDocRef = doc(db, "whatsapp_history", cleanNumber);
      const snapshot = await getDoc(historyDocRef);
      if (snapshot.exists()) {
        const messages = snapshot.data().messages || [];
        // Save a copy of the latest Firestore messages to local files and memory cache
        try {
          ensureConfigDir();
          const historyFilePath = path.join(configDir, `history_${cleanNumber}.json`);
          fs.writeFileSync(historyFilePath, JSON.stringify({ messages }, null, 2), "utf8");
        } catch (e) {}
        inMemoryHistoryCache[cleanNumber] = messages;
        return messages;
      }
    } catch (e: any) {
      console.error(`Error reading WhatsApp history from Firestore for ${cleanNumber}:`, e.message);
    }
  }

  // Fallback 1: Read from local JSON backup on disk (very useful for Render restarts!)
  try {
    ensureConfigDir();
    const historyFilePath = path.join(configDir, `history_${cleanNumber}.json`);
    if (fs.existsSync(historyFilePath)) {
      const fileData = JSON.parse(fs.readFileSync(historyFilePath, "utf8"));
      const messages = fileData.messages || [];
      inMemoryHistoryCache[cleanNumber] = messages;
      return messages;
    }
  } catch (fileErr: any) {
    console.error(`Error reading local backup history file for ${cleanNumber}:`, fileErr.message);
  }

  // Fallback 2: Read from in-memory cache
  return inMemoryHistoryCache[cleanNumber] || [];
}

// Helper to save message to history
async function saveWhatsAppHistory(fromNumber: string, messages: any[], customerName?: string) {
  const cleanNumber = String(fromNumber).replace(/\D/g, "");
  if (!cleanNumber) return;

  const sliced = messages.slice(-15); // Keep the last 15 messages for context
  
  const docData: any = { 
    messages: sliced,
    customerPhone: cleanNumber,
    lastUpdated: new Date().toISOString()
  };
  if (customerName) {
    docData.customerName = customerName;
  }

  // 1. Save to Firestore
  if (db) {
    try {
      const historyDocRef = doc(db, "whatsapp_history", cleanNumber);
      await setDoc(historyDocRef, docData, { merge: true });
    } catch (e: any) {
      console.error(`Error saving WhatsApp history to Firestore for ${cleanNumber}:`, e.message);
    }
  }

  // 2. Save backup to local JSON file
  try {
    ensureConfigDir();
    const historyFilePath = path.join(configDir, `history_${cleanNumber}.json`);
    let existingData: any = {};
    if (fs.existsSync(historyFilePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(historyFilePath, "utf8"));
      } catch (e) {}
    }
    const mergedLocal = { ...existingData, ...docData };
    fs.writeFileSync(historyFilePath, JSON.stringify(mergedLocal, null, 2), "utf8");
  } catch (fileErr: any) {
    console.error(`Error writing local backup history file for ${cleanNumber}:`, fileErr.message);
  }

  // 3. Keep in-memory cache updated
  inMemoryHistoryCache[cleanNumber] = sliced;
}

function getStaticGreetingResponse(messageText: string, historyLength: number): string | null {
  if (!messageText) return null;
  
  // Only intercept if this is the very first message of the conversation
  if (historyLength > 0) return null;

  const text = messageText.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  
  // Common simple Portuguese greetings
  const shortGreetings = [
    "oi", "oii", "oiii", "ola", "olá", "bom dia", "boa tarde", "boa noite", 
    "tudo bem", "tudo bem?", "opa", "salve", "olá bom dia", "olá boa tarde", 
    "olá boa noite", "oi bom dia", "oi boa tarde", "oi boa noite", "opa tudo bem",
    "tem alguém aí", "tem alguém", "atendimento", "suporte", "olá!", "oi!", "bom dia!",
    "boa tarde!", "boa noite!"
  ];

  // Specific check for simple common greetings
  const isDirectGreeting = shortGreetings.includes(text) || shortGreetings.some(g => text.startsWith(g) && text.length <= g.length + 3);

  // Tech or specific keywords indicating a problem or query is already described (do NOT intercept if present)
  const techKeywords = [
    "conserto", "formatação", "formatar", "tela", "bateria", "celular", "iphone", 
    "placa", "notebook", "conector", "sensor", "camera", "câmera", "carregar", 
    "vício", "viciado", "viciada", "valor", "preço", "orçamento", "quanto", 
    "molhou", "desoxidação", "consertar", "quebrou", "trincou", "parou", "liga", 
    "conecta", "troca", "trocar", "orçamento", "conserto", "computador"
  ];

  const containsTech = techKeywords.some(keyword => text.includes(keyword));

  // Count words
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Intercept if:
  // - It's a direct greeting, or
  // - It's a very short message (3 words or less) and does not contain technical words, AND does not contain tech keywords at all
  if ((isDirectGreeting || (wordCount <= 3 && !containsTech)) && !containsTech) {
    return "Olá! Seja muito bem-vindo(a) à *Andmicrocell Soluções*! 🌟\n\nPara que eu possa te passar as informações e estimativas de preço de forma super rápida, por favor me envie:\n\n1️⃣ O *modelo e marca* do seu aparelho (ex: Samsung A32, iPhone 11, etc.)\n2️⃣ O *defeito ou problema* que ele está apresentando\n\nAssim que você me enviar esses detalhes, eu já te passo as opções e valores na hora! 😉";
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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

  // Redirecionar /webhook ou /webhook/ para /api/webhook/whatsapp internamente para suportar URLs simplificadas no Chatwoot
  app.use((req, res, next) => {
    const cleanPath = req.path.replace(/\/$/, "");
    if (cleanPath === "/webhook") {
      req.url = "/api/webhook/whatsapp";
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
      const apiKey = [
        process.env.GEMINI_API_KEY,
        process.env.GOOGLE_API_KEY,
        process.env.VITE_GEMINI_API_KEY,
      ].find((key) => typeof key === "string" && key.trim() && key !== "MY_GEMINI_API_KEY");

      if (!apiKey) {
        throw new Error("GEMINI_API_KEY/GOOGLE_API_KEY environment variable is not configured.");
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
    const { name, category, address, phone, businessHours, specialOffers, tone, faqs, pricingTable } = config;
    
    let faqText = faqs && faqs.length > 0 
      ? faqs.map((f: any) => `P: ${f.question}\nR: ${f.answer}`).join("\n\n")
      : "Nenhuma cadastrada.";

    let pricingText = pricingTable && pricingTable.length > 0
      ? pricingTable.map((p: any) => `- Aparelho/Modelo: ${p.deviceModel} | Serviço: ${p.serviceName} | Estimativa de Preço: ${p.priceEstimate}${p.notes ? ` (Notas: ${p.notes})` : ""}`).join("\n")
      : `Tabela de Preços Geral de Referência:\n` +
        `- Aparelho/Modelo: iPhone 11 | Serviço: Troca de Tela Premium (OLED) | Estimativa de Preço: A partir de R$ 320 (Notas: Tela qualidade premium com True Tone ativo naturalmente.)\n` +
        `- Aparelho/Modelo: iPhone 11 | Serviço: Troca de Bateria Premium | Estimativa de Preço: A partir de R$ 180 (Notas: Excelente durabilidade, similar à original de fábrica.)\n` +
        `- Aparelho/Modelo: iPhone 12 | Serviço: Troca de Tela Premium (OLED) | Estimativa de Preço: A partir de R$ 550 (Notas: Tela qualidade premium com True Tone ativo.)\n` +
        `- Aparelho/Modelo: iPhone 12 | Serviço: Troca de Bateria Premium | Estimativa de Preço: A partir de R$ 260 (Notas: Excelente durabilidade, similar à original de fábrica.)\n` +
        `- Aparelho/Modelo: iPhone 13 | Serviço: Troca de Tela Premium (OLED) | Estimativa de Preço: A partir de R$ 850 (Notas: Tela premium, cores e toque perfeitos.)\n` +
        `- Aparelho/Modelo: iPhone 13 | Serviço: Troca de Bateria Premium | Estimativa de Preço: A partir de R$ 350 (Notas: Excelente durabilidade, similar à original de fábrica.)\n` +
        `- Aparelho/Modelo: Samsung Linha S (S20/S21) | Serviço: Troca de Tela Premium | Estimativa de Preço: A partir de R$ 650 (Notas: Qualidade premium com alta definição de toque.)\n` +
        `- Aparelho/Modelo: Notebooks (Dell, Lenovo, HP, etc) | Serviço: Instalação de SSD 240GB + Limpeza Interna + Formatação | Estimativa de Preço: A partir de R$ 220 (Notas: Garante até 10x mais velocidade de inicialização.)\n` +
        `- Aparelho/Modelo: Notebooks (Dell, Lenovo, HP, etc) | Serviço: Instalação de SSD 480GB + Limpeza Interna + Formatação | Estimativa de Preço: A partir de R$ 290 (Notas: Garante até 10x mais velocidade de inicialização e muito mais espaço.)\n` +
        `- Aparelho/Modelo: Notebooks (Qualquer marca) | Serviço: Limpeza Física Interna + Troca de Pasta Térmica Prata | Estimativa de Preço: R$ 100 (Notas: Essencial para evitar lentidão e desligamento por superaquecimento.)\n` +
        `- Aparelho/Modelo: iPhone (Qualquer modelo) | Serviço: Serviço Adicional de Transplante (EEPROM ou BMS) | Estimativa de Preço: R$ 150 adicionais (Notas: Procedimento de micro-solda opcional para remover a mensagem de peça desconhecida.)\n` +
        `- Aparelho/Modelo: Celulares (Geral) | Serviço: Desoxidação Química Profissional (Aparelhos molhados) | Estimativa de Preço: A partir de R$ 120 (Notas: Processo de lavagem química em cuba ultrassônica para remover oxidações.)`;

    const brazilTime = getBrazilDateTime();
    const brazilStatus = getBrazilStatus();

    const formattingPricesText = `
Tabela de Preços - Formatação e Backup (PCs e Notebooks):
- Formatação Simples (sem backup de arquivos): R$ 90,00
- Formatação com Backup de até 70 GB: R$ 110,00
- Formatação com Backup de 70 GB a 200 GB: R$ 120,00
- Formatação com Backup de 200 GB a 400 GB: R$ 160,00
- Formatação com Backup de 400 GB a 600 GB: R$ 190,00
- Formatação com Backup de 600 GB a 1000 GB (1 TB): R$ 230,00
`;

  const buildOperationsSystemInstruction = (config: any) => {
    const { name, category, phone, businessHours, address, specialOffers } = config || {};

    return `Você é a Agente Operacional da empresa ${name || "AndMicrocell"}.

Objetivo:
- Atuar como assistente de operação, gestão e tomada de decisão.
- Responder para o time interno (não para clientes finais).

Contexto da empresa:
- Segmento: ${category || "assistência técnica"}
- Telefone principal: ${phone || "não informado"}
- Horário comercial: ${businessHours || "não informado"}
- Endereço: ${address || "não informado"}
- Ofertas atuais: ${specialOffers || "não informado"}

Diretrizes de resposta:
1. Use Português do Brasil.
2. Seja direta, objetiva e orientada à ação.
3. Estruture sempre em 4 blocos curtos:
   - Situação
   - Ação Recomendada
   - Risco
   - Próximo Passo
4. Quando faltar dado, diga exatamente o que está faltando e sugira como obter.
5. Nunca responder como atendimento ao cliente nessa aba; o foco é operação interna.
6. Evite textos longos e genéricos; priorize checklist e execução.
`;
  };

    const hardwareRulesText = `
Regras Específicas de Preços de Computadores e Notebooks (MUITO IMPORTANTE):
1. Manutenção Preventiva de Notebooks:
   - Notebook Básico/Comum: R$ 90,00.
   - Notebook Gamer ou topo de linha/caro: Valor sob consulta (o risco e a complexidade de manuseio são maiores, por isso exige responsabilidade diferenciada do técnico).
2. Manutenção Preventiva de Computadores (Desktops):
   - PC Gamer: R$ 250,00.
     * Como identificar se é PC Gamer? Caracterizado por peças como: gabinete com 3 ou mais fans/ventoinhas, placa de vídeo dedicada (offboard), refrigeração líquida (watercooler) ou componentes de alta performance. Mesmo se não tiver watercooler, se for de jogos, é considerado PC Gamer.
3. Instalação de Memória RAM ou Armazenamento SSD (Serviço Simples):
   - PC ou Notebook Simples/Comum: R$ 60,00.
   - PC ou Notebook Gamer ou topo de linha: R$ 150,00 a R$ 180,00 (devido à complexidade de desmontagem, dissipadores robustos de calor e cuidados de manipulação).
4. Outros serviços não listados: Sempre informe que é necessário analisar presencialmente ou consultar o técnico.

Regra de Orçamento Inteligente com Margem em Cascata para Reparos de Celular (Telas, Baterias, etc.):
- Se o cliente perguntar o preço de uma troca de tela ou bateria de celular que não esteja na tabela de preços padrão, e você souber ou for consultar o custo da peça do fornecedor:
  * A fórmula oficial em cascata é: Preço Final = (Custo da Peça + 50%) + 40%.
  * Exemplo explicativo: Se a peça custa R$ 100,00 no fornecedor, adicionamos 50% (R$ 150,00) e depois adicionamos 40% (R$ 210,00) sobre o subtotal. O valor repassado ao cliente é R$ 210,00.

Nova Categoria Premium de Serviços: Sistemas de Gestão e Automação de WhatsApp para Empresas:
- Além de assistência técnica física para computadores, notebooks e celulares, a AndMicrocell possui agora um setor de engenharia de software premium.
- Nós desenvolvemos sistemas de gestão comercial e de controle de estoque super completos, além de robôs inteligentes integrados com inteligência artificial para automatizar o WhatsApp de outras empresas (exatamente como este assistente que está conversando com você!).
- Diretriz de Prospecção (MUITO IMPORTANTE):
  * No início da conversa (seja na saudação de boas-vindas ou na primeira interação oportuna), inclua de forma super amigável e breve um gancho promocional, por exemplo:
    "Sabia que além de consertar aparelhos, nós também desenvolvemos sistemas de estoque e robôs inteligentes para o WhatsApp de outras empresas? Se quiser automatizar seu negócio, me avisa! 😉"
  * Se o cliente demonstrar qualquer interesse, interesse em orçamento ou curiosidade sobre esse serviço de automação ou sistema de estoque:
    1. Explique brevemente que nossos robôs atendem clientes 24h, tiram dúvidas de suporte, fazem orçamentos e agendamentos automáticos, enquanto nossos sistemas organizam todo o estoque e vendas de forma profissional.
    2. Ofereça para agendar uma demonstração gratuita e sem compromisso diretamente com o nosso Diretor de Tecnologia e Engenheiro Responsável, o Anderson.
    3. Colete o nome do cliente, o nome da empresa dele e o segmento para que o Anderson entre em contato com um plano personalizado!
`;

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

PORTFÓLIO DE SERVIÇOS, REGRAS DE POSICIONAMENTO COMERCIAL E DIRETRIZES DE ATENDIMENTO (BASE DE CONHECIMENTO):

1. ESCOPO DE ATENDIMENTO E DISPOSITIVOS SUPORTADOS:
   - Smartphones / Celulares: iPhone (iOS) e Android (suporte e reparo completos).
   - Informática: Notebooks e Computadores de mesa (Desktop) (suporte técnico e manutenção).
   - AirPods (Apple): Reparos disponíveis, mas NÃO divulgue ativamente. Informar/confirmar apenas se o cliente perguntar diretamente.
   - Macbooks e outros produtos: NÃO prestamos suporte no momento.

2. TIPOS DE REPARO E LIMITAÇÕES TÉCNICAS:
   - Celulares e iPhones (iOS / Android): Realizamos reparos avançados em placas eletrônicas por micro-soldagem.
   - Notebooks e Computadores (Desktops): NÃO realizamos reparos avançados em placas-mãe por razões técnicas. Nossos reparos eletrônicos de placa são voltados única e exclusivamente para a linha de celulares.
   - Serviços autorizados/permitidos em placas de notebooks/PCs: Troca de entrada de carga / conector DC Jack, regravação de EPROM (BIOS) e outros reparos de componentes periféricos/básicos de hardware.

3. REGRA DE IDENTIFICAÇÃO DE DEFEITO DE PLACA (TRIAGEM DA IA):
   - Como a IA identifica se é problema de placa?
     * Critério Principal: Verificar se o aparelho já passou por outra assistência técnica especializada em reparos e se o cliente possui um laudo/diagnóstico prévio.
     * Atenção: Se o cliente disser apenas "não dá sinal de nada" ou "acho que é placa", orientar educadamente que pode ser outro defeito mais simples (como conector, bateria, fonte ou regravação de EPROM) passível de conserto na nossa loja física.
     * Orientação ao Cliente: Mesmo que o cliente já tenha um laudo de placa com defeito vindo de outra assistência, ele pode trazer o equipamento para uma nova avaliação técnica presencial gratuita e sem compromisso conosco.

4. LINHA GAMER E COMPUTADORES/NOTEBOOKS:
   - Somos altamente especialistas em Linha Gamer: fazemos manutenção preventiva e corretiva completa para PCs e Notebooks Gamer (desmontagem, limpeza, troca de pasta térmica de prata, etc.).
   - Software para PCs/Notebooks: Realizamos formatação, reinstalação de sistema e instalação de programas de forma profissional.

5. SERVIÇOS DE SOFTWARE PARA CELULARES:
   - Serviços Permitidos:
     * Atualização/passagem de sistema para resolver falhas/bugs.
     * Desbloqueio de senha da tela:
       - Modalidade 1: Tentativa sem perda de dados.
       - Modalidade 2: Em caso de falha da Modalidade 1 (e com autorização/ciência prévia do cliente), fazemos reinstalação do sistema zerando tudo.
       - Nota iPhone: O cliente precisa obrigatoriamente saber a senha do iCloud para reativar após o procedimento.
   - NÃO Realizados (Estritamente Proibidos):
     * NÃO fazemos remoção de Conta Google (FRP).
     * NÃO fazemos remoção de Conta Xiaomi (Mi Account).
     * NÃO fazemos desbloqueio Payjoy.

6. RECICLAGEM E COMPRA DE APARELHOS:
   - Doação: Recebemos aparelhos de celular/notebook/PC para doação e reciclagem adequada.
   - Compra de Aparelhos: Compramos apenas se for valor simbólico/baixo (para descarte/reaproveitamento de peças) e se tiver procedência garantida (clientes conhecidos/da casa).
   - NÃO compramos de pessoas que dizem ter "achado" o aparelho ou se estiver bloqueado/duvidoso.
   - Conduta da IA: A IA deve encaminhar esse tipo de atendimento (sobre compra de aparelhos ou ofertas suspeitas) diretamente para o atendimento humano.

7. LIMPEZA DE CONECTOR E BRINDES:
   - Limpeza de Conector de Carga:
     * Serviço pago e profissional (realizado em bancada sob microscópio para preservar a integridade do pino de carga).
     * Cortesia (Grátis): Exclusivamente para clientes realizando serviços principais como troca de tela, bateria ou reparo de placa.
     * Triagem da IA: Se perguntarem quanto é a limpeza de conector, a IA NÃO deve dar diagnóstico prévio dizendo que é "só sujeira" (pois pode ser defeito elétrico ou físico no próprio conector/circuito). Oriente o cliente a trazer para avaliação presencial.
   - Brindes: Película grátis exclusivamente para quem realizar troca de tela completa do celular.

8. HORÁRIO DE ATENDIMENTO E SERVIÇO DE URGÊNCIA (FORA DE HORÁRIO / PLANTÃO):
   - Horário de Funcionamento: Mantém o horário padrão de funcionamento comercial da loja.
   - Atendimento de Urgência / Plantão: Realizamos atendimentos fora do horário comercial, finais de semana ou domingos, mediante taxa/valor adicional pelo serviço de urgência.
   - Casos típicos de Urgência:
     * Clientes vindos de outras cidades que buscam atendimento especializado de urgência.
     * Casos de aparelhos que caíram em líquidos (urgência para evitar corrosão avançada na placa do aparelho).
   - Triagem da IA: A IA pode informar sobre a possibilidade de atendimento de urgência/fora do horário com taxa adicional e encaminhar o cliente diretamente para o atendimento humano confirmar a disponibilidade do técnico de plantão.

9. POLÍTICA PARA APARELHOS MOLHADOS / CONTATO COM LÍQUIDOS:
   - Casos Gerais (Água/Líquidos): Atendemos normalmente com alta prioridade e recomendação de urgência.
   - Aparelhos que Caíram na Privada / Vaso Sanitário / Esgoto / Efluentes:
     * Regra Rígida: NÃO realizamos manutenção nesse tipo de serviço por sérias questões sanitárias, de higiene do laboratório e contaminação biológica.
     * Exceções Raras: Apenas se a água estava 100% limpa, mas passará por rigorosa verificação presencial. Se for constatado qualquer odor ou vestígio orgânico/urina/fezes no momento do recebimento, o serviço é recusado e descartado imediatamente.
     * Conduta da IA: Se a IA perceber ou o cliente mencionar que o aparelho caiu no vaso sanitário, efluentes ou esgoto, a IA deve orientar de forma educada que não realizamos manutenção nesse tipo de ocorrência por normas sanitárias e de biossegurança do laboratório técnico.

10. PROCESSO DE ORDEM DE SERVIÇO (OS) E GARANTIA:
    - Abertura de OS: Todo atendimento presencial gera uma Ordem de Serviço (OS) completa, registrando dados do cliente, modelo e relato minucioso do defeito.
    - Garantia: Finalizado o conserto, emitimos o termo de garantia oficial do serviço realizado para total segurança.

11. SEGURANÇA E TRANSPARÊNCIA DO LABORATÓRIO (CLIENTES DESCONFIADOS):
    - Monitoramento por Câmeras: Nosso laboratório e loja possuem sistema completo de circuito interno de TV com filmagem e monitoramento contínuo das bancadas.
    - Clientes Desconfiados/Complicados: Se a IA identificar um cliente inseguro, desconfiado ou muito exigente quanto ao processo de reparo, ela pode e deve reforçar a transparência do nosso trabalho, destacando a abertura formal de OS e a segurança do laboratório 100% monitorado por câmeras.

12. QUALIDADE DE PEÇAS E PROCEDIMENTOS (DIFERENCIAIS):
    - Qualidade de Telas e Baterias Premium: Nossas telas de reposição são de qualidade OLED Premium e já vêm com o recurso True Tone ativo de fábrica naturalmente (sem precisar de nenhum transplante). A imagem e o toque são perfeitos como a original. Nossas baterias Premium também possuem excelente durabilidade e rendimento idênticos aos da original de fábrica.
    - Diferencial Técnico Opcional (EPROM/BMS): Oferecemos um procedimento opcional de transplante do chip EEPROM original (da tela) e do controlador BMS (da bateria) para aqueles clientes mais exigentes que não desejam ver a mensagem de aviso de "tela desconhecida" ou "bateria desconhecida" nas configurações do iOS. Como estamos no interior de Pernambuco, a grande maioria dos clientes desconhece esses termos técnicos e quase nunca pede isso. Por isso, NÃO ofereça esse serviço proativamente. Sempre informe o preço padrão da tela/bateria primeiro. Apenas mencione o transplante se o cliente demonstrar forte preocupação com avisos de peças nas configurações ou com a saúde da bateria. Explique de maneira simples: "fazemos um procedimento opcional de transferência do chip original do seu aparelho para manter todas as funções 100% ativas e sem nenhuma mensagem de aviso no sistema". Este serviço de alta precisão é opcional e tem um custo adicional de aproximadamente R$ 150 sobre o valor da troca.
    - Troca de Vidro da Tela: NÃO realizamos o serviço de troca exclusiva de vidro da tela no momento. Se o cliente perguntar por troca de vidro, explique educadamente que trabalhamos com a substituição do módulo completo de tela premium, mas destaque que já estamos planejando e viabilizando a compra dos maquinários especiais para implantar o serviço de troca de vidro em breve!

Data e Hora Atual de Atendimento (Fuso Horário de Caruaru/PE, Brasil):
- Dia da semana: ${brazilTime.weekday}
- Data de hoje: ${brazilTime.date}
- Horário atual: ${brazilTime.time}
- Status de Funcionamento Atual da Loja Física: ${brazilStatus.statusMessage}

Base de Conhecimento (Perguntas Frequentes / FAQs):
${faqText}

Tabela de Preços Geral de Referência para Orçamentos (SÓ passe o valor se o cliente insistir ou pedir orçamento específico, priorizando sempre a visita física logo em seguida):
${pricingText}
${formattingPricesText}
${hardwareRulesText}

Diretrizes de Conversação (MUITO IMPORTANTE):
1. Estilo Bate-Papo de WhatsApp: Fale de forma extremamente curta, direta e objetiva, exatamente como um ser humano digitaria no WhatsApp de forma rápida. Evite parágrafos longos, explicações prolixas e mensagens cheias de rodeios ou tentativas forçadas de engajamento em massa.
2. Limite de Tamanho Rigoroso (CRÍTICO): Cada resposta enviada por você DEVE conter no máximo 1 ou 2 parágrafos curtos, e cada parágrafo deve ter no máximo 1 ou 2 linhas curtas! Seja extremamente sucinto. Reduza seu vocabulário ao essencial.
3. Exemplos Práticos de Estilo:
   * EXEMPLO RUIM (NÃO responda assim de forma alguma):
     "Com certeza posso te dar uma estimativa! 😉 Para a formatação completa, que já inclui o backup de todos os seus dados e a otimização do sistema, o valor começa a partir de R$ 120. Mas olha, para te dar um valor exato e ver se seu notebook não precisa de mais nada para ficar voando, o ideal é nosso técnico fazer uma avaliação 100% gratuita no nosso laboratório. Assim, você tem um orçamento super preciso e sem compromisso! Que tal trazer ele na segunda-feira, a partir das 8h? Nossa loja estará aberta e pronta para te atender! 😊"
   * EXEMPLO BOM (Responda exatamente com este nível de objetividade e rapidez):
     "A formatação simples é R$ 90, e com backup fica a partir de R$ 110. 😉\n\nQue tal trazer o aparelho aqui na loja para fazermos uma avaliação gratuita?"
4. Uma Coisa de Cada Vez: Não entregue todas as informações ou múltiplos caminhos de uma só vez. Faça perguntas curtas para entender a necessidade real do cliente passo a passo.
5. Memória Recente: Preste muita atenção ao histórico de mensagens anteriores. Se o cliente acabou de dizer o nome do aparelho, qual o problema ou o que ele deseja, dê continuidade e jamais repita a mesma pergunta ou peça para ele dizer novamente.
6. Limite de Emojis: Use no máximo 1 emoji por mensagem. Mensagens com múltiplos emojis parecem artificiais.
7. Gerenciamento do Horário de Atendimento (MUITO CRÍTICO):
   O status atual de funcionamento da loja física é: ${brazilStatus.statusMessage}.
   - Se o status indicar que a loja está "FECHADA" (ou seja, hoje é Domingo, Sábado fora do horário, ou dias de semana à noite/almoço):
     * Você DEVE ser 100% transparente com o cliente. Logo nas primeiras mensagens, deixe absolutamente claro que a loja física está FECHADA no momento ou que estamos fora do horário de expediente comercial.
     * Diga explicitamente algo amigável como: "Olá! No momento nossa loja física está fechada/fora do horário de atendimento, mas eu sou o assistente virtual da AndMicrocell e posso ir registrando todos os detalhes do seu aparelho para adiantar seu atendimento!"
     * Comunique com total clareza que, mesmo fora do horário de funcionamento comercial, você está ativo para dar andamento na conversa, coletar as informações do aparelho e do problema técnico para deixar tudo pronto no sistema.
     * Explique que assim que a equipe técnica retornar no primeiro horário útil, eles analisarão tudo para resolver, ou que você irá verificar com a equipe a possibilidade de un técnico de plantão prestar um suporte especial emergencial.
     * NUNCA dê a entender que o atendimento presencial ou final está ativo agora se estiver FECHADA. Deixe bem nítido que a loja está fechada, mas que o assistente virtual (você) resolve tudo por aqui e deixa engatilhado para os técnicos.
    - Se o status indicar que a loja está "ABERTA":
      * Siga com o atendimento normal de expediente comercial.
8. Honestidade e Segurança: NUNCA invente informações sobre preços, serviços ou políticas que não estejam descritas acima. Se não souber a resposta ou se o cliente fizer uma pergunta muito específica de preço que não conste na tabela de preços nem na base de conhecimento, explique de forma amigável e profissional que não tem o valor exato no sistema e convide-o calorosamente a trazer para uma avaliação gratuita na loja ou peça para ele aguardar um momento que um atendente humano irá assumir o atendimento para dar todos os detalhes.
9. Responda sempre em Português do Brasil.
10. Encerramento Objetivo da Conversa: Quando o cliente se despedir, agradecer ("Obrigado", "Valeu", "Tudo certo", "Entendido", "Tchau", "Boa noite", etc.) ou der sinais claros de que a dúvida foi resolvida e o atendimento se encerrou, responda de forma final, extremamente direta, amigável e objetiva. NUNCA faça novas perguntas redundantes ("Posso ajudar em algo mais?") ou tente prolongar a conversa desnecessariamente. Apenas agradeça, deseje um excelente dia/noite ou agende um horário para ele trazer o aparelho, e encerre por ali.`;
  };

  // Live Audio Transcription API using Gemini 2.5 Flash
  app.post("/api/agent/transcribe-audio", async (req, res) => {
    try {
      const { audioBase64, mimeType = "audio/webm" } = req.body;

      if (!audioBase64) {
        return res.status(400).json({ error: "Nenhum dado de áudio fornecido." });
      }

      const cleanBase64 = normalizeAudioBase64(audioBase64);
      const cleanMimeType = normalizeMimeType(mimeType);

      if (!cleanBase64) {
        return res.status(400).json({ error: "O payload de áudio está vazio ou inválido." });
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
          "Transcreva este áudio em português brasileiro de forma extremamente limpa, natural e fiel. Retorne APENAS a transcrição literal do áudio falado, sem adicionar nenhuma explicação, sem aspas, sem prefixos ou comentários adicionais."
        ]
      });

      const transcription = (response.text || "").trim();
      return res.json({ 
        success: true, 
        transcription: transcription || "Áudio recebido (sem fala compreensível)" 
      });
    } catch (err: any) {
      console.error("[Transcribe Audio API Error]:", err.message);
      return res.status(500).json({ 
        success: false, 
        error: err.message || "Falha ao transcrever o áudio." 
      });
    }
  });

  // Live WhatsApp Chat Simulation API
  app.post("/api/agent/chat", async (req, res) => {
    try {
      const { config, messages, mode } = req.body;
      const normalizedMode = mode === "operations" ? "operations" : "customer_support";

      if (!config) {
        return res.status(400).json({ error: "Configuração do agente ausente." });
      }

      if (normalizedMode === "customer_support") {
        const lastUserMessage = messages[messages.length - 1]?.text || "";
        const historyLength = messages.length - 1;
        const staticResponse = getStaticGreetingResponse(lastUserMessage, historyLength);

        if (staticResponse) {
          return res.json({ text: staticResponse });
        }
      }

      const systemPrompt =
        normalizedMode === "operations"
          ? buildOperationsSystemInstruction(config)
          : buildSystemInstruction(config);
      
      // Structure chat messages in standard format, keeping only the last 6 messages for consistency and speed
      const contents = messages.slice(-6).map((m: any) => {
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
            temperature: 0.7,
          }
        });

        const replyText = response.text || "Desculpe, não entendi a sua mensagem. Poderia repetir?";
        return res.json({ text: replyText });
      } catch (geminiError: any) {
        console.warn("Using fallback response because Gemini API failed or is unconfigured:", geminiError.message);
        
        // Dynamic smart fallback simulation in Portuguese based on keywords
        const lastUserMessage = messages[messages.length - 1]?.text?.toLowerCase() || "";
        let fallbackResponse = `Olá! Sou o assistente virtual da ${config.name}. Como posso ajudar?`;
        
        if (lastUserMessage.includes("horario") || lastUserMessage.includes("horário") || lastUserMessage.includes("abre") || lastUserMessage.includes("fecha")) {
          fallbackResponse = `Nosso horário de funcionamento é: ${config.businessHours || "de segunda a sexta, das 9h às 18h"}. Ficamos muito felizes com o seu interesse!`;
        } else if (lastUserMessage.includes("endereco") || lastUserMessage.includes("endereço") || lastUserMessage.includes("onde") || lastUserMessage.includes("localizacao") || lastUserMessage.includes("localização")) {
          fallbackResponse = config.address 
            ? `Nós estamos localizados em: ${config.address}. Venha nos visitar!`
            : `Nós atuamos principalmente de forma digital ou com entregas diretas!`;
        } else if (lastUserMessage.includes("preco") || lastUserMessage.includes("preço") || lastUserMessage.includes("quanto") || lastUserMessage.includes("valor")) {
          fallbackResponse = `Para valores e orçamentos detalhados do nosso segmento de ${config.category}, fale com nossos especialistas! O que exatamente você procura?`;
        } else if (config.faqs && config.faqs.length > 0) {
          // Attempt to match an FAQ
          const matchedFaq = config.faqs.find((f: any) => 
            lastUserMessage.includes(f.question.toLowerCase()) || 
            f.question.toLowerCase().split(" ").some((word: string) => word.length > 4 && lastUserMessage.includes(word))
          );
          if (matchedFaq) {
            fallbackResponse = matchedFaq.answer;
          }
        }

        return res.json({ 
          text: fallbackResponse, 
          isSimulatedFallback: true,
          apiKeyNotice: "Configure a GEMINI_API_KEY no painel Secrets do AI Studio para obter respostas dinâmicas em tempo real com IA!"
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
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Cliente: ${authorName}\nNota: ${rating} estrelas\nComentário: "${comment || "Sem comentário escrito, apenas atribuiu estrelas"}"`,
          config: {
            systemInstruction,
            temperature: 0.8,
          }
        });

        const replyText = response.text || `Muito obrigado pela sua avaliação, ${authorName}! Ficamos felizes em te atender.`;
        return res.json({ reply: replyText });
      } catch (geminiError: any) {
        console.warn("Using fallback response for review reply:", geminiError.message);
        
        let replyText = `Muito obrigado pela sua avaliação de ${rating} estrelas, ${authorName}! Ficamos muito gratos pelo feedback e trabalhamos constantemente para oferecer o melhor em ${config.category}.`;
        
        if (rating <= 2) {
          replyText = `Olá, ${authorName}. Lamentamos muito que sua experiência não tenha sido ideal. Valorizamos muito o seu feedback e gostaríamos de entender melhor o ocorrido. Por favor, entre em contato conosco pelo telefone ${config.phone} para que possamos resolver a situação diretamente.`;
        } else if (rating === 3) {
          replyText = `Olá, ${authorName}. Agradecemos por sua avaliação e pelo feedback construtivo. Estamos sempre buscando evoluir em nossos serviços de ${config.category} para oferecer uma experiência 5 estrelas na sua próxima visita!`;
        }

        return res.json({ 
          reply: replyText, 
          isSimulatedFallback: true,
          apiKeyNotice: "Configure a GEMINI_API_KEY no painel Secrets do AI Studio para obter respostas personalizadas automáticas!"
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

  // Tunnel URL endpoint requested by App.tsx
  app.get("/api/tunnel", (req, res) => {
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "";
    const baseUrl = `${protocol}://${host}`;
    const url = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || baseUrl;
    res.json({ url });
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
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            temperature: 0.8,
          }
        });

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
        console.warn("Gemini generation failed for post, using smart dynamic backup:", geminiError.message);
        
        const normalizedTopic = topic.toLowerCase();
        let finalTitle = topic;
        let finalExcerpt = `Confira uma análise detalhada sobre "${topic}", preparada para ajudar você a cuidar melhor do seu dispositivo.`;
        let finalCategory = category || "Dicas";
        let finalContent = "";
        let finalCoverImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop";

        if (normalizedTopic.includes("bateria") || normalizedTopic.includes("saude") || normalizedTopic.includes("saúde") || normalizedTopic.includes("carrega") || normalizedTopic.includes("ciclo")) {
          finalTitle = topic.length > 15 ? topic : "Guia Completo de Saúde de Bateria do iPhone";
          finalExcerpt = "Aprenda práticas reais para otimizar os ciclos de carga e manter a integridade da bateria do seu iPhone por muito mais tempo.";
          finalCategory = "Dicas";
          finalCoverImage = "https://images.unsplash.com/photo-1601524909162-be87252be298?w=600&auto=format&fit=crop";
          finalContent = `### Por que a saúde da bateria cai?

A bateria do seu iPhone é baseada na tecnologia de íons de lítio, o que significa que ela sofre desgaste químico natural ao longo do tempo. No entanto, certos hábitos diários aceleram drasticamente esse processo, reduzindo a vida útil do componente muito antes do esperado.

### 5 hábitos reais que danificam a vida útil da sua bateria

1. **Utilizar carregadores paralelos ou cabos danificados**: Acessórios sem certificação não controlam a oscilação da corrente elétrica, causando superaquecimento e degradando as células químicas da bateria.
2. **Expor o aparelho a altas temperaturas**: Deixar o celular no painel do carro sob o sol ou usá-lo para jogos pesados enquanto carrega são os piores inimigos da bateria. O calor extremo acelera o desgaste químico de forma irreversível.
3. **Deixar a bateria zerar completamente**: Deixar o iPhone descarregar até 0% gera um estresse desnecessário nas células de carga. O ideal é manter o nível sempre entre **20% e 80%**.
4. **Carregar o celular com capas muito espessas**: Capinhas pesadas retêm o calor produzido durante a recarga. Se notar que o celular esquenta muito enquanto carrega, remova a capa.
5. **Ciclos de carga mal aproveitados**: Tente evitar cargas curtas e repetitivas se o aparelho estiver quente. Aproveite recursos como o *Carregamento Otimizado* do próprio iOS.

### Quando é a hora de fazer a troca?

Geralmente, quando a capacidade máxima de saúde da bateria no iOS fica abaixo de **80%**, ou quando o aparelho começa a desligar sozinho e apresentar lentidão severa. 

### Conte com a ${companyName}!

Se a sua bateria já está desgastada e durando pouco, nós fazemos a substituição rápida por componentes de altíssima qualidade homologados, preservando o desempenho original do seu iPhone. Traga o seu dispositivo para um diagnóstico e orçamento 100% gratuito e rápido em nossa loja!`;

        } else if (normalizedTopic.includes("placa") || normalizedTopic.includes("curto") || normalizedTopic.includes("solda") || normalizedTopic.includes("micro-solda") || normalizedTopic.includes("reparo")) {
          finalTitle = topic.length > 15 ? topic : "Recuperação Avançada: Como funciona o reparo de placa de iPhone";
          finalExcerpt = "Descubra como a engenharia eletrônica e a micro-soldagem especializada salvam celulares dados como 'sem conserto'.";
          finalCategory = "Manutenção";
          finalCoverImage = "https://images.unsplash.com/photo-1597733336794-12d05021d510?w=600&auto=format&fit=crop";
          finalContent = `### O Coração do seu iPhone: A Placa Lógica

A placa lógica do iPhone é um circuito de altíssima densidade, onde centenas de microcomponentes (capacitores, resistores, circuitos integrados) trabalham juntos em um espaço menor do que um cartão de crédito. Qualquer falha em uma única trilha pode apagar o celular por completo.

### Sintomas comuns de falhas na placa

- O iPhone não liga e não dá sinais de carregamento, mesmo com tela e bateria novas.
- Consumo excessivo de bateria ou aquecimento extremo repentino nas costas do aparelho.
- Falhas intermitentes de funções como Wi-Fi, sinal de operadora (baseband) ou áudio (codec).
- Reinicializações constantes na logo da Apple (conhecido como loop infinito).

### O Processo de Micro-soldagem de Alta Precisão

Diferente de assistências comuns que apenas trocam peças modulares, a **${companyName}** trabalha com microeletrônica avançada. 
Utilizando microscópios de alta definição, estações de retrabalho de ar quente e esquemas elétricos digitais detalhados, nossa equipe consegue rastrear curtos-circuitos em malhas principais e substituir microcomponentes milimétricos com precisão cirúrgica.

### Vale a pena reparar a placa?

Com certeza! Na imensa maioria das vezes, o reparo da placa lógica custa uma fração do valor de um aparelho novo, além de recuperar todos os seus dados e fotos pessoais importantes que não estavam salvos no iCloud.

### Confie em quem entende de verdade!

Nossa equipe possui certificações avançadas em microrreparos de placas. Se disseram que seu iPhone não tem conserto, traga-o para a **${companyName}**. Nós faremos uma análise técnica minuciosa e honesta de forma 100% gratuita!`;

        } else if (normalizedTopic.includes("água") || normalizedTopic.includes("liquido") || normalizedTopic.includes("líquido") || normalizedTopic.includes("arroz") || normalizedTopic.includes("molhado")) {
          finalTitle = topic.length > 15 ? topic : "Celular Caiu na Água? O Guia de Sobrevivência Definitivo";
          finalExcerpt = "Entenda quais atitudes tomar imediatamente e por que colocar o aparelho no pote de arroz pode destruir seus componentes internos.";
          finalCategory = "Guias";
          finalCoverImage = "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=600&auto=format&fit=crop";
          finalContent = `### O desespero do acidente com água

Deixar o celular cair na piscina, na pia ou até mesmo no banheiro é um dos acidentes mais comuns. Embora muitos smartphones modernos possuam certificação de resistência IP68, essa proteção se desgasta com o tempo e com impactos, permitindo a entrada de umidade.

### O Grande Perigo do Mito do Arroz

Colocar o celular no arroz **NÃO** funciona e pode danificar ainda mais o seu celular. Embora o arroz absorva umidade superficial, ele libera um amido em pó extremamente fino que entra nos conectores, alto-falantes e câmera do aparelho. Ao entrar em contato com a água interna, esse pó vira uma pasta condutiva e corrosiva, acelerando o curto-circuito e destruindo trilhas de solda essenciais na placa.

### Passo a passo para salvar seu dispositivo imediatamente

1. **Desligue o aparelho na mesma hora**: Se o celular continuar ligado, a eletricidade em contato com a água criará eletrólise instantânea, corroendo componentes em minutos.
2. **Remova a gaveta do chip SIM**: Isso cria uma abertura adicional para ajudar na circulação de ar.
3. **Seque apenas por fora**: Use uma toalha macia ou papel absorvente. **NUNCA** use secador de cabelo quente, pois ele empurra a água ainda mais para dentro e pode derreter vedações e componentes plásticos.
4. **Não carregue o celular**: Ligar o carregador em um dispositivo molhado é garantia de queimar circuitos críticos irreversivelmente.

### O Processo Profissional de Desoxidação

O único método real e seguro é levar o aparelho o quanto antes a uma assistência que realize a abertura total e faça uma **desoxidação química profissional** utilizando banheira de ultrassom e álcool isopropílico de alta pureza.

### Traga correndo para a ${companyName}!

Tempo é precioso nesses casos! Traga o seu iPhone imediatamente para a nossa assistência. Nós abriremos o seu aparelho na hora, desconectaremos a bateria para cessar a energia e realizaremos o procedimento de limpeza química completo para salvar o seu smartphone!`;

        } else if (normalizedTopic.includes("tela") || normalizedTopic.includes("vidro") || normalizedTopic.includes("trincado") || normalizedTopic.includes("display")) {
          finalTitle = topic.length > 15 ? topic : "Tela Quebrada do iPhone: Trocar o vidro ou o display completo?";
          finalExcerpt = "Esclarecemos a diferença crucial entre a troca apenas do vidro e a troca do display inteiro para você economizar sem perder a qualidade original.";
          finalCategory = "Guias";
          finalCoverImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop";
          finalContent = `### A tela trincou, e agora?

Deixar o iPhone cair e ver a tela rachada é uma das piores sensações para qualquer usuário. No entanto, o mercado oferece diferentes formas de reparo, e compreender como a tela é construída pode fazer você economizar bastante dinheiro mantendo as características originais do seu display.

### A Estrutura de uma Tela Moderna

As telas de smartphones são formadas por camadas principais integradas:
1. **O Vidro Externo**: A camada de proteção física que tocamos.
2. **O Painel Touch (Sensibilidade)**: Detecta os toques dos dedos.
3. **O Display (OLED ou LCD)**: Responsável por gerar as cores, brilho e a imagem em si.

### Trocar apenas o Vidro ou a Tela Completa?

- **Quando trocar APENAS o vidro**: Se o seu iPhone quebrou o vidro externo, mas a imagem continua perfeitamente limpa (sem manchas pretas, linhas coloridas ou listras) e o toque (touchscreen) funciona em toda a superfície de forma fluida. Nesse cenário, o processo de laminação profissional substitui apenas o vidro quebrado, mantendo o seu painel LCD/OLED original e economizando até **60%** do custo de uma tela nova!
- **Quando trocar o Display Completo**: Se a tela está preta, apresenta manchas escuras, vazamento de cristal líquido, listras verticais verdes/rosas ou se o toque parou de responder completamente. Nesse caso, a substituição da peça inteira é obrigatória.

### Riscos de Telas Paralelas de Baixa Qualidade

Telas de qualidade inferior (paralelas/incell de baixo custo) apresentam cores lavadas, brilho fraco, consomem mais bateria do celular e quebram com extrema facilidade ao menor impacto. Na **${companyName}**, priorizamos telas de qualidade premium com garantia estendida, calibração correta de cores e manutenção do recurso True Tone.

### Faça seu orçamento gratuito na ${companyName}!

Nossos laboratórios contam com máquinas de laminação a vácuo de alta tecnologia para restaurar apenas o vidro do seu iPhone com acabamento de fábrica. Economize com inteligência! Venha fazer uma avaliação gratuita do seu display hoje mesmo com a nossa equipe!`;

        } else {
          finalTitle = topic;
          finalExcerpt = `Entenda as melhores práticas, cuidados e recomendações técnicas para tratar o tema "${topic}" com segurança no seu dispositivo.`;
          finalContent = `### Compreendendo mais sobre: ${topic}

Muitas vezes, nos deparamos com desafios relacionados a **${topic}** no dia a dia do uso de aparelhos de alta tecnologia como iPhones, smartphones e notebooks. Para garantir a longevidade, o bom desempenho e a segurança dos seus dados, é essencial compreender os aspectos técnicos envolvidos.

### Pontos Fundamentais de Atenção

Para evitar dores de cabeça e gastos desnecessários com manutenção corretiva, siga estas orientações gerais de engenharia e cuidado preventivo:

- **Manutenção Preventiva**: A limpeza física adequada dos conectores de carga, saídas de som e desoxidação preventiva salvam componentes internos de desgaste prematuro.
- **Uso de Acessórios Homologados**: Sempre invista em cabos, carregadores e adaptadores de marcas renomadas e certificadas. A qualidade da energia fornecida influencia diretamente o funcionamento correto da placa principal e a saúde térmica dos chips.
- **Evitar Soluções Caseiras Extremas**: Ao notar qualquer comportamento estranho no funcionamento, evite tutoriais mágicos da internet que envolvam calor excessivo ou produtos químicos corrosivos.

### Diagnóstico Técnico Seguro

Dispositivos modernos possuem designs extremamente compactos e integrados de microeletrônica. Qualquer tentativa de abertura sem o ferramental adequado (como chaves de precisão, mantas térmicas controladas e pulseiras antiestáticas) pode causar danos severos irreversíveis na placa lógica ou rompimento de cabos flexíveis delicados.

### Traga seu dispositivo para a ${companyName}!

Seja qual for a necessidade de reparo, manutenção ou dúvida técnica sobre **${topic}**, a equipe altamente qualificada da **${companyName}** está pronta para ajudar. Nós realizamos a análise detalhada e emitimos o diagnóstico técnico com orçamento 100% gratuito. 

Clique no botão de atendimento do nosso site para iniciar uma conversa direto pelo WhatsApp com o nosso time especializado!`;
        }

        const slug = topic.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");

        const postData = {
          id: `post-${Date.now()}`,
          title: finalTitle,
          slug,
          excerpt: finalExcerpt,
          content: finalContent,
          category: finalCategory,
          publishedAt: new Date().toISOString().split('T')[0],
          views: 0,
          readTime: `${Math.max(2, Math.ceil(finalContent.split(/\s+/).length / 200))} min`,
          coverImage: finalCoverImage
        };

        return res.json({ 
          success: true, 
          post: postData, 
          isSimulatedFallback: true,
          apiKeyNotice: `Rascunho contextual gerado devido a limite temporário de quota do Gemini (${geminiError.message}). Configure sua GEMINI_API_KEY no painel Secrets do AI Studio para habilitar a redação profunda sem limites!` 
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
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            temperature: 0.8,
          }
        });

        let text = response.text || "";
        text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

        const ideas = JSON.parse(text);
        if (Array.isArray(ideas)) {
          return res.json({ success: true, ideas });
        }
        throw new Error("Invalid output format from Gemini");
      } catch (geminiError: any) {
        console.warn("Gemini generation failed for ideas, using curated backups:", geminiError.message);

        // Curated, ultra-realistic backup ideas by category
        const backupData: Record<string, Array<{title: string, category: string, source: string, icon: string}>> = {
          "Dicas": [
            { title: "Por que a saúde da bateria do seu iPhone cai rápido? 5 hábitos reais que danificam a vida útil", category: "Dicas", source: "Google Trends", icon: "🔋" },
            { title: "Como liberar muito espaço no celular sem apagar suas fotos preciosas", category: "Dicas", source: "TechTudo Dicas", icon: "💾" },
            { title: "O perigo de carregar o celular debaixo do travesseiro: Riscos reais e mitos", category: "Dicas", source: "Dica De Olho", icon: "🔥" },
            { title: "Sinais secretos de que seu smartphone tem um vírus ou app malicioso", category: "Dicas", source: "Tendência Tech", icon: "🛡️" },
            { title: "Cuidado com o álcool em gel! O produto correto para desinfetar o seu visor", category: "Dicas", source: "Alerta Nacional", icon: "🧼" }
          ],
          "Guias": [
            { title: "Celular caiu na água? Erros fatais que você deve evitar em casa (e o mito do arroz)", category: "Guias", source: "TechTudo Alerta", icon: "💧" },
            { title: "Guia Definitivo: Como transferir todos os dados de um celular antigo para o novo sem perder nada", category: "Guias", source: "Manual Prático", icon: "📲" },
            { title: "Tela travada ou preta? Como forçar a reinicialização em qualquer smartphone", category: "Guias", source: "Guia Rápido", icon: "⚙️" },
            { title: "Como configurar o backup automático e nunca mais perder seus arquivos e fotos", category: "Guias", source: "Foco Prático", icon: "☁️" },
            { title: "O que fazer quando o celular não quer carregar? Guia básico de auto-socorro", category: "Guias", source: "Suporte Fácil", icon: "🔌" }
          ],
          "Manutenção": [
            { title: "Reparo de placa de iPhone vs Comprar um aparelho novo: Quando realmente vale a pena?", category: "Manutenção", source: "Dica De Olho", icon: "🔬" },
            { title: "Curto-circuito na placa do iPhone: Como a micro-soldagem avançada recupera o seu aparelho", category: "Manutenção", source: "Foco Técnico", icon: "⚡" },
            { title: "Por que o conector de carga fica folgado? Como a limpeza técnica resolve na hora", category: "Manutenção", source: "Dica de Bancada", icon: "🛠️" },
            { title: "Os perigos invisíveis de usar uma tela paralela de má qualidade no seu smartphone", category: "Manutenção", source: "Alerta Técnico", icon: "📱" },
            { title: "Sinais claros de que a bateria do seu celular está estufada (e o risco de explosão)", category: "Manutenção", source: "Prevenção Técnica", icon: "⚠️" }
          ],
          "Novidades": [
            { title: "As novas regras de reparabilidade de celulares: O que muda para o consumidor em 2026?", category: "Novidades", source: "Tecnologia Hoje", icon: "📡" },
            { title: "Os novos recursos de Inteligência Artificial do novo sistema operacional que você precisa testar", category: "Novidades", source: "Novidade Mobile", icon: "✨" },
            { title: "Carregamento ultra-rápido de 120W: Isso realmente vicia ou estraga a vida útil?", category: "Novidades", source: "Mundo Digital", icon: "⚡" },
            { title: "Telas dobráveis em 2026: Vale a pena comprar ou o custo de manutenção ainda é alto?", category: "Novidades", source: "Tendência Global", icon: "📐" },
            { title: "Como a biometria sob a tela funciona e o que fazer se ela parar de responder após trocar o vidro", category: "Novidades", source: "Futuro Tech", icon: "☝️" }
          ]
        };

        // Combine all ideas for "Todas"
        const allBackupIdeas = [
          ...backupData["Dicas"],
          ...backupData["Guias"],
          ...backupData["Manutenção"],
          ...backupData["Novidades"]
        ];

        let selectedBackup = allBackupIdeas;
        if (targetCategory !== "Todas" && backupData[targetCategory]) {
          selectedBackup = backupData[targetCategory];
        }

        // Shuffle and pick 5
        const shuffled = [...selectedBackup].sort(() => 0.5 - Math.random());
        const finalIdeas = shuffled.slice(0, 5);

        return res.json({ success: true, ideas: finalIdeas });
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
  app.get("/api/webhook/logs", async (req, res) => {
    if (db) {
      try {
        const logsCol = collection(db, "webhook_logs");
        const q = query(logsCol, orderBy("createdAtMs", "desc"), limit(100));
        const snap = await getDocs(q);
        const logs: any[] = [];
        snap.forEach(doc => {
          logs.push(doc.data());
        });
        if (logs.length > 0) {
          return res.json(logs);
        }
      } catch (e: any) {
        console.warn("Error fetching webhook_logs from Firestore:", e.message);
      }
    }
    return res.json(webhookLogs);
  });

  // Clear webhook logs endpoint
  app.post("/api/webhook/logs/clear", async (req, res) => {
    webhookLogs = [
      { id: `wlog-${Date.now()}`, timestamp: new Date().toLocaleTimeString('pt-BR'), direction: 'system', message: "Logs de Webhook limpos", details: "Monitor redefinido" }
    ];
    if (db) {
      try {
        const logsCol = collection(db, "webhook_logs");
        const snap = await getDocs(query(logsCol, limit(100)));
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      } catch (e) {}
    }
    return res.json({ success: true });
  });

  // Get real-time WhatsApp sessions list
  app.get("/api/whatsapp/sessions", async (req, res) => {
    try {
      const sessionsMap = new Map<string, any>();

      // 1. Fetch from Firestore first
      if (db) {
        try {
          const historyCol = collection(db, "whatsapp_history");
          const snap = await getDocs(historyCol);
          snap.forEach(docSnap => {
            const data = docSnap.data();
            const cleanNumber = docSnap.id;
            sessionsMap.set(cleanNumber, {
              id: `session-${cleanNumber}`,
              customerName: data.customerName || `Cliente (+${cleanNumber})`,
              customerPhone: `+${cleanNumber}`,
              lastMessage: data.messages?.[data.messages.length - 1]?.text || "",
              unreadCount: 0,
              messages: (data.messages || []).map((m: any, idx: number) => ({
                id: `msg-${cleanNumber}-${idx}`,
                sender: m.role === "user" ? "customer" : "agent",
                text: m.text,
                timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ""
              }))
            });
          });
        } catch (e: any) {
          console.error("Error listing sessions from Firestore:", e.message);
        }
      }

      // 2. Fetch from local directory configDir
      try {
        if (fs.existsSync(configDir)) {
          const files = fs.readdirSync(configDir);
          for (const file of files) {
            if (file.startsWith("history_") && file.endsWith(".json")) {
              const cleanNumber = file.replace("history_", "").replace(".json", "");
              if (sessionsMap.has(cleanNumber)) continue; // Firestore takes priority

              const filePath = path.join(configDir, file);
              try {
                const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
                const messages = fileData.messages || [];
                sessionsMap.set(cleanNumber, {
                  id: `session-${cleanNumber}`,
                  customerName: fileData.customerName || `Cliente (+${cleanNumber})`,
                  customerPhone: `+${cleanNumber}`,
                  lastMessage: messages[messages.length - 1]?.text || "",
                  unreadCount: 0,
                  messages: messages.map((m: any, idx: number) => ({
                    id: `msg-${cleanNumber}-${idx}`,
                    sender: m.role === "user" ? "customer" : "agent",
                    text: m.text,
                    timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ""
                  }))
                });
              } catch (err) {}
            }
          }
        }
      } catch (e: any) {
        console.error("Error listing sessions from local filesystem:", e.message);
      }

      // 3. Return as array
      return res.json(Array.from(sessionsMap.values()));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Send a real or manual message to a WhatsApp customer from the panel
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { customerPhone, text } = req.body;
      if (!customerPhone || !text) {
        return res.status(400).json({ error: "Faltam parâmetros obrigatórios (customerPhone e text)." });
      }

      const cleanNumber = String(customerPhone).replace(/\D/g, "");

      // Get configuration
      const config = await getFirebaseConfig();
      if (!config) {
        return res.status(400).json({ error: "Configuração do agente ausente." });
      }

      const { whatsappAccessToken, whatsappPhoneNumberId } = config;

      // Update history in backend first
      const currentHistory = await getWhatsAppHistory(cleanNumber);
      const updatedHistory = [
        ...currentHistory,
        { role: "model", text, timestamp: new Date().toISOString() }
      ];
      await saveWhatsAppHistory(cleanNumber, updatedHistory);

      // Try sending if Meta credentials are there
      let sentOfficially = false;
      if (whatsappAccessToken && whatsappPhoneNumberId) {
        try {
          const fbResponse = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappAccessToken}`,
              'Content-Type': 'application/json'
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
            addWebhookLog('system', `Mensagem manual enviada via Painel para +${cleanNumber}`, text);
          } else {
            console.warn("Meta API error in manual send:", fbResult);
          }
        } catch (err: any) {
          console.error("Meta API exception in manual send:", err.message);
        }
      }

      return res.json({ success: true, sentOfficially });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Webhook verification endpoint (GET)
  app.get(["/api/webhook/whatsapp", "/webhook", "/api/webhook"], async (req, res) => {
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

  // WhatsApp / Chatwoot Webhook POST message receiver (dedicated strictly to Chatwoot flow)
  app.post(["/api/webhook/whatsapp", "/webhook", "/api/webhook"], async (req, res) => {
    try {
      const body = req.body;
      
      // Print incoming body to console/logs for debugging
      console.log("[Chatwoot Webhook] Payload recebido:", JSON.stringify(body, null, 2));

      // Strictly accept Chatwoot message_created event and incoming type
      const event = body?.event;
      const messageType = body?.message_type;

      if (!body) {
        console.warn("[Chatwoot Webhook] Corpo da requisição vazio.");
        return res.status(400).send("EMPTY_BODY");
      }

      if (event !== "message_created") {
        console.log(`[Chatwoot Webhook] Ignorando evento não relacionado a mensagens: ${event}`);
        return res.status(200).send("EVENT_IGNORED");
      }

      if (messageType !== "incoming") {
        console.log(`[Chatwoot Webhook] Ignorando mensagem de tipo não-incoming (evita loops): ${messageType}`);
        return res.status(200).send("EVENT_IGNORED");
      }

      const rawMessageId = body.id ? String(body.id) : null;
      const messageId = rawMessageId ? `cw-${rawMessageId}` : `cw-${Date.now()}`;
      let messageText = body.content || "";
      const chatwootAccountId = body.account?.id || body.account_id;
      const chatwootConversationId = body.conversation?.id || body.conversation_id;
      const customerName = body.sender?.name || body.contact?.name || body.conversation?.contact?.name || "Cliente Chatwoot";
      const fromNumber = body.contact?.phone_number || body.sender?.phone_number || body.conversation?.contact?.phone_number || `cw-${chatwootConversationId}`;

      // Search for any audio attachment in the Chatwoot payload across all possible attachment structures
      const attachments = [
        ...(Array.isArray(body?.attachments) ? body.attachments : []),
        ...(Array.isArray(body?.message?.attachments) ? body.message.attachments : []),
        ...(Array.isArray(body?.conversation?.messages?.[0]?.attachments) ? body.conversation.messages[0].attachments : []),
        ...(body?.attachment ? [body.attachment] : [])
      ];

      const audioAttachment = attachments.find((att: any) => {
        if (!att) return false;
        const type = String(att.file_type || att.type || "").toLowerCase();
        const mime = String(att.content_type || att.mime_type || "").toLowerCase();
        const ext = String(att.extension || "").toLowerCase();
        const url = String(att.data_url || att.file_url || att.url || att.download_url || att.blob_url || "").toLowerCase();
        
        return (
          type === "audio" || 
          type === "voice" || 
          mime.startsWith("audio/") || 
          mime.startsWith("video/ogg") || 
          ["ogg", "oga", "opus", "mp3", "wav", "m4a", "aac", "weba", "webm"].includes(ext) ||
          /\.(ogg|oga|opus|mp3|wav|m4a|aac|weba|webm)(\?.*)?$/i.test(url)
        );
      });

      const rawAudioUrl = audioAttachment ? (
        audioAttachment.data_url || 
        audioAttachment.file_url || 
        audioAttachment.url || 
        audioAttachment.download_url || 
        audioAttachment.blob_url
      ) : null;

      if ((!messageText || !messageText.trim()) && !audioAttachment && !rawAudioUrl) {
        console.log("[Chatwoot Webhook] Ignorando mensagem vazia ou sem texto/áudio.");
        return res.status(200).send("EMPTY_MESSAGE_IGNORED");
      }

      // 1. Deduplication Check (Synchronous in-memory check to prevent duplicate processing of the same message)
      if (messageId) {
        if (processedMessageIds.has(messageId)) {
          console.log(`[Deduplication] Message ${messageId} already processed or currently processing (in-memory). Ignoring retry.`);
          return res.status(200).send("EVENT_RECEIVED");
        }

        // Immediately add to in-memory processedMessageIds synchronously
        processedMessageIds.add(messageId);
        if (processedMessageIds.size > 1000) {
          const firstItem = processedMessageIds.values().next().value;
          if (firstItem) processedMessageIds.delete(firstItem);
        }
      }

      // CRITICAL: Respond HTTP 200 immediately!
      // This acknowledges successful delivery so Chatwoot stops retrying,
      // and it stays well under the strict webhook timeout limit.
      res.status(200).send("EVENT_RECEIVED");

      // Continue processing everything asynchronously in the background
      (async () => {
        // 2. Firestore Deduplication Check (safeguard against server restarts)
        if (messageId && db) {
          try {
            const msgRef = doc(db, "processed_messages", messageId);
            const msgSnap = await getDoc(msgRef);
            if (msgSnap.exists()) {
              console.log(`[Deduplication] Message ${messageId} already processed (Firestore). Ignoring retry.`);
              return;
            }
          } catch (e: any) {
            console.error("[Deduplication] Error checking Firestore for duplicates:", e.message);
          }
        }

        // Load config dynamically to ensure latest updates
        const storedConfig = await getFirebaseConfig();
        if (!storedConfig) {
          addWebhookLog('error', `Falha ao processar mensagem do Chatwoot`, `Configuração da empresa ausente no servidor. Configure os dados no painel.`);
          return;
        }

        const chatwootUrl = (storedConfig?.chatwootUrl || "https://atendimento.andmicrocell.com.br").trim();
        const rawToken = (storedConfig?.chatwootApiAccessToken || process.env.CHATWOOT_API_ACCESS_TOKEN || "Q1DpLpBXSGYWVP7VGunkEkwL").trim();
        const chatwootApiAccessToken = rawToken.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
        const cleanUrl = chatwootUrl.endsWith('/') ? chatwootUrl.slice(0, -1) : chatwootUrl;

        // Check if the robot auto-response is enabled in settings
        if (storedConfig.autoRespondWhatsApp !== true) {
          addWebhookLog('system', `Mensagem do Chatwoot recebida (Robô Desativado)`, `O robô recebeu a mensagem de ${customerName}, mas não respondeu porque o botão "Responder Automaticamente" está desativado nas configurações.`);
          console.log("[Chatwoot Webhook] Responder Automaticamente está desativado. Ignorando processamento.");
          return;
        }

        // 3. Check if the specific phone number is muted (silenced)
        const mutedPhones = storedConfig.mutedPhones || [];
        const isMuted = mutedPhones.some((phone: string) => {
          const cleanPhone = String(phone).replace(/\D/g, "");
          const cleanFrom = String(fromNumber).replace(/\D/g, "");
          return cleanFrom === cleanPhone || cleanFrom.endsWith(cleanPhone) || cleanPhone.endsWith(cleanFrom);
        });

        if (isMuted) {
          console.log(`[Silence Mode] Contact ${fromNumber} is muted/silenced. Skipping AI response.`);
          addWebhookLog('system', `Mensagem recebida de ${customerName} (${fromNumber}) [Silenciado]`, `O robô está SILENCIADO para esta conversa específica. O atendente humano pode responder diretamente.`);
          if (messageId && db) {
            try {
              await setDoc(doc(db, "processed_messages", messageId), { processedAt: new Date().toISOString() });
            } catch (e) {}
          }
          return;
        }

        // --- AUDIO PROCESSING ENHANCEMENT ---
        if (rawAudioUrl) {
          try {
            console.log(`[Audio Processing] Iniciando download do áudio de: ${rawAudioUrl}`);
            addWebhookLog('system', `Processando áudio de ${customerName}`, `Baixando arquivo de voz para transcrição...`);
            
            const fileBuffer = await downloadAudio(rawAudioUrl, cleanUrl, chatwootApiAccessToken);
            
            // Sanitize mimeType for Gemini inlineData
            let cleanMime = (audioAttachment?.content_type || audioAttachment?.mime_type || "audio/ogg")
              .split(";")[0]
              .trim()
              .toLowerCase();

            if (cleanMime === "audio/opus" || cleanMime === "audio/oga" || cleanMime === "application/ogg" || cleanMime === "video/ogg") {
              cleanMime = "audio/ogg";
            } else if (cleanMime === "audio/x-m4a" || cleanMime === "audio/m4a") {
              cleanMime = "audio/mp4";
            } else if (cleanMime === "audio/mpeg") {
              cleanMime = "audio/mp3";
            } else if (!cleanMime.startsWith("audio/")) {
              cleanMime = "audio/ogg";
            }

            console.log(`[Audio Processing] Download concluído (${fileBuffer.length} bytes, MIME: ${cleanMime}). Transcrevendo com Gemini...`);
            addWebhookLog('system', `Transcrevendo áudio de ${customerName}`, `Enviando arquivo ao Gemini (${fileBuffer.length} bytes, formato ${cleanMime})...`);

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
                "Transcreva este áudio em português brasileiro de forma extremamente fiel e limpa. Retorne APENAS a transcrição literal do áudio, sem adicionar nenhuma introdução, explicações, comentários ou tags adicionais."
              ]
            });

            const audioTranscription = (response.text || "").trim();
            console.log(`[Audio Processing] Transcrição concluída: "${audioTranscription}"`);
            
            if (audioTranscription) {
              addWebhookLog('system', `Áudio de ${customerName} transcrito com sucesso`, `Texto: "${audioTranscription}"`);
              messageText = `[Áudio do cliente]: ${audioTranscription}`;
            } else {
              console.log("[Audio Processing] O áudio parece estar silencioso ou sem fala compreensível.");
              addWebhookLog('system', `Áudio de ${customerName} processado`, `O áudio está silencioso ou não foi possível extrair a fala.`);
              messageText = `[Áudio do cliente]: (áudio curto ou silencioso)`;
            }
          } catch (audioErr: any) {
            console.error("[Audio Processing] Erro ao baixar ou transcrever áudio:", audioErr.message);
            addWebhookLog('error', `Falha ao processar áudio de ${customerName}`, `Erro: ${audioErr.message}`);
            
            const errorMessage = `Olá, ${customerName}! Recebi a sua mensagem de áudio, mas tive uma pequena oscilação técnica de conexão ao tentar reproduzir. 🎧 Poderia, por favor, me enviar sua dúvida ou modelo por mensagem de texto? Eu já te respondo na hora com o orçamento completo!`;
            
            // Fetch history to save properly
            const currentHistory = await getWhatsAppHistory(fromNumber);
            const updatedHistory = [
              ...currentHistory,
              { role: "user", text: "[Mensagem de Áudio - Falha no processamento]", timestamp: new Date().toISOString() },
              { role: "model", text: errorMessage, timestamp: new Date().toISOString() }
            ];
            await saveWhatsAppHistory(fromNumber, updatedHistory, customerName);

            // Send failure message via Chatwoot API
            const fallbackAccountId = chatwootAccountId || storedConfig.chatwootAccountId || 1;
            if (chatwootApiAccessToken && fallbackAccountId && chatwootConversationId) {
              await fetch(`${cleanUrl}/api/v1/accounts/${fallbackAccountId}/conversations/${chatwootConversationId}/messages`, {
                method: 'POST',
                headers: {
                  'api-access-token': chatwootApiAccessToken,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  content: errorMessage,
                  message_type: "outgoing",
                  private: false
                })
              });
            }
            return; // Terminate execution for this webhook message
          }
        }
        // ------------------------------------

        // 4. Mark as processed in Firestore before responding to avoid race conditions
        if (messageId && db) {
          try {
            await setDoc(doc(db, "processed_messages", messageId), {
              processedAt: new Date().toISOString(),
              fromNumber,
              customerName,
              messageText: messageText || ""
            });
          } catch (e: any) {
            console.error("[Deduplication] Error marking message as processed in Firestore:", e.message);
          }
        }

        addWebhookLog('inbound', `Mensagem de ${customerName} recebida via Chatwoot (Conversa #${chatwootConversationId})`, messageText);

        // 5. Mark message as READ immediately in Chatwoot (triggers blue double-checkmarks on WhatsApp)
        if (chatwootApiAccessToken && chatwootAccountId && chatwootConversationId) {
          try {
            await fetch(`${cleanUrl}/api/v1/accounts/${chatwootAccountId}/conversations/${chatwootConversationId}/update_last_seen`, {
              method: 'POST',
              headers: {
                'api-access-token': chatwootApiAccessToken,
                'Content-Type': 'application/json'
              }
            });
            console.log(`[Chatwoot] Marcada como lida conversa #${chatwootConversationId} (dois tracinhos azuis).`);
          } catch (readErr: any) {
            console.warn("[Chatwoot] Aviso ao atualizar status de leitura:", readErr.message);
          }

          // Trigger typing indicator
          try {
            await fetch(`${cleanUrl}/api/v1/accounts/${chatwootAccountId}/conversations/${chatwootConversationId}/toggle_typing_status`, {
              method: 'POST',
              headers: {
                'api-access-token': chatwootApiAccessToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ typing_status: 'on' })
            });
          } catch (e) {}
        }

        // 6. Fetch history and format it for Gemini API
        const history = await getWhatsAppHistory(fromNumber);
        
        // Check if we should use a fast static greeting response
        const staticResponse = getStaticGreetingResponse(messageText, history.length);
        let replyText = "";

        if (staticResponse) {
          replyText = staticResponse;
          const updatedHistory = [
            ...history,
            { role: "user", text: messageText, timestamp: new Date().toISOString() },
            { role: "model", text: replyText, timestamp: new Date().toISOString() }
          ];
          await saveWhatsAppHistory(fromNumber, updatedHistory, customerName);
        } else {
          // Build prompt system instructions
          const systemInstruction = buildSystemInstruction(storedConfig);

          // Filter out malformed/empty historical messages and keep only the last 6 messages
          const contentsList = history
            .filter((m: any) => m && m.text && typeof m.text === "string" && m.text.trim())
            .slice(-6)
            .map((m: any) => ({
              role: m.role === "user" ? "user" : "model",
              parts: [{ text: m.text.trim() }]
            }));

          // Push the new user message
          if (messageText && typeof messageText === "string" && messageText.trim()) {
            contentsList.push({
              role: "user",
              parts: [{ text: messageText.trim() }]
            });
          }

          // Merge consecutive messages with the same role to satisfy Gemini's strict alternating roles requirement
          const contents: any[] = [];
          for (const msg of contentsList) {
            if (contents.length > 0 && contents[contents.length - 1].role === msg.role) {
              const lastMsg = contents[contents.length - 1];
              if (lastMsg.parts && lastMsg.parts[0] && msg.parts && msg.parts[0]) {
                lastMsg.parts[0].text = `${lastMsg.parts[0].text}\n${msg.parts[0].text}`;
              }
            } else {
              contents.push(msg);
            }
          }

          // Run Gemini with multi-model fallback and auto-retry
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
                    temperature: 0.7,
                  }
                });
                if (response?.text) {
                  replyText = response.text;
                  generated = true;
                  break;
                }
              } catch (modelErr: any) {
                console.warn(`[Gemini Model ${modelName} Error] ${modelErr.message}. Trying next candidate...`);
                // Wait briefly before trying next candidate in case of rate limit
                await new Promise(r => setTimeout(r, 600));
              }
            }

            if (!generated) {
              replyText = `Olá, ${customerName}! Sou o assistente da ${storedConfig.name}. Como posso te ajudar hoje? Nosso horário é ${storedConfig.businessHours}.`;
            }

            const updatedHistory = [
              ...history,
              { role: "user", text: messageText, timestamp: new Date().toISOString() },
              { role: "model", text: replyText, timestamp: new Date().toISOString() }
            ];
            await saveWhatsAppHistory(fromNumber, updatedHistory, customerName);
          } catch (geminiError: any) {
            console.warn("Fallback response used in Chatwoot webhook because Gemini failed:", geminiError.message);
            replyText = `Olá, ${customerName}! Sou o assistente inteligente da ${storedConfig.name}. Como posso te ajudar com seu aparelho hoje?`;

            const updatedHistory = [
              ...history,
              { role: "user", text: messageText, timestamp: new Date().toISOString() },
              { role: "model", text: replyText, timestamp: new Date().toISOString() }
            ];
            await saveWhatsAppHistory(fromNumber, updatedHistory, customerName);
          }
        }

        addWebhookLog('outbound', `Resposta gerada pela IA (Chatwoot)`, replyText);

        // 7. Send the response via Chatwoot API
        const finalAccountId = chatwootAccountId || storedConfig.chatwootAccountId || 1;
        if (chatwootApiAccessToken && finalAccountId && chatwootConversationId) {
          // Small natural pause before sending
          const simulatedTypingMs = Math.min(Math.max(600, replyText.length * 8), 1800);
          addWebhookLog('system', `Enviando resposta ao cliente`, `Aguardando ${simulatedTypingMs}ms para digitação natural.`);
          await new Promise(resolve => setTimeout(resolve, simulatedTypingMs));

          try {
            const targetUrl = `${cleanUrl}/api/v1/accounts/${finalAccountId}/conversations/${chatwootConversationId}/messages`;
            
            const maskedTokenDebug = chatwootApiAccessToken 
              ? `${chatwootApiAccessToken.substring(0, 4)}...${chatwootApiAccessToken.substring(chatwootApiAccessToken.length - 4)} (len: ${chatwootApiAccessToken.length})`
              : 'undefined';
            console.log(`[Chatwoot API DEBUG] Sending to ${targetUrl} using token ${maskedTokenDebug}`);
            
            const cwResponse = await fetch(targetUrl, {
              method: 'POST',
              headers: {
                'api-access-token': chatwootApiAccessToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                content: replyText,
                message_type: "outgoing",
                private: false
              })
            });

            const cwResult = await cwResponse.json().catch(() => ({}));
            if (cwResponse.ok) {
              addWebhookLog('system', `Mensagem enviada com sucesso via API do Chatwoot`, `Enviado para a conversa #${chatwootConversationId}.`);
            } else {
              if (cwResponse.status === 401 || cwResponse.status === 403) {
                addWebhookLog('error', `Token do Chatwoot Inválido (HTTP ${cwResponse.status})`, `O Chatwoot recusou a autenticação.`);
              } else {
                addWebhookLog('error', `Falha ao enviar mensagem via Chatwoot`, `Código HTTP: ${cwResponse.status}. Detalhes: ${JSON.stringify(cwResult)}`);
              }
              console.error("[Chatwoot API Error]", cwResult);
            }
          } catch (cwErr: any) {
            addWebhookLog('error', `Erro ao conectar com a API do Chatwoot`, cwErr.message);
            console.error("[Chatwoot Connection Error]", cwErr);
          } finally {
            // Turn off typing indicator and mark seen
            try {
              await fetch(`${cleanUrl}/api/v1/accounts/${finalAccountId}/conversations/${chatwootConversationId}/toggle_typing_status`, {
                method: 'POST',
                headers: {
                  'api-access-token': chatwootApiAccessToken,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ typing_status: 'off' })
              });
              await fetch(`${cleanUrl}/api/v1/accounts/${finalAccountId}/conversations/${chatwootConversationId}/update_last_seen`, {
                method: 'POST',
                headers: {
                  'api-access-token': chatwootApiAccessToken,
                  'Content-Type': 'application/json'
                }
              });
            } catch (e) {}
          }
        } else {
          addWebhookLog('error', `Chatwoot não pôde responder`, `Credenciais pendentes ou ausentes na configuração (Token: ${chatwootApiAccessToken ? "OK" : "AUSENTE"}, Account ID: ${chatwootAccountId}, Conversation ID: ${chatwootConversationId}).`);
          console.warn("[Chatwoot] Cannot send response because credentials or IDs are missing");
        }
      })().catch(asyncErr => {
        console.error("Critical error in async background Chatwoot webhook processing:", asyncErr);
        addWebhookLog('error', `Erro crítico no processamento assíncrono`, asyncErr.message);
      });

    } catch (err: any) {
      console.error("Error in Chatwoot webhook POST:", err);
      addWebhookLog('error', `Erro crítico no processamento do Webhook`, err.message);
      try { res.status(500).send("INTERNAL_SERVER_ERROR"); } catch (e) {}
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date() });
  });

  // Test Chatwoot connection and token validity endpoint
  app.post("/api/chatwoot/test-connection", async (req, res) => {
    try {
      const { chatwootUrl, chatwootApiAccessToken } = req.body;
      
      if (!chatwootUrl || !chatwootApiAccessToken) {
        return res.status(400).json({ success: false, error: "A URL do Chatwoot e o Token são obrigatórios para o teste." });
      }

      const cleanUrl = chatwootUrl.trim().endsWith('/') ? chatwootUrl.trim().slice(0, -1) : chatwootUrl.trim();
      const rawToken = String(chatwootApiAccessToken || "").trim();
      const token = rawToken.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
      const targetUrl = `${cleanUrl}/api/v1/profile`;

      console.log(`[Chatwoot Test] Testando conexão com ${cleanUrl}/api/v1/profile`);

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
          message: "Conexão estabelecida com sucesso!", 
          profile: { 
            name: data.name || "Agente/Usuário", 
            email: data.email || "" 
          } 
        });
      } else {
        const status = response.status;
        let errMsg = `Erro de resposta do servidor Chatwoot (Código: ${status})`;
        if (status === 401 || status === 403) {
          errMsg = "Token de acesso pessoal à API inválido. Por favor, cole o Token de Acesso de API obtido em 'Configurações do Perfil' no canto inferior esquerdo do seu painel Chatwoot.";
        }
        return res.json({ success: false, error: errMsg });
      }
    } catch (err: any) {
      console.error("[Chatwoot Test Connection Exception]", err.message);
      return res.json({ 
        success: false, 
        error: `Não foi possível conectar com a URL informada. Detalhes: ${err.message}. Verifique se a URL está correta (ex: https://atendimento.andmicrocell.com.br) e se sua instância está online.` 
      });
    }
  });

  // Secure diagnostic endpoint to troubleshoot production environment issues
  app.get("/api/debug-status", async (req, res) => {
    try {
      const storedConfig = await getFirebaseConfig();
      const hasDb = db !== null;
      
      const maskedToken = storedConfig?.chatwootApiAccessToken 
        ? `${storedConfig.chatwootApiAccessToken.substring(0, 4)}...${storedConfig.chatwootApiAccessToken.substring(storedConfig.chatwootApiAccessToken.length - 4)}` 
        : "MISSING";

      res.json({
        firebaseConnected: hasDb,
        chatwootUrl: storedConfig?.chatwootUrl || "https://atendimento.andmicrocell.com.br (DEFAULT)",
        chatwootTokenLength: storedConfig?.chatwootApiAccessToken?.length || 0,
        chatwootTokenMasked: maskedToken,
        autoRespondWhatsApp: storedConfig?.autoRespondWhatsApp || false,
        envGeminiApiKeySet: !!process.env.GEMINI_API_KEY,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (http://0.0.0.0:${PORT})`);

    // Auto Keep-Alive: evita que o servidor entre em repouso (sleep) no Render / nuvens
    const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
    if (keepAliveUrl) {
      console.log(`[Keep-Alive] Configurando ping automático a cada 4 minutos para ${keepAliveUrl}/api/health`);
      setInterval(() => {
        fetch(`${keepAliveUrl}/api/health`)
          .then(res => console.log(`[Keep-Alive] Ping OK (${res.status})`))
          .catch(err => console.warn(`[Keep-Alive] Falha no ping:`, err.message));
      }, 4 * 60 * 1000);
    }
  });
}

startServer();
