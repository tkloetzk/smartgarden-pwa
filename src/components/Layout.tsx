// src/components/Layout.tsx
import React from "react";
import Navigation from "./Navigation";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header - hidden on mobile */}
      <header className="hidden md:block bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌱</span>
              <h1 className="text-xl font-bold text-primary">SmartGarden</h1>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="flex items-center gap-6">
              <a
                href="/"
                className="text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/plants"
                className="text-foreground hover:text-primary transition-colors"
              >
                Plants
              </a>
              <a
                href="/add-plant"
                className="text-foreground hover:text-primary transition-colors"
              >
                Add Plant
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {/* Mobile: full width with bottom nav spacing */}
        {/* Desktop: wider container with proper spacing */}
        <div className="pb-20 md:pb-8 px-4 md:px-6 lg:px-8">
          <div className="max-w-sm md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Navigation - hidden on desktop */}
      <div className="md:hidden">
        <Navigation />
      </div>
    </div>
  );
};

export default Layout;
