import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase client-side
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

export { collection, getDocs, doc, getDoc, query, orderBy, setDoc, deleteDoc, updateDoc };
