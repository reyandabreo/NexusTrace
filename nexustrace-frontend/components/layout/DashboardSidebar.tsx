"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderOpen,
  PlusCircle,
  LogOut,
  Settings,
  BarChart3,
  Activity,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCaseId, getCaseName } from "@/lib/caseUtils";
import { useLogout } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { useCases } from "@/hooks/useCases";
import { useCaseStore } from "@/store/caseStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const investigationNav = [
  { href: "/dashboard", label: "Command Center", icon: Home },
  { href: "/dashboard/cases", label: "All Cases", icon: FolderOpen },
];

const intelligenceNav = [
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/activity", label: "Activity Log", icon: Activity },
];

const systemNav = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/audit", label: "Audit Trail", icon: ShieldCheck },
];

interface NavSectionProps {
  title: string;
  items: typeof investigationNav;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavSection({ title, items, pathname, collapsed, onNavigate }: NavSectionProps) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      )}
      <nav className="space-y-0.5">
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="border-border bg-popover text-popover-foreground">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
        })}
      </nav>
    </div>
  );
}

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

export default function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);
  const { data: cases } = useCases();
  const selectedCase = useCaseStore((s) => s.selectedCase);
  const setCurrentCase = useCaseStore((s) => s.setCurrentCase);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "NT";

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Collapse Toggle */}
      <div className={cn("flex items-center p-3", collapsed ? "justify-center" : "justify-end")}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Quick Case Switcher */}
      {!collapsed && cases && cases.length > 0 && (
        <div className="px-3 pb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted">
                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="flex-1 truncate text-xs font-medium text-foreground">
                  {selectedCase ? getCaseName(selectedCase) : "Select case..."}
                </span>
                <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-52 border-border bg-popover"
            >
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Switch Case
              </p>
              <DropdownMenuSeparator className="bg-border" />
              {cases.slice(0, 8).map((c) => (
                <DropdownMenuItem key={getCaseId(c)} asChild>
                  <Link
                    href={`/dashboard/case/${getCaseId(c)}`}
                    onClick={() => setCurrentCase(c)}
                    className="gap-2 text-xs"
                  >
                    <FolderOpen className="h-3 w-3 text-primary" />
                    <span className="truncate">{getCaseName(c)}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="gap-2 text-xs text-muted-foreground">
                  <PlusCircle className="h-3 w-3" />
                  Create New Case
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <Separator className="bg-border" />

      {/* Navigation Sections */}
      <ScrollArea className="flex-1 px-2 py-3">
        <NavSection
          title="Investigation"
          items={investigationNav}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <NavSection
          title="Intelligence"
          items={intelligenceNav}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <NavSection
          title="System"
          items={systemNav}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </ScrollArea>

      {/* User Footer */}
      <div className="border-t border-border p-2">
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-border bg-popover text-white">
              Sign Out
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2 rounded-lg p-2">
            <Avatar className="h-7 w-7 border border-primary/20">
              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-foreground">
                {user?.username || "Investigator"}
              </p>
              {user?.email && (
                <p className="truncate text-[10px] text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
            <button
              onClick={logout}
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
