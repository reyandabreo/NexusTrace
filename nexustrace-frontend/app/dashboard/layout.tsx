"use client";

import { useState } from "react";
import TopNavbar from "@/components/layout/TopNavbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>
        
        {/* Mobile Sidebar Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-60 lg:hidden">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <DashboardSidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
