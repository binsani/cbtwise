import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Flag, UserPlus, MessageSquare, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

// Generate a short notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not supported
  }
}

function requestBrowserPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showBrowserNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.png" });
  }
}

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem("admin_sound_enabled");
    return stored !== "false";
  });
  const navigate = useNavigate();
  const initialLoadDone = useRef(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNewNotification = useCallback((n: Notification) => {
    if (!initialLoadDone.current) return;

    // Play sound
    if (soundEnabled) playNotificationSound();

    // Browser notification
    showBrowserNotification(n.title, n.message);

    // In-app toast
    toast(n.title, { description: n.message });
  }, [soundEnabled]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("admin_notifications" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20) as any;
    if (data) setNotifications(data);
    initialLoadDone.current = true;
  };

  useEffect(() => {
    requestBrowserPermission();
    fetchNotifications();

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          handleNewNotification(newNotif);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [handleNewNotification]);

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("admin_notifications" as any)
      .update({ is_read: true } as any)
      .in("id", unreadIds) as any;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const typeConfig: Record<string, { icon: typeof Bell; route: string; color: string }> = {
    report: { icon: Flag, route: "/admin/reports", color: "text-destructive" },
    signup: { icon: UserPlus, route: "/admin/users", color: "text-primary" },
    contact: { icon: MessageSquare, route: "/admin/messages", color: "text-accent-foreground" },
  };

  const handleClick = (n: Notification) => {
    const config = typeConfig[n.type];
    if (config) {
      navigate(config.route);
      setOpen(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${
                  !n.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {(() => {
                    const config = typeConfig[n.type];
                    const Icon = config?.icon || Bell;
                    const color = config?.color || "text-muted-foreground";
                    return <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />;
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
