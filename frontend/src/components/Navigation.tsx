import { TrendingUp, LayoutDashboard, Network, BarChart3, Search, User, Info } from "lucide-react";
import { motion } from "motion/react";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const navItems = [
    { id: "landing", label: "Home", icon: TrendingUp },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "patterns", label: "Pattern Mining", icon: Network },
    { id: "analysis", label: "Trend Analysis", icon: BarChart3 },
    { id: "explorer", label: "Topic Explorer", icon: Search },
    { id: "profile", label: "Profile", icon: User },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <nav className="bg-slate-900/95 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate("landing")}
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-white">TrendMiner</span>
          </motion.div>

          <div className="flex gap-1">
            {navItems.slice(1).map((item) => {
              const isActive = currentPage === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
