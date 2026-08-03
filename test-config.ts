import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
  
  console.log("Reading Firestore config doc...");
  try {
    const docRef = doc(db, "config", "business");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      console.log("Config in Firestore:");
      console.log("- phone:", data.phone);
      console.log("- whatsappPhoneNumberId:", data.whatsappPhoneNumberId);
      console.log("- autoRespondWhatsApp:", data.autoRespondWhatsApp);
      console.log("- whatsappAccessToken length:", data.whatsappAccessToken ? data.whatsappAccessToken.length : 0);
      console.log("- business name:", data.name);
    } else {
      console.log("config/business does not exist in Firestore.");
    }
  } catch (err: any) {
    console.error("Error reading config:", err.message);
  }
  process.exit(0);
}

main();
