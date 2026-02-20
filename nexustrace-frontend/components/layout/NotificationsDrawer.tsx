"use client";

import {
  AlertTriangle,
  FileText,
  Shield,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Notifications will be fetched from API
type NotificationType = keyof typeof iconMap;

interface Notification {
  id: string | number;
  type: NotificationType;
  title: string;
  description?: string;
  time?: string;
  read?: boolean;
}

const notifications: Notification[] = [];

const iconMap = {
  alert: { icon: AlertTriangle, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
  evidence: { icon: FileText, color: "text-primary", bg: "bg-primary/10" },
  system: { icon: Shield, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10" },
  success: { icon: CheckCircle2, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
};

export default function NotificationsDrawer({
  open,
  onOpenChange,
}: NotificationsDrawerProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-border bg-card p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold text-foreground truncate">
                Notifications
              </SheetTitle>
              {unreadCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 px-1.5 py-0 text-[10px] text-primary shrink-0"
                >
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-6 py-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              Mark all read
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="divide-y divide-border">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const typeConfig = iconMap[notification.type];
                const Icon = typeConfig.icon;
                return (
                  <div
                    key={notification.id}
                    className={`group relative flex gap-3 px-5 py-4 transition-colors hover:bg-muted/50 ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeConfig.bg}`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-foreground leading-tight">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notification.description}
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground/70">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                  <Shield className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">All Clear</h3>
                <p className="text-xs text-muted-foreground text-center">No new notifications at the moment</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
