import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { NuqsAdapter } from "nuqs/adapters/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-neutral/theme.css";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("#root が見つかりません");
}

createRoot(root).render(
  <StrictMode>
    <NuqsAdapter>
      <Theme theme={neutralTheme} mode="light">
        <App />
      </Theme>
    </NuqsAdapter>
  </StrictMode>,
);
