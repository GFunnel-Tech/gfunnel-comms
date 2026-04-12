import { createRoot } from "react-dom/client";
import { initGFunnelBridge, isInsideGFunnel } from "@/lib/gfunnel-bridge";
import App from "./App.tsx";
import "./index.css";

// Initialize bridge BEFORE React renders to avoid missing early gfunnel:init messages
if (isInsideGFunnel()) {
  initGFunnelBridge('chat');
}

createRoot(document.getElementById("root")!).render(<App />);
