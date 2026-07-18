import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./styles/tokens.css";
import "./styles/global.css";

import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./router";
import { SessionProvider } from "./state/session";

// No StrictMode: the analyze effect fires a Groq-backed API call on mount,
// and StrictMode's double-invoke in dev would duplicate every AI request.
createRoot(document.getElementById("root")!).render(
  <SessionProvider>
    <RouterProvider router={router} />
  </SessionProvider>,
);
