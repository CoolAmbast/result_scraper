import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore"
import { getStorage, ref, listAll } from "firebase/storage"

const API_KEY = "AIzaSyASbS80xS1_w2UWb_UlBxngzeAGDaIbCsc"
const PROJECT = "beu-app-10946"

const app = initializeApp({
  apiKey: API_KEY,
  authDomain: `${PROJECT}.firebaseapp.com`,
  projectId: PROJECT,
  storageBucket: `${PROJECT}.appspot.com`,
  messagingSenderId: "49555334698",
  appId: "1:49555334698:web:1eadefbc40cfa6fe898553"
})

const db = getFirestore(app)
const storage = getStorage(app)

async function listSubcollections(docPath) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}:listCollectionIds?key=${API_KEY}`
  try {
    const res = await fetch(url, { method: "POST", body: JSON.stringify({}) })
    const json = await res.json()
    return json.collectionIds || []
  } catch {
    return []
  }
}

async function listRootCollections() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:listCollectionIds?key=${API_KEY}`
  try {
    const res = await fetch(url, { method: "POST", body: JSON.stringify({}) })
    const json = await res.json()
    return json.collectionIds || []
  } catch (e) {
    return []
  }
}

async function scanCollection(colPath, depth = 0) {
  const indent = "  ".repeat(depth)
  try {
    const snap = await getDocs(collection(db, colPath))
    console.log(`${indent}📂 ${colPath}  (${snap.size} docs)`)

    for (const docSnap of snap.docs) {
      console.log(`${indent}  📄 ${docSnap.id}`)

      const data = docSnap.data()
      for (const key of Object.keys(data).slice(0, 5)) {
        const val = JSON.stringify(data[key])
        console.log(`${indent}     ${key}: ${val?.slice(0, 80)}`)
      }
      const subCols = await listSubcollections(`${colPath}/${docSnap.id}`)
      for (const sub of subCols) {
        await scanCollection(`${colPath}/${docSnap.id}/${sub}`, depth + 2)
      }
    }
  } catch (e) {
    console.log(`${indent}❌ ${colPath}: ${e.code}`)
  }
}

console.log("=".repeat(60))
console.log("  FIRESTORE FULL STRUCTURE SCAN (via REST)")
console.log("=".repeat(60) + "\n")

const rootCollections = await listRootCollections()

if (rootCollections.length === 0) {
  console.log("❌ Root collection listing blocked (permission-denied)")
  console.log("   Falling back to known collection names...\n")
} else {
  console.log(`✅ Found ${rootCollections.length} root collections: ${rootCollections.join(", ")}\n`)
}

const toScan = rootCollections.length > 0
  ? rootCollections
  : ["users", "results", "students", "admins", "faculty"] // fallback

for (const col of toScan) {
  await scanCollection(col)
}

console.log("\n" + "=".repeat(60))
console.log("  WRITE TEST")
console.log("=".repeat(60) + "\n")

try {
  await setDoc(doc(db, "security_test", "pentest"), {
    tester: "authorized_pentest",
    timestamp: new Date().toISOString()
  })
  console.log("⚠️  CRITICAL: Unauthenticated write access confirmed!")
} catch (e) {
  console.log(`❌ Write blocked: ${e.code}`)
}

console.log("\n" + "=".repeat(60))
console.log("  STORAGE SCAN")
console.log("=".repeat(60) + "\n")

async function scanStorage(storageRef, depth = 0) {
  const indent = "  ".repeat(depth)
  try {
    const res = await listAll(storageRef)
    for (const folder of res.prefixes) {
      console.log(`${indent}📁 ${folder.fullPath}`)
      await scanStorage(folder, depth + 1)
    }
    for (const file of res.items) {
      console.log(`${indent}🖹  ${file.fullPath}`)
    }
  } catch (e) {
    console.log(`${indent}❌ ${storageRef.fullPath || "root"}: ${e.code}`)
  }
}

await scanStorage(ref(storage))

process.exit(0)