import { initializeApp } from "firebase/app"
import { getStorage, ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage"

const app = initializeApp({
  apiKey: "AIzaSyASbS80xS1_w2UWb_UlBxngzeAGDaIbCsc",
  projectId: "beu-app-10946",
  storageBucket: "beu-app-10946.firebasestorage.app",  // ← newer domain
})

const storage = getStorage(app)

// ── 1. Recursive storage listing ───────────────────────────────────────────
async function scanStorage(storageRef, depth = 0) {
  const indent = "  ".repeat(depth)
  try {
    const res = await listAll(storageRef)

    if (res.prefixes.length === 0 && res.items.length === 0) {
      console.log(`${indent}📁 ${storageRef.fullPath || "root"}  (empty)`)
      return
    }

    for (const folder of res.prefixes) {
      console.log(`${indent}📁 ${folder.fullPath}`)
      await scanStorage(folder, depth + 1)
    }

    for (const file of res.items) {
      console.log(`${indent}📄 ${file.fullPath}`)
      try {
        const url = await getDownloadURL(file)
        console.log(`${indent}   🔗 ${url}`)
      } catch (e) {
        console.log(`${indent}   ❌ URL blocked: ${e.code}`)
      }
    }
  } catch (e) {
    console.log(`${indent}❌ ${storageRef.fullPath || "root"}: ${e.code}`)
  }
}

console.log("=".repeat(60))
console.log("  STORAGE STRUCTURE SCAN (firebasestorage.app)")
console.log("=".repeat(60) + "\n")

await scanStorage(ref(storage))

// ── 2. Direct path probe ───────────────────────────────────────────────────
console.log("\n" + "=".repeat(60))
console.log("  DIRECT PATH PROBE")
console.log("=".repeat(60) + "\n")

const commonPaths = [
  "users", "students", "results", "documents",
  "certificates", "images", "uploads", "backups",
  "admin", "faculty", "fees", "hall_tickets"
]

for (const path of commonPaths) {
  await scanStorage(ref(storage, path), 0)
}

// ── 3. Write test ──────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60))
console.log("  STORAGE WRITE TEST")
console.log("=".repeat(60) + "\n")

try {
  const testRef = ref(storage, "security_test/pentest.txt")
  const blob = new Blob(["authorized_pentest"], { type: "text/plain" })
  await uploadBytes(testRef, blob)
  console.log("⚠️  CRITICAL: Unauthenticated file upload succeeded!")
} catch (e) {
  console.log(`❌ Upload blocked: ${e.code}`)
}

process.exit(0)