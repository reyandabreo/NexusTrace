"use client";

import { useState, useEffect } from "react";
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
import { useNotificationStore } from "@/store/notificationStore";
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
  const [mounted, setMounted] = useState(false);
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "NT";

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-6 backdrop-blur-xl">
        {/* Left: Menu Button + Logo */}
        <div className="flex items-center gap-3">
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
          
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-2.5">
            <span className="text-sm sm:text-base font-bold tracking-tight text-foreground">
              NexusTrace
            </span>
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/5 px-1.5 py-0 text-[9px] font-medium text-primary hidden sm:inline-flex"
            >
              INTEL
            </Badge>
          </Link>
        </div>

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
            className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="h-4 w-4" />
            {mounted && unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-muted"
                suppressHydrationWarning
              >
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
