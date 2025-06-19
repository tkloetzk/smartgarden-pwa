// src/App.tsx
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/dashboard";
import Plants from "./pages/plants/Plants";
import AddPlant from "./pages/plants/AddPlant";
import LogCare from "./pages/care/LogCare";
import Navigation from "./components/Navigation";
import { useAppInitialization } from "./hooks/useAppInitialization";
import { initializeDatabase } from "./db/seedData";
import "./App.css";

function App() {
  useAppInitialization(); // Add this line

  useEffect(() => {
    // Initialize the database with seed varieties on app start
    initializeDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content area with bottom padding for navigation */}
      <main className="pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plants" element={<Plants />} />
          <Route path="/log-care" element={<LogCare />} />
          <Route path="/add-plant" element={<AddPlant />} />
        </Routes>
      </main>

      {/* Fixed bottom navigation for mobile */}
      <Navigation />
    </div>
  );
}

export default App;
