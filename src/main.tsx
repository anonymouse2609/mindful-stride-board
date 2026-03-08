import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme before render to prevent flash
const savedTheme = localStorage.getItem("growth-theme") || "dark";
const resolved = savedTheme === "auto"
  ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  : savedTheme;
document.documentElement.classList.add(resolved);

createRoot(document.getElementById("root")!).render(<App />);
