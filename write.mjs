import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc } from "firebase/firestore"

const app = initializeApp({
  apiKey: "AIzaSyASbS80xS1_w2UWb_UlBxngzeAGDaIbCsc",
  projectId: "beu-app-10946",
})

const db = getFirestore(app)

// Try multiple collection names
const testCols = ["test", "pentest", "abc", "security_test", "zzz_test"]

for (const col of testCols) {
  try {
    await setDoc(doc(db, col, "probe"), { t: Date.now() })
    console.log(`⚠️  CRITICAL: Write succeeded on → ${col}`)
  } catch (e) {
    console.log(`${col} → ${e.code}`)
  }
}