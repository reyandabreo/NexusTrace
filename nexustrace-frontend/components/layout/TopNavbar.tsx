"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Activity,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import GlobalSearch from "@/components/layout/GlobalSearch";
import NotificationsDrawer from "@/components/layout/NotificationsDrawer";

interface TopNavbarProps {
  onMenuClick?: () => void;
}

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "NT";

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-6 backdrop-blur-xl">
        {/* Mobile Menu Button */}
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Left: Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="hidden text-base font-bold tracking-tight text-foreground sm:inline">
            NexusTrace
          </span>
          <Badge
            variant="outline"
            className="ml-1 border-primary/30 bg-primary/5 px-1.5 py-0 text-[9px] font-medium text-primary hidden sm:inline-flex"
          >
            INTEL
          </Badge>
        </Link>

        {/* Center: Search Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted md:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search cases, entities, evidence...</span>
          <kbd className="ml-8 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Ctrl+K
          </kbd>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-muted">
                <Avatar className="h-7 w-7 border border-primary/30">
                  <AvatarFallback className="bg-primary/20 text-[10px] font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 border-border bg-popover"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">
                  {user?.username || "Investigator"}
                </p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/activity")}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Activity className="h-3.5 w-3.5" />
                Activity Log
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={logout}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Modals */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />
    </>
  );
}
