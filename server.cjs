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
import_dotenv.default.config();
var resolvedFilename = typeof import_meta !== "undefined" && import_meta.url ? (0, import_url.fileURLToPath)(import_meta.url) : typeof __filename !== "undefined" ? __filename : process.cwd();
var resolvedDirname = typeof import_meta !== "undefined" && import_meta.url ? import_path.default.dirname(resolvedFilename) : typeof __dirname !== "undefined" ? __dirname : process.cwd();
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
  let firebaseConfig = null;
  const firebaseConfigPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(firebaseConfigPath)) {
    try {
      firebaseConfig = JSON.parse(import_fs.default.readFileSync(firebaseConfigPath, "utf8"));
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
          const historyFilePath = import_path.default.join(configDir, `history_${cleanNumber}.json`);
          import_fs.default.writeFileSync(historyFilePath, JSON.stringify({ messages }, null, 2), "utf8");
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
    const historyFilePath = import_path.default.join(configDir, `history_${cleanNumber}.json`);
    if (import_fs.default.existsSync(historyFilePath)) {
      const fileData = JSON.parse(import_fs.default.readFileSync(historyFilePath, "utf8"));
      const messages = fileData.messages || [];
      inMemoryHistoryCache[cleanNumber] = messages;
      return messages;
    }
  } catch (fileErr) {
    console.error(`Error reading local backup history file for ${cleanNumber}:`, fileErr.message);
  }
  return inMemoryHistoryCache[cleanNumber] || [];
}
async function saveWhatsAppHistory(fromNumber, messages) {
  const cleanNumber = String(fromNumber).replace(/\D/g, "");
  if (!cleanNumber) return;
  const sliced = messages.slice(-15);
  if (db) {
    try {
      const historyDocRef = (0, import_firestore.doc)(db, "whatsapp_history", cleanNumber);
      await (0, import_firestore.setDoc)(historyDocRef, { messages: sliced });
    } catch (e) {
      console.error(`Error saving WhatsApp history to Firestore for ${cleanNumber}:`, e.message);
    }
  }
  try {
    ensureConfigDir();
    const historyFilePath = import_path.default.join(configDir, `history_${cleanNumber}.json`);
    import_fs.default.writeFileSync(historyFilePath, JSON.stringify({ messages: sliced }, null, 2), "utf8");
  } catch (fileErr) {
    console.error(`Error writing local backup history file for ${cleanNumber}:`, fileErr.message);
  }
  inMemoryHistoryCache[cleanNumber] = sliced;
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
  2. Se o cliente insistir ou se for muito importante passar o valor, informe a estimativa ou faixa de pre\xE7o de forma transparente com base na Tabela de Pre\xE7os abaixo.
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

Tabela de Pre\xE7os Geral de Refer\xEAncia para Or\xE7amentos (S\xD3 passe o valor se o cliente insistir ou pedir or\xE7amento espec\xEDfico, priorizando sempre a visita f\xEDsica logo em seguida):
${pricingText}

Diretrizes de Conversa\xE7\xE3o (MUITO IMPORTANTE):
1. Estilo Bate-Papo de WhatsApp: Fale de forma extremamente curta, fluida e natural, como um ser humano conversando de verdade. Evite respostas longas, explica\xE7\xF5es gigantescas ou apresenta\xE7\xF5es corporativas formais de uma s\xF3 vez.
2. Tamanho M\xE1ximo de Resposta: Cada mensagem enviada deve conter no m\xE1ximo 1 ou 2 par\xE1grafos curtos (e cada par\xE1grafo com apenas 1 a 2 linhas curtas). Seja o mais breve e sucinto poss\xEDvel!
3. Uma Coisa de Cada Vez: N\xE3o jogue toda a informa\xE7\xE3o ou todas as FAQs de uma vez. V\xE1 conduzindo a conversa aos poucos. Fa\xE7a perguntas para entender a real necessidade do cliente antes de explicar tudo.
4. Mem\xF3ria Recente: Preste muita aten\xE7\xE3o ao hist\xF3rico de mensagens anteriores. Se o cliente acabou de dizer o nome do aparelho, qual o problema ou o que ele deseja, deu continuidade e jamais repita a mesma pergunta ou pe\xE7a para ele dizer novamente.
5. Limite de Emojis: Use no m\xE1ximo 1 ou 2 emojis por mensagem para manter a conversa amig\xE1vel mas profissional.
6. Gerenciamento do Hor\xE1rio de Atendimento (MUITO CR\xCDTICO):
   O status atual de funcionamento da loja f\xEDsica \xE9: ${brazilStatus.statusMessage}.
   - Se o status indicar que a loja est\xE1 "FECHADA" (ou seja, hoje \xE9 Domingo, S\xE1bado fora do hor\xE1rio, ou dias de semana \xE0 noite/almo\xE7o):
     * Voc\xEA DEVE ser 100% transparente com o cliente. Logo nas primeiras mensagens, deixe absolutamente claro que a loja f\xEDsica est\xE1 FECHADA no momento ou que estamos fora do hor\xE1rio de expediente comercial.
     * Diga explicitamente algo amig\xE1vel como: "Ol\xE1! No momento nossa loja f\xEDsica est\xE1 fechada/fora do hor\xE1rio de atendimento, mas eu sou o assistente virtual da AndMicrocell e posso ir registrando todos os detalhes do seu aparelho para adiantar seu atendimento!"
     * Comunique com total clareza que, mesmo fora do hor\xE1rio de funcionamento comercial, voc\xEA est\xE1 ativo para dar andamento na conversa, coletar as informa\xE7\xF5es do aparelho e do problema t\xE9cnico para deixar tudo pronto no sistema.
     * Explique que assim que a equipe t\xE9cnica retornar no primeiro hor\xE1rio \xFAtil, eles analisar\xE3o tudo para resolver, ou que voc\xEA ir\xE1 verificar com a equipe a possibilidade de um t\xE9cnico de plant\xE3o prestar um suporte especial emergencial.
     * NUNCA deu a entender que o atendimento presencial ou final est\xE1 ativo agora se estiver FECHADA. Deixe bem n\xEDtido que a loja est\xE1 fechada, mas que o assistente virtual (voc\xEA) resolve tudo por aqui e deixa engatilhado para os t\xE9cnicos.
    - Se o status indicar que a loja est\xE1 "ABERTA":
      * Siga com o atendimento normal de expediente comercial.
7. Honestidade e Seguran\xE7a: NUNCA invente informa\xE7\xF5es sobre pre\xE7os, servi\xE7os ou pol\xEDticas que n\xE3o estejam descritas acima. Se n\xE3o souber a resposta ou se o cliente fizer uma pergunta muito espec\xEDfica de pre\xE7o que n\xE3o conste na tabela de pre\xE7os nem na base de conhecimento, explique de forma amig\xE1vel e profissional que n\xE3o tem o valor exato no sistema e convide-o calorosamente a trazer para uma avalia\xE7\xE3o gratuita na loja ou pe\xE7a para ele aguardar um momento que um atendente humano ir\xE1 assumir o atendimento para dar todos os detalhes.
8. Responda sempre em Portugu\xEAs do Brasil.
9. Encerramento Objetivo da Conversa: Quando o cliente se despedir, agradecer ("Obrigado", "Valeu", "Tudo certo", "Entendido", "Tchau", "Boa noite", etc.) ou der sinais claros de que a d\xFAvida foi resolvida e o atendimento se encerrou, responda de forma final, extremamente direta, amig\xE1vel e objetiva. NUNCA fa\xE7a novas perguntas redundantes ("Posso ajudar em algo mais?") ou tente prolongar a conversa desnecessariamente. Apenas agrade\xE7a, deseje um excelente dia/noite ou agende um hor\xE1rio para ele trazer o aparelho, e encerre por ali.`;
  };
  app.post("/api/agent/chat", async (req, res) => {
    try {
      const { config, messages } = req.body;
      if (!config) {
        return res.status(400).json({ error: "Configura\xE7\xE3o do agente ausente." });
      }
      const systemPrompt = buildSystemInstruction(config);
      const contents = messages.map((m) => {
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
            temperature: 0.7
          }
        });
        const replyText = response.text || "Desculpe, n\xE3o entendi a sua mensagem. Poderia repetir?";
        return res.json({ text: replyText });
      } catch (geminiError) {
        console.warn("Using fallback response because Gemini API failed or is unconfigured:", geminiError.message);
        const lastUserMessage = messages[messages.length - 1]?.text?.toLowerCase() || "";
        let fallbackResponse = `Ol\xE1! Sou o assistente virtual da ${config.name}. Como posso ajudar?`;
        if (lastUserMessage.includes("horario") || lastUserMessage.includes("hor\xE1rio") || lastUserMessage.includes("abre") || lastUserMessage.includes("fecha")) {
          fallbackResponse = `Nosso hor\xE1rio de funcionamento \xE9: ${config.businessHours || "de segunda a sexta, das 9h \xE0s 18h"}. Ficamos muito felizes com o seu interesse!`;
        } else if (lastUserMessage.includes("endereco") || lastUserMessage.includes("endere\xE7o") || lastUserMessage.includes("onde") || lastUserMessage.includes("localizacao") || lastUserMessage.includes("localiza\xE7\xE3o")) {
          fallbackResponse = config.address ? `N\xF3s estamos localizados em: ${config.address}. Venha nos visitar!` : `N\xF3s atuamos principalmente de forma digital ou com entregas diretas!`;
        } else if (lastUserMessage.includes("preco") || lastUserMessage.includes("pre\xE7o") || lastUserMessage.includes("quanto") || lastUserMessage.includes("valor")) {
          fallbackResponse = `Para valores e or\xE7amentos detalhados do nosso segmento de ${config.category}, fale com nossos especialistas! O que exatamente voc\xEA procura?`;
        } else if (config.faqs && config.faqs.length > 0) {
          const matchedFaq = config.faqs.find(
            (f) => lastUserMessage.includes(f.question.toLowerCase()) || f.question.toLowerCase().split(" ").some((word) => word.length > 4 && lastUserMessage.includes(word))
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
  app.get("/api/webhook/logs", (req, res) => {
    return res.json(webhookLogs);
  });
  app.post("/api/webhook/logs/clear", (req, res) => {
    webhookLogs = [
      { id: `wlog-${Date.now()}`, timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR"), direction: "system", message: "Logs de Webhook limpos", details: "Monitor redefinido" }
    ];
    return res.json({ success: true });
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
      console.log("WhatsApp Incoming webhook:", JSON.stringify(body, null, 2));
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];
      if (!message) {
        return res.status(200).send("EVENT_RECEIVED");
      }
      const fromNumber = message.from;
      const messageId = message.id;
      const messageType = message.type;
      const customerName = value.contacts?.[0]?.profile?.name || "Cliente WhatsApp";
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
        if (messageType !== "text") {
          addWebhookLog("system", `Mensagem ignorada de ${customerName}`, `Tipo de mensagem recebida: ${messageType}. Apenas mensagens de texto s\xE3o processadas automaticamente.`);
          if (messageId && db) {
            try {
              await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "processed_messages", messageId), { processedAt: (/* @__PURE__ */ new Date()).toISOString() });
            } catch (e) {
            }
          }
          return;
        }
        const messageText = message.text?.body;
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
          addWebhookLog("system", `Mensagem recebida de ${customerName}, mas Auto-Resposta est\xE1 desativada`, `O rob\xF4 n\xE3o responder\xE1 automaticamente no momento porque o Auto-WhatsApp est\xE1 desativado no painel.`);
          if (messageId && db) {
            try {
              await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "processed_messages", messageId), { processedAt: (/* @__PURE__ */ new Date()).toISOString() });
            } catch (e) {
            }
          }
          return;
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
        const history = await getWhatsAppHistory(fromNumber);
        const contentsList = history.filter((m) => m && m.text && typeof m.text === "string" && m.text.trim()).map((m) => ({
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
        let replyText = "";
        try {
          const client = getGeminiClient();
          const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
              systemInstruction,
              temperature: 0.7
            }
          });
          replyText = response.text || "Ol\xE1! Desculpe, n\xE3o entendi.";
          const updatedHistory = [
            ...history,
            { role: "user", text: messageText, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
            { role: "model", text: replyText, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
          ];
          await saveWhatsAppHistory(fromNumber, updatedHistory);
        } catch (geminiError) {
          console.warn("Fallback response used in webhook because Gemini failed:", geminiError.message);
          replyText = `Ol\xE1, ${customerName}! Sou o assistente inteligente da ${storedConfig.name}. No momento, estamos processando sua mensagem. Nosso hor\xE1rio \xE9 ${storedConfig.businessHours}.`;
          const updatedHistory = [
            ...history,
            { role: "user", text: messageText, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
            { role: "model", text: replyText, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
          ];
          await saveWhatsAppHistory(fromNumber, updatedHistory);
        }
        addWebhookLog("outbound", `Resposta gerada pela IA`, replyText);
        if (whatsappAccessToken && whatsappPhoneNumberId) {
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
              addWebhookLog("system", `Mensagem oficial enviada via API do WhatsApp`, `Mensagem enviada com sucesso para ${fromNumber}. ID: ${fbResult.messages?.[0]?.id || "N/A"}`);
            } else {
              addWebhookLog("error", `Falha ao enviar mensagem via API do WhatsApp`, JSON.stringify(fbResult));
            }
          } catch (fetchError) {
            addWebhookLog("error", `Erro na requisi\xE7\xE3o para a API do WhatsApp`, fetchError.message);
          }
        } else {
          addWebhookLog("system", `Mensagem de IA pronta, mas envio oficial desativado`, `Insira as credenciais do WhatsApp Cloud API no painel de Integra\xE7\xE3o para enviar respostas oficiais diretamente.`);
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
    res.json({ status: "ok", time: /* @__PURE__ */ new Date() });
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
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (http://localhost:${PORT})`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
