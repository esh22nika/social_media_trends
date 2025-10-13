import { useState, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { PatternMining } from "./pages/PatternMining";
import { TrendAnalysis } from "./pages/TrendAnalysis";
import { TopicExplorer } from "./pages/TopicExplorer";
import { Profile } from "./pages/Profile";
import { About } from "./pages/About";
import { apiService } from "./services/api";

export default function App() {
  const [currentPage, setCurrentPage] = useState("landing");
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkUserSession = async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const response = await apiService.getUserProfile(userId);
          if (response.success) {
            setUser({ id: userId, ...response.data });
          }
        } catch (err) {
          console.error('Error checking user session:', err);
        }
      }
    };

    checkUserSession();
  }, []);

  const handleLogin = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.loginUser(userId);
      if (response.success) {
        setUser({ id: userId, ...response.data });
        localStorage.setItem('userId', userId);
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('userId');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <Landing onNavigate={setCurrentPage} onLogin={handleLogin} user={user} />;
      case "dashboard":
        return <Dashboard user={user} />;
      case "patterns":
        return <PatternMining user={user} />;
      case "analysis":
        return <TrendAnalysis user={user} />;
      case "explorer":
        return <TopicExplorer user={user} />;
      case "profile":
        return <Profile user={user} onLogout={handleLogout} />;
      case "about":
        return <About />;
      default:
        return <Landing onNavigate={setCurrentPage} onLogin={handleLogin} user={user} />;
    }
  };

  return (
    <div className="min-h-screen">
      {currentPage !== "landing" && (
        <Navigation 
          currentPage={currentPage} 
          onNavigate={setCurrentPage}
          user={user}
          onLogout={handleLogout}
        />
      )}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
      {renderPage()}
    </div>
  );
}
