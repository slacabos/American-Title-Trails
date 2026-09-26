import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { readTimeOfDay } from "./rendering/timeOfDay";

// Set before the first paint so the page never flashes the other theme.
document.documentElement.dataset.time = readTimeOfDay();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
