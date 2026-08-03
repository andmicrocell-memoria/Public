import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { spawn } from "child_process";

dotenv.config();

// Prevenção de quebra do servidor em produção (Render / Cloud Run) para nunca derrubar o processo Node.js
process.on('uncaughtException', (err) => {
  console.error(" [FATAL] Uncaught Exception absorvida pelo servidor:", err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(" [FATAL] Unhandled Rejection absorvida pelo servidor:", reason);
});

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
async function saveWhatsAppHistory(fromNumber: string, messages: any[]) {
  const cleanNumber = String(fromNumber).replace(/\D/g, "");
  if (!cleanNumber) return;

  const sliced = messages.slice(-15); // Keep the last 15 messages for context
  
  // 1. Save to Firestore
  if (db) {
    try {
      const historyDocRef = doc(db, "whatsapp_history", cleanNumber);
      await setDoc(historyDocRef, { messages: sliced });
    } catch (e: any) {
      console.error(`Error saving WhatsApp history to Firestore for ${cleanNumber}:`, e.message);
    }
  }

  // 2. Save backup to local JSON file
  try {
    ensureConfigDir();
    const historyFilePath = path.join(configDir, `history_${cleanNumber}.json`);
    fs.writeFileSync(historyFilePath, JSON.stringify({ messages: sliced }, null, 2), "utf8");
  } catch (fileErr: any) {
    console.error(`Error writing local backup history file for ${cleanNumber}:`, fileErr.message);
  }

  // 3. Keep in-memory cache updated
  inMemoryHistoryCache[cleanNumber] = sliced;
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
  2. Se o cliente insistir ou se for muito importante passar o valor, informe a estimativa ou faixa de preço de forma transparente com base na Tabela de Preços abaixo.
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

Tabela de Preços Geral de Referência para Orçamentos (SÓ passe o valor se o cliente insistir ou pedir orçamento específico, priorizando sempre a visita física logo em seguida):
${pricingText}

Diretrizes de Conversação (MUITO IMPORTANTE):
1. Estilo Bate-Papo de WhatsApp: Fale de forma extremamente curta, fluida e natural, como um ser humano conversando de verdade. Evite respostas longas, explicações gigantescas ou apresentações corporativas formais de uma só vez.
2. Tamanho Máximo de Resposta: Cada mensagem enviada deve conter no máximo 1 ou 2 parágrafos curtos (e cada parágrafo com apenas 1 a 2 linhas curtas). Seja o mais breve e sucinto possível!
3. Uma Coisa de Cada Vez: Não jogue toda a informação ou todas as FAQs de uma vez. Vá conduzindo a conversa aos poucos. Faça perguntas para entender a real necessidade do cliente antes de explicar tudo.
4. Memória Recente: Preste muita atenção ao histórico de mensagens anteriores. Se o cliente acabou de dizer o nome do aparelho, qual o problema ou o que ele deseja, deu continuidade e jamais repita a mesma pergunta ou peça para ele dizer novamente.
5. Limite de Emojis: Use no máximo 1 ou 2 emojis por mensagem para manter a conversa amigável mas profissional.
6. Gerenciamento do Horário de Atendimento (MUITO CRÍTICO):
   O status atual de funcionamento da loja física é: ${brazilStatus.statusMessage}.
   - Se o status indicar que a loja está "FECHADA" (ou seja, hoje é Domingo, Sábado fora do horário, ou dias de semana à noite/almoço):
     * Você DEVE ser 100% transparente com o cliente. Logo nas primeiras mensagens, deixe absolutamente claro que a loja física está FECHADA no momento ou que estamos fora do horário de expediente comercial.
     * Diga explicitamente algo amigável como: "Olá! No momento nossa loja física está fechada/fora do horário de atendimento, mas eu sou o assistente virtual da AndMicrocell e posso ir registrando todos os detalhes do seu aparelho para adiantar seu atendimento!"
     * Comunique com total clareza que, mesmo fora do horário de funcionamento comercial, você está ativo para dar andamento na conversa, coletar as informações do aparelho e do problema técnico para deixar tudo pronto no sistema.
     * Explique que assim que a equipe técnica retornar no primeiro horário útil, eles analisarão tudo para resolver, ou que você irá verificar com a equipe a possibilidade de um técnico de plantão prestar um suporte especial emergencial.
     * NUNCA deu a entender que o atendimento presencial ou final está ativo agora se estiver FECHADA. Deixe bem nítido que a loja está fechada, mas que o assistente virtual (você) resolve tudo por aqui e deixa engatilhado para os técnicos.
    - Se o status indicar que a loja está "ABERTA":
      * Siga com o atendimento normal de expediente comercial.
7. Honestidade e Segurança: NUNCA invente informações sobre preços, serviços ou políticas que não estejam descritas acima. Se não souber a resposta ou se o cliente fizer uma pergunta muito específica de preço que não conste na tabela de preços nem na base de conhecimento, explique de forma amigável e profissional que não tem o valor exato no sistema e convide-o calorosamente a trazer para uma avaliação gratuita na loja ou peça para ele aguardar um momento que um atendente humano irá assumir o atendimento para dar todos os detalhes.
8. Responda sempre em Português do Brasil.
9. Encerramento Objetivo da Conversa: Quando o cliente se despedir, agradecer ("Obrigado", "Valeu", "Tudo certo", "Entendido", "Tchau", "Boa noite", etc.) ou der sinais claros de que a dúvida foi resolvida e o atendimento se encerrou, responda de forma final, extremamente direta, amigável e objetiva. NUNCA faça novas perguntas redundantes ("Posso ajudar em algo mais?") ou tente prolongar a conversa desnecessariamente. Apenas agradeça, deseje um excelente dia/noite ou agende um horário para ele trazer o aparelho, e encerre por ali.`;
  };

  // Live WhatsApp Chat Simulation API
  app.post("/api/agent/chat", async (req, res) => {
    try {
      const { config, messages } = req.body;

      if (!config) {
        return res.status(400).json({ error: "Configuração do agente ausente." });
      }

      const systemPrompt = buildSystemInstruction(config);
      
      // Structure chat messages in standard format
      // Standardize messages history for Gemini API
      const contents = messages.map((m: any) => {
        return {
          role: m.sender === "customer" ? "user" : "model",
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
      
      // Print incoming body to console/logs for debugging
      console.log("WhatsApp Incoming webhook:", JSON.stringify(body, null, 2));

      // Extract message components
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (!message) {
        // Not a message event (could be statuses like delivered/read)
        return res.status(200).send("EVENT_RECEIVED");
      }

      const fromNumber = message.from; // Customer wa_id or number
      const messageId = message.id;
      const messageType = message.type;
      const customerName = value.contacts?.[0]?.profile?.name || "Cliente WhatsApp";

      // 1. Deduplication Check (Synchronous in-memory check to prevent duplicate processing of the same message)
      if (messageId) {
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
      }

      // CRITICAL: Respond HTTP 200 immediately to Meta!
      // This acknowledges successful delivery to WhatsApp so Meta stops retrying the message,
      // and it stays well under the strict 5-second webhook timeout limit.
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

        // 3. Message Type Verification
        if (messageType !== "text") {
          addWebhookLog('system', `Mensagem ignorada de ${customerName}`, `Tipo de mensagem recebida: ${messageType}. Apenas mensagens de texto são processadas automaticamente.`);
          if (messageId && db) {
            try {
              await setDoc(doc(db, "processed_messages", messageId), { processedAt: new Date().toISOString() });
            } catch (e) {}
          }
          return;
        }

        const messageText = message.text?.body;

        // Load config dynamically to ensure latest updates
        const storedConfig = await getFirebaseConfig();
        if (!storedConfig) {
          addWebhookLog('error', `Falha ao processar mensagem`, `Configuração da empresa ausente no servidor. Configure os dados no painel.`);
          return;
        }

        // 4. Loop Prevention: Check if the message is from the business itself (the WhatsApp API number)
        const businessPhoneNumber = value?.metadata?.display_phone_number;
        const normalizedFrom = fromNumber ? String(fromNumber).replace(/\D/g, "") : "";
        const normalizedBusiness = businessPhoneNumber ? String(businessPhoneNumber).replace(/\D/g, "") : "";

        const isOwnNumber = (normalizedBusiness && normalizedFrom === normalizedBusiness);

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
          addWebhookLog('system', `Mensagem recebida de ${customerName}, mas Auto-Resposta está desativada`, `O robô não responderá automaticamente no momento porque o Auto-WhatsApp está desativado no painel.`);
          if (messageId && db) {
            try {
              await setDoc(doc(db, "processed_messages", messageId), { processedAt: new Date().toISOString() });
            } catch (e) {}
          }
          return;
        }

        // 7. Mark as processed in Firestore before responding to avoid race conditions
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
        const history = await getWhatsAppHistory(fromNumber);
        
        // Filter out malformed/empty historical messages and prepare standard contents format
        const contentsList = history
          .filter((m: any) => m && m.text && typeof m.text === "string" && m.text.trim())
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

        // Merge consecutive messages with the same role to satisfy Gemini's strict alternating roles requirement (user -> model -> user...)
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

        // 2. Run Gemini
        let replyText = "";
        try {
          const client = getGeminiClient();
          const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });
          replyText = response.text || "Olá! Desculpe, não entendi.";

          // Update history with new messages
          const updatedHistory = [
            ...history,
            { role: "user", text: messageText, timestamp: new Date().toISOString() },
            { role: "model", text: replyText, timestamp: new Date().toISOString() }
          ];
          await saveWhatsAppHistory(fromNumber, updatedHistory);
        } catch (geminiError: any) {
          console.warn("Fallback response used in webhook because Gemini failed:", geminiError.message);
          // Fallback responder logic
          replyText = `Olá, ${customerName}! Sou o assistente inteligente da ${storedConfig.name}. No momento, estamos processando sua mensagem. Nosso horário é ${storedConfig.businessHours}.`;

          // Update history with fallback as well
          const updatedHistory = [
            ...history,
            { role: "user", text: messageText, timestamp: new Date().toISOString() },
            { role: "model", text: replyText, timestamp: new Date().toISOString() }
          ];
          await saveWhatsAppHistory(fromNumber, updatedHistory);
        }

        addWebhookLog('outbound', `Resposta gerada pela IA`, replyText);

        // 3. Send official message if token & ID are configured
        if (whatsappAccessToken && whatsappPhoneNumberId) {
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
              addWebhookLog('system', `Mensagem oficial enviada via API do WhatsApp`, `Mensagem enviada com sucesso para ${fromNumber}. ID: ${fbResult.messages?.[0]?.id || "N/A"}`);
            } else {
              // Retry automático para números do Brasil (DDD + 8 ou 9 dígitos) - regra do 9º dígito no Meta Graph API
              const numStr = String(fromNumber).replace(/\D/g, "");
              let altFrom: string | null = null;
              if (numStr.startsWith("55") && numStr.length === 12) {
                // Inserir o 9 após o DDD (55 + 2 DDD + 9 + 8 dígitos)
                altFrom = numStr.slice(0, 4) + '9' + numStr.slice(4);
              } else if (numStr.startsWith("55") && numStr.length === 13) {
                // Remover o 9 após o DDD (55 + 2 DDD + 8 dígitos)
                altFrom = numStr.slice(0, 4) + numStr.slice(5);
              }

              if (altFrom) {
                addWebhookLog('system', `Tentativa de envio alternativa (Regra 9º dígito BR)`, `Reenviando automaticamente para formato alternativo: ${altFrom}`);
                try {
                  const retryRes = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${whatsappAccessToken}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      messaging_product: "whatsapp",
                      to: altFrom,
                      type: "text",
                      text: {
                        body: replyText
                      }
                    })
                  });
                  const retryResult = await retryRes.json();
                  if (retryRes.ok) {
                    addWebhookLog('system', `Mensagem oficial enviada (Formato BR ajustado)`, `Enviado com sucesso para ${altFrom}. ID: ${retryResult.messages?.[0]?.id || "N/A"}`);
                  } else {
                    addWebhookLog('error', `Falha ao enviar via API do WhatsApp (${fromNumber} e ${altFrom})`, JSON.stringify(retryResult));
                  }
                } catch (retryErr: any) {
                  addWebhookLog('error', `Falha ao tentar reenvio para ${altFrom}`, retryErr.message);
                }
              } else {
                addWebhookLog('error', `Falha ao enviar mensagem via API do WhatsApp`, JSON.stringify(fbResult));
              }
            }
          } catch (fetchError: any) {
            addWebhookLog('error', `Erro na requisição para a API do WhatsApp`, fetchError.message);
          }
        } else {
          addWebhookLog('system', `Mensagem de IA pronta, mas envio oficial desativado`, `Insira as credenciais do WhatsApp Cloud API no painel de Integração para enviar respostas oficiais diretamente.`);
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
    res.json({ status: "ok", time: new Date() });
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
    console.log(`Server running on port ${PORT} (http://localhost:${PORT})`);

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
