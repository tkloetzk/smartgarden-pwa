import { Routes, Route } from "react-router-dom";
import { useFirebaseAuth } from "./hooks/useFirebaseAuth";
import { useAppInitialization } from "./hooks/useAppInitialization";
import { useDarkMode } from "./hooks/useDarkMode";
import LogCare from "./pages/care/LogCare";
import { Dashboard } from "./pages/dashboard";
import Plants from "./pages/plants/Plants";
import PlantDetail from "./pages/plants/PlantDetail";
import { AuthForm } from "./components/AuthForm";
import AddPlant from "./pages/plants/AddPlant";
import Layout from "./components/Layout";
import CatchUpPage from "./pages/catch-up";

const App = () => {
  const { user, loading } = useFirebaseAuth();
  useDarkMode();
  useAppInitialization();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/plants" element={<Plants />} />
        <Route path="/plants/:plantId" element={<PlantDetail />} />
        <Route path="/add-plant" element={<AddPlant />} />
        <Route path="/log-care" element={<LogCare />} />
        <Route path="/log-care/:plantId" element={<LogCare />} />
        <Route path="/catch-up" element={<CatchUpPage />} />
      </Routes>
    </Layout>
  );
};

export default App;
