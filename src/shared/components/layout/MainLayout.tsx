import { Sidebar } from "./Sidebar";
import React from "react";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-chess text-white">
      <Sidebar />
      <div className="flex-1 ml-16 md:ml-64 transition-all duration-300 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
