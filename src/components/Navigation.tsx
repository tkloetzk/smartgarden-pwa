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
    <nav className="fixed bottom-0 left-0 right-0 bg-card dark:bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center min-w-touch h-full px-2",
              "text-xs font-medium transition-colors",
              location.pathname === item.path
                ? "text-garden-600 dark:text-emerald-500 bg-garden-50 dark:bg-card" // was emerald-400
                : "text-muted-foreground dark:text-muted-foreground hover:text-garden-500 dark:hover:text-emerald-500" // was emerald-400
            )}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}

        {/* Dark Mode Toggle */}
        <div className="flex flex-col items-center justify-center h-full px-2">
          <DarkModeToggle size="sm" />
          <span className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
            Theme
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
