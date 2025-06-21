// Update src/App.tsx - add the new route
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/dashboard";
import Plants from "./pages/plants/Plants";
import PlantDetail from "@/pages/plants/PlantDetail";
import AddPlant from "./pages/plants/AddPlant";
import LogCare from "./pages/care/LogCare";
import Navigation from "./components/Navigation";
import { useAppInitialization } from "./hooks/useAppInitialization";
import { initializeDatabase } from "./db/seedData";
import "./App.css";

function App() {
  useAppInitialization();

  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plants" element={<Plants />} />
          <Route path="/plants/:plantId" element={<PlantDetail />} />{" "}
          {/* Add this route */}
          <Route path="/log-care" element={<LogCare />} />
          <Route path="/add-plant" element={<AddPlant />} />
        </Routes>
      </main>

      <Navigation />
    </div>
  );
}

export default App;
