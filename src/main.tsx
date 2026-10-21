import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Code IDE Styles (Scratch / Blockly / Panels)
import "./styles/theme.css";
import "./styles/code-globals.css";
import "./styles/blockly.css";
import "./styles/components.css";
import "./styles/dropdown.css";
import "./styles/features.css";
import "./styles/layout.css";
import "./styles/panels.css";
import "./styles/ai-modal.css";

createRoot(document.getElementById("root")!).render(<App />);
