import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ScanProvider } from "./context/ScanContext";

createRoot(document.getElementById("root")!).render(
  <ScanProvider>
    <App />
  </ScanProvider>
);
