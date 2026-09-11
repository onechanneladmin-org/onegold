import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "next-themes"
import { AppStoreProvider } from "@/store/AppStore"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import App from "./App.tsx"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppStoreProvider>
        <TooltipProvider>
          <App />
          <Toaster />
        </TooltipProvider>
      </AppStoreProvider>
    </ThemeProvider>
  </StrictMode>,
)
