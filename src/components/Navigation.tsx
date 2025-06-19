// src/components/Navigation.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/utils/cn";

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "🏠" },
    { path: "/plants", label: "Plants", icon: "🌱" },
    { path: "/add-plant", label: "Add Plant", icon: "➕" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center min-w-touch h-full px-2",
              "text-xs font-medium transition-colors",
              location.pathname === item.path
                ? "text-garden-600 bg-garden-50"
                : "text-gray-500 hover:text-garden-500"
            )}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
