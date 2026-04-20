import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const NotificationBell = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-full h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all">
          <Bell className="h-[20px] w-[20px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 animate-in zoom-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-xl" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-heading font-bold text-sm text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 8).map((n: any) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markAsRead.mutate(n.id)}
                className={`px-4 py-3 border-b border-border/50 last:border-0 cursor-pointer transition-colors hover:bg-muted/50 ${
                  !n.is_read ? "bg-primary/5" : ""
                }`}
              >
                {n.link ? (
                  <Link to={n.link} className="block">
                    <NotificationContent n={n} />
                  </Link>
                ) : (
                  <NotificationContent n={n} />
                )}
              </div>
            ))
          )}
        </div>
        <Link
          to="/notifications"
          className="block py-2.5 text-center text-xs font-semibold text-primary border-t border-border hover:bg-muted/40 transition-colors"
        >
          View all notifications
        </Link>
      </PopoverContent>
    </Popover>
  );
};

const NotificationContent = ({ n }: { n: any }) => (
  <div className="flex gap-3 items-start">
    <div
      className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
        !n.is_read ? "bg-primary" : "bg-transparent"
      }`}
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
      <p className="text-[10px] text-muted-foreground/60 mt-1">
        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
      </p>
    </div>
  </div>
);

export default NotificationBell;
