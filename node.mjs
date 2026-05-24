import { createServerAdapter } from "@whatwg-node/server";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";

const parseEnvFile = (filePath) => {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
};

parseEnvFile(".env.local");
parseEnvFile(".env");

const { default: worker } = await import("./src/worker.mjs");

const port = +(process.env.PORT || 8080);

const serverAdapter = createServerAdapter(worker.fetch);
const server = createServer(serverAdapter);
server.listen(port, () => {
  console.log("Listening on:", server.address());
});
