import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';
import express from "express";
import { setupVite } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=" .repeat(60));
console.log("Starting Vite Dev Server + Python Backend");
console.log("=" .repeat(60));
console.log("");

// Create Express app for Vite
const app = express();

// Setup Vite for development on port 5173
const server = (await import('http')).createServer(app);
await setupVite(app, server);

// Start Vite server on port 5173
const port = 5173;
server.listen(port, "0.0.0.0", () => {
  console.log(`✓ Vite dev server running on http://localhost:${port}`);
  console.log("");
});

// Start Python server on port 5000 (main port)
console.log("Starting Python backend on port 5000...");
const pythonServerPath = path.join(__dirname, "..", "python_server");

const pythonServer = spawn("python3", ["main.py"], {
  cwd: pythonServerPath,
  stdio: "inherit",
  env: { ...process.env, PORT: "5000" }
});

pythonServer.on("error", (error) => {
  console.error("Failed to start Python server:", error);
  process.exit(1);
});

pythonServer.on("close", (code) => {
  console.log(`Python server exited with code ${code}`);
  process.exit(code || 0);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\nShutting down servers...");
  pythonServer.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down servers...");
  pythonServer.kill("SIGTERM");
  process.exit(0);
});
