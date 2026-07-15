import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

await mkdir(new URL("../web/dist/", import.meta.url), { recursive: true });

await build({
  entryPoints: [fileURLToPath(new URL("../web/entry.tsx", import.meta.url))],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  outfile: fileURLToPath(new URL("../web/dist/widget.js", import.meta.url)),
  minify: true,
  sourcemap: false,
  jsx: "automatic",
  legalComments: "none",
  logLevel: "info",
});

await Promise.all([
  copyFile(
    new URL("../web/dist/widget.js", import.meta.url),
    new URL("../web/dist/widget.js.txt", import.meta.url),
  ),
  copyFile(
    new URL("../web/dist/widget.css", import.meta.url),
    new URL("../web/dist/widget.css.txt", import.meta.url),
  ),
]);
