// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./styles/globals.css"; // Only import globals.css
import { validateAllVarieties } from "./data/seedVarieties";

// Validate growth timeline data on app startup
if (process.env.NODE_ENV === 'development') {
  const validationErrors = validateAllVarieties();
  if (validationErrors.length > 0) {
    console.warn('Growth timeline validation found issues (app will continue in dev mode):');
    validationErrors.forEach(error => console.warn(`  - ${error}`));
  } else {
    console.log('✅ All growth timelines validated successfully');
  }
}

// Configure React Query for offline-first data management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: (failureCount) => {
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
