import { Routes, Route } from "react-router-dom";
import { useFirebaseAuth } from "./hooks/useFirebaseAuth";
import { useAppInitialization } from "./hooks/useAppInitialization";
import { useDarkMode } from "./hooks/useDarkMode"; // Add this import
import LogCare from "./pages/care/LogCare";
import { Dashboard } from "./pages/dashboard";
import Plants from "./pages/plants/Plants";
import PlantDetail from "./pages/plants/PlantDetail";
import { AuthForm } from "./components/AuthForm";
import AddPlant from "./pages/plants/AddPlant";

const App = () => {
  const { user, loading } = useFirebaseAuth();
  useDarkMode(); // Initialize dark mode globally
  useAppInitialization();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/plants" element={<Plants />} />
        <Route path="/plants/:plantId" element={<PlantDetail />} />
        <Route path="/add-plant" element={<AddPlant />} />
        <Route path="/log-care" element={<LogCare />} />
        <Route path="/log-care/:plantId" element={<LogCare />} />
      </Routes>
    </div>
  );
};

export default App;
