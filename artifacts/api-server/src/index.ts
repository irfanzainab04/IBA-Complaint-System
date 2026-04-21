import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { config } from "dotenv";
import app from "./app";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootEnvPath = resolve(__dirname, "../../..", ".env");
config({ path: rootEnvPath });

const rawPort = process.env["PORT_API_SERVER"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
