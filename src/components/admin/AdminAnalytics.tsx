import { useAdminStats } from "@/hooks/use-admin";
import { Users, Music, Download, Heart, MessageCircle, Mic2, Clock } from "lucide-react";

const AdminAnalytics = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading stats...</div>;
  }

  if (!stats) return null;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Songs", value: stats.totalSongs, icon: Music, color: "text-secondary" },
    { label: "Pending Approval", value: stats.pendingSongs, icon: Clock, color: "text-gospel-gold" },
    { label: "Artists", value: stats.totalArtists, icon: Mic2, color: "text-primary" },
    { label: "Downloads", value: stats.totalDownloads, icon: Download, color: "text-secondary" },
    { label: "Likes", value: stats.totalLikes, icon: Heart, color: "text-primary" },
    { label: "Comments", value: stats.totalComments, icon: MessageCircle, color: "text-secondary" },
  ];

  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-foreground mb-4">Platform Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-card border border-border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnalytics;
