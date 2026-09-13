import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    
    console.log("Using config project ID:", firebaseConfig.projectId);
    console.log("Using config database ID:", firebaseConfig.firestoreDatabaseId);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

    const configDocRef = doc(db, "config", "business");
    const configSnap = await getDoc(configDocRef);
    console.log("\n=== CONFIG SNAPSHOT ===");
    if (configSnap.exists()) {
      console.log(JSON.stringify(configSnap.data(), null, 2));
    } else {
      console.log("No config document found!");
    }

    const logsSnap = await getDocs(collection(db, "webhook_logs"));
    console.log("\n=== LOGS (COUNT:", logsSnap.size, ") ===");
    let list = [];
    logsSnap.forEach(d => {
      list.push({ id: d.id, ...d.data() });
    });
    list.sort((a,b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    list.slice(0, 15).forEach(l => {
      console.log(`[${l.timestamp}] [${l.direction.toUpperCase()}] ${l.message}`);
      if (l.details) console.log(`   -> ${l.details}`);
    });
  } catch (err) {
    console.error("Error fetching logs:", err);
  }
}

main();
