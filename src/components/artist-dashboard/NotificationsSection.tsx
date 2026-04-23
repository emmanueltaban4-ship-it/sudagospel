import { useNotifications } from "@/hooks/use-notifications";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Heart, MessageSquare, UserPlus, Repeat2, Music, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const TYPE_ICON: Record<string, any> = {
  follow: UserPlus,
  repost: Repeat2,
  reply: MessageSquare,
  new_release: Music,
  earning: DollarSign,
  like: Heart,
};

const NotificationsSection = () => {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-lg font-bold flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Activity center</h3>
            <p className="text-xs text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => markAllAsRead.mutate()}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading && <p className="text-xs text-muted-foreground py-6 text-center">Loading...</p>}

        {!isLoading && notifications.length === 0 && (
          <div className="py-10 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}

        <div className="space-y-1">
          {notifications.map((n: any) => {
            const Icon = TYPE_ICON[n.type] ?? Bell;
            const Body = (
              <div className={`p-3 rounded-xl flex gap-3 transition ${n.is_read ? "bg-muted/10" : "bg-primary/5 border border-primary/20"}`}>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{n.title}</p>
                    {!n.is_read && <Badge className="bg-primary text-primary-foreground border-0 text-[9px] h-4 px-1.5">New</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            );
            return (
              <div key={n.id} onClick={() => !n.is_read && markAsRead.mutate(n.id)}>
                {n.link ? <Link to={n.link}>{Body}</Link> : Body}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default NotificationsSection;
