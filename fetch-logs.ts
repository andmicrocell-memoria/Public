import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    let firebaseConfig: any = null;
    const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
    
    if (fs.existsSync(firebaseConfigPath)) {
      try {
        const content = fs.readFileSync(firebaseConfigPath, "utf8").trim();
        if (content) {
          firebaseConfig = JSON.parse(content);
        }
      } catch (e: any) {
        console.error("Error parsing config file:", e.message);
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
          firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.DATABASE_ID || "ai-studio-zetachatai-3dcef398-a4dc-47e6-8792-542eb1d19d97",
        };
      }
    }

    if (!firebaseConfig) {
      console.error("No Firebase config found!");
      return;
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log("Firestore loaded with database ID:", firebaseConfig.firestoreDatabaseId || "(default)");

    // 1. Fetch webhook logs (without query ordering to see if that's causing permission or index issues)
    const logsRef = collection(db, "webhook_logs");
    const snapshot = await getDocs(logsRef);
    
    console.log("\n=== LATEST WEBHOOK LOGS ===");
    let count = 0;
    snapshot.forEach(doc => {
      if (count++ < 15) {
        const data = doc.data();
        console.log(`[${data.timestamp}] [${data.direction.toUpperCase()}] ${data.message}`);
        if (data.details) {
          console.log(`  Details: ${data.details}`);
        }
      }
    });

    // 2. Fetch business configuration
    const { doc, getDoc } = await import("firebase/firestore");
    const configDocRef = doc(db, "config", "business");
    const configSnap = await getDoc(configDocRef);
    console.log("\n=== BUSINESS CONFIGURATION ===");
    if (configSnap.exists()) {
      console.log(JSON.stringify(configSnap.data(), null, 2));
    } else {
      console.log("business config document does not exist");
    }

  } catch (error: any) {
    console.error("Error in main:", error);
  }
}

main();
