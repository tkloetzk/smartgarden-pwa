// src/components/Navigation.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/utils/cn";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "🏠" },
    { path: "/plants", label: "Plants", icon: "🌱" },
    { path: "/add-plant", label: "Add Plant", icon: "➕" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center min-w-touch h-full px-2",
              "text-xs font-medium transition-colors",
              location.pathname === item.path
                ? "text-garden-600 dark:text-emerald-400 bg-garden-50 dark:bg-gray-800"
                : "text-gray-500 dark:text-gray-400 hover:text-garden-500 dark:hover:text-emerald-400"
            )}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}

        {/* Dark Mode Toggle */}
        <div className="flex flex-col items-center justify-center h-full px-2">
          <DarkModeToggle size="sm" />
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Theme
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
