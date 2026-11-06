import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// A versão do repositório aparece no rodapé, quando houver package.json na raiz; o commit vem do workflow (VITE_COMMIT)
try {
  const root = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  process.env.VITE_VERSION ||= root.version;
} catch {
  // sem package.json na raiz, o rodapé mostra só o repositório e o commit
}

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  // Caminhos relativos: o mesmo build serve em <org>.github.io/<repositório>/ e em docs.solarianetwork.site/previews/<repositório>/
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
