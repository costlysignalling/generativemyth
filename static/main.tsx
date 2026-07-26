import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import GenerativeMyth from "../app/GenerativeMyth";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GenerativeMyth />
  </StrictMode>,
);
