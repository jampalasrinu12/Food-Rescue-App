import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

/* 🗺️ REQUIRED FOR MAP (LEAFLET) */
import "leaflet/dist/leaflet.css";

const basePath = import.meta.env.DEV ? "/" : "/Food-Rescue-App/";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={basePath}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
