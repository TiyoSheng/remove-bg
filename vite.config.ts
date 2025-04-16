import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import cssInject from "vite-plugin-css-injected-by-js"
import { resolve } from "node:path"
import fs from "node:fs/promises"

export default defineConfig({
  plugins: [
    react(),
     cssInject(),
     {
      name: 'index.js',
      apply: 'build',
      async writeBundle() {
        try {
          const manifest = JSON.parse(await fs.readFile("dist/.vite/manifest.json", "utf-8"))
          // 检查 manifest 中的所有入口点
          console.log("Available entries in manifest:", Object.keys(manifest))
          
          // 使用 index.html 作为入口点
          const indexEntry = manifest["index.html"]
          if (!indexEntry || !indexEntry.file) {
            console.error("Could not find index.html entry in manifest or missing file property")
            return
          }
          
          await fs.writeFile("dist/index.js", `export {default} from "./${indexEntry.file}"`)
        } catch (error) {
          console.error("Error in writeBundle plugin:", error)
        }
      }
     }
  ],
  resolve:
    process.env.NODE_ENV === "production"
      ? {
          alias: {
            "@huggingface/transformers":
              "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0-alpha.9",
          },
        }
      : {},
  build: {
    manifest: true,
    target: "esnext",
    rollupOptions:
      process.env.TARGET === "bannerify"
        ? {
            external: ["react/jsx-runtime", "react", "react-dom"],
            input: resolve(__dirname, "src/App.tsx"),
            preserveEntrySignatures: "exports-only",
            output: {
              entryFileNames: "index.[hash].js",
              format: "esm",
            },
          }
        : {},
  },
})
