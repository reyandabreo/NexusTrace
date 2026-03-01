"use client";

import { useParams } from "next/navigation";
import { useTimeline } from "@/hooks/useCases";
import { 
  Clock, 
  AlertTriangle, 
  Package, 
  Truck, 
  CheckCircle2,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Server,
  MessageSquare
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { TimelineEvent } from "@/types/case";

// Helper function to get icon based on event type
const getEventIcon = (eventType: string) => {
  const type = eventType.toLowerCase();
  if (type.includes("email") || type.includes("mail")) return Mail;
  if (type.includes("call") || type.includes("phone")) return Phone;
  if (type.includes("message") || type.includes("chat")) return MessageSquare;
  if (type.includes("location") || type.includes("address")) return MapPin;
  if (type.includes("user") || type.includes("person")) return User;
  if (type.includes("document") || type.includes("file")) return FileText;
  if (type.includes("login") || type.includes("auth")) return Shield;
  if (type.includes("server") || type.includes("system")) return Server;
  if (type.includes("confirm") || type.includes("complete")) return CheckCircle2;
  if (type.includes("ship") || type.includes("delivery")) return Truck;
  if (type.includes("order") || type.includes("package")) return Package;
  return Clock;
};

// Helper function to format date compactly
const formatCompactDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  // Format time
  const timeStr = date.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false 
  });
  
  // If today, just show time
  if (diffInDays === 0) {
    return `Today, ${timeStr}`;
  }
  
  // If yesterday
  if (diffInDays === 1) {
    return `Yesterday, ${timeStr}`;
  }
  
  // Otherwise show compact date
  const dateStr = date.toLocaleDateString("en-US", { 
    day: "2-digit", 
    month: "short"
  });
  
  return `${dateStr}, ${timeStr}`;
};

export default function TimelinePage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: events, isLoading } = useTimeline(caseId);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const timelineData: TimelineEvent[] = events || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">
          Timeline
        </h1>
        <Badge 
          variant="outline" 
          className="bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800"
        >
          In Progress
        </Badge>
      </div>

      {timelineData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16">
          <Clock className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-base font-semibold text-foreground">
            No timeline data yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and process evidence to generate the timeline
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline container */}
          <div className="space-y-4">
            {timelineData.map((event, idx) => {
              const EventIcon = getEventIcon(event.event_type);
              const isHighRisk = event.risk_score && event.risk_score > 0.7;
              
              return (
                <div key={event.id || idx} className="relative flex gap-4">
                  {/* Left side - Icon with vertical line */}
                  <div className="relative flex flex-col items-center">
                    {/* Icon container */}
                    <div className={`
                      flex h-10 w-10 shrink-0 items-center justify-center rounded-full 
                      ${isHighRisk 
                        ? "bg-red-100 dark:bg-red-950/30" 
                        : "bg-gray-100 dark:bg-gray-800"
                      }
                    `}>
                      <EventIcon className={`h-5 w-5 ${isHighRisk ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`} />
                    </div>
                    
                    {/* Vertical line - only show if not last item */}
                    {idx < timelineData.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-2 min-h-5" />
                    )}
                  </div>

                  {/* Right side - Content */}
                  <div className="flex-1 pb-4 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {event.description}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {event.source}
                        </p>
                      </div>
                      
                      {/* Compact date on the right */}
                      <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {formatCompactDate(event.timestamp)}
                      </div>
                    </div>
                    
                    {/* Entities or additional info */}
                    {event.entities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {event.entities.slice(0, 3).map((ent, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-[10px] bg-primary/5 text-primary border-primary/20"
                          >
                            {ent}
                          </Badge>
                        ))}
                        {event.entities.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-muted text-muted-foreground"
                          >
                            +{event.entities.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
