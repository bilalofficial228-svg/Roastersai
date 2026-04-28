import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.documentElement.classList.add("dark");
document.documentElement.style.colorScheme = "dark";
try { localStorage.removeItem("roastify:theme"); } catch {}

createRoot(document.getElementById("root")!).render(<App />);
