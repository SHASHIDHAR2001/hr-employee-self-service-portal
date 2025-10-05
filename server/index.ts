import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { setupVite } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=" .repeat(60));
console.log("Starting HR Portal: Python Backend + Vite Frontend");
console.log("=" .repeat(60));
console.log("");

// Create Express app
const app = express();

// Proxy API requests to Python backend (preserve /api prefix)
app.use(createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  logLevel: 'silent',
  filter: (pathname) => pathname.startsWith('/api')
}));

// Setup Vite for development
const server = (await import('http')).createServer(app);
await setupVite(app, server);

// Start Express+Vite server on port 5000
const port = 5000;
server.listen(port, "0.0.0.0", () => {
  console.log(`✓ Vite dev server on http://localhost:${port}`);
  console.log(`✓ API proxied to Python backend on http://localhost:8000`);
  console.log("");
});

// Start Python server on port 8000
console.log("Starting Python backend on port 8000...");
const pythonServerPath = path.join(__dirname, "..", "python_server");

const pythonServer = spawn("python3", ["main.py"], {
  cwd: pythonServerPath,
  stdio: "inherit",
  env: { ...process.env, PORT: "8000" }
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
