// Production entrypoint shim for Cloud Run / Node runtimes
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.NODE_ENV = process.env.NODE_ENV || "production";

const distServer = path.join(process.cwd(), "dist", "server.cjs");
if (fs.existsSync(distServer)) {
  // Use pathToFileURL to ensure reliable ESM resolution across environments
  import(pathToFileURL(distServer).href);
} else {
  import("./server.ts");
}

