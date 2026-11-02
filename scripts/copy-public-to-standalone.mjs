import fs from "fs";
import path from "path";

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else if (exists) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

// 1. Copiar public/ -> .next/standalone/public/
const srcPublic = path.resolve(process.cwd(), "public");
const srcStatic = path.resolve(process.cwd(), ".next/static");
const baseStandalone = path.resolve(process.cwd(), ".next/standalone");

function findServerDirs(dir) {
  let targets = [];
  if (!fs.existsSync(dir)) return targets;
  
  // Si este directorio tiene server.js o package.json de standalone, es target
  if (fs.existsSync(path.join(dir, "server.js"))) {
    targets.push(dir);
  }

  // Buscar recursivamente subdirectorios
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".next") {
      const full = path.join(dir, entry.name);
      if (fs.existsSync(path.join(full, "server.js"))) {
        targets.push(full);
      }
    }
  }
  return targets;
}

if (fs.existsSync(baseStandalone)) {
  const targets = findServerDirs(baseStandalone);
  // Siempre asegurar la raíz de standalone
  if (!targets.includes(baseStandalone)) {
    targets.unshift(baseStandalone);
  }

  for (const target of targets) {
    const destPublic = path.join(target, "public");
    const destStatic = path.join(target, ".next/static");

    console.log(`[postbuild] Copiando activos a ${target}...`);
    copyRecursiveSync(srcPublic, destPublic);

    if (fs.existsSync(srcStatic)) {
      copyRecursiveSync(srcStatic, destStatic);
    }
  }
  console.log("[postbuild] ✅ Todos los activos estáticos e imágenes copiados con éxito a standalone.");
}
