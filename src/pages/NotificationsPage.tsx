import Layout from "@/components/Layout";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Heart, Repeat2, MessageCircle, UserPlus, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/use-document-meta";

const ICONS: Record<string, any> = {
  follow: UserPlus,
  repost: Repeat2,
  reply: MessageCircle,
  new_release: Music,
  like: Heart,
};

const NotificationsPage = () => {
  useDocumentMeta({ title: "Notifications — SudaGospel", description: "All your activity in one place." });
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-20 px-6">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Sign in to see your notifications</p>
          <Link to="/auth"><Button>Sign in</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 pt-6 pb-32 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-3xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
              <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => {
              const Icon = ICONS[n.type] ?? Bell;
              const body = (
                <div className={`flex gap-3 p-3 rounded-xl border transition-colors ${!n.is_read ? "bg-primary/5 border-primary/20" : "bg-card border-border/50 hover:bg-muted/40"}`}>
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${!n.is_read ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} to={n.link} onClick={() => !n.is_read && markAsRead.mutate(n.id)}>{body}</Link>
              ) : (
                <button key={n.id} onClick={() => !n.is_read && markAsRead.mutate(n.id)} className="block w-full text-left">{body}</button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
