import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/Home";
import { AnalyzePage } from "./pages/Analyze";
import { SetupPage } from "./pages/Setup";
import { SessionPage } from "./pages/Session";
import { SummaryPage } from "./pages/Summary";
import { ChatPage } from "./pages/Chat";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/analyze", element: <AnalyzePage /> },
  { path: "/setup", element: <SetupPage /> },
  { path: "/session", element: <SessionPage /> },
  { path: "/summary", element: <SummaryPage /> },
  { path: "/chat", element: <ChatPage /> },
]);
