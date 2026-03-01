"use client";

import {
  AlertTriangle,
  FileText,
  Shield,
  CheckCircle2,
  X,
  Loader2,
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
import { useNotificationStore } from "@/store/notificationStore";
import { useRouter } from "next/navigation";

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const iconMap = {
  alert: { icon: AlertTriangle, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
  evidence: { icon: FileText, color: "text-primary", bg: "bg-primary/10" },
  system: { icon: Shield, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10" },
  success: { icon: CheckCircle2, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
  processing: { icon: Loader2, color: "text-cyan-500", bg: "bg-cyan-500/10" },
} as const;

export default function NotificationsDrawer({
  open,
  onOpenChange,
}: NotificationsDrawerProps) {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, removeNotification, getUnreadCount } = useNotificationStore();
  const unreadCount = getUnreadCount();

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onOpenChange(false);
    }
  };

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
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-auto px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                Mark all read
              </Button>
            )}
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
                    onClick={() => handleNotificationClick(notification)}
                    className={`group relative flex gap-3 px-5 py-4 transition-colors ${
                      notification.actionUrl ? 'cursor-pointer hover:bg-muted/50' : ''
                    } ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeConfig.bg}`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${typeConfig.color} ${notification.type === 'processing' ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-foreground leading-tight">
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {!notification.read && (
                            <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {notification.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {notification.description}
                        </p>
                      )}
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
