import { useAdminStats } from "@/hooks/use-admin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Music, Download, Heart, MessageCircle, Mic2, Clock, TrendingUp, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(0 72% 51%)", "hsl(142 64% 42%)", "hsl(0 0% 50%)", "hsl(38 92% 50%)", "hsl(210 100% 50%)"];

const AdminAnalytics = () => {
  const { data: stats, isLoading } = useAdminStats();

  // Top songs by plays
  const { data: topSongs } = useQuery({
    queryKey: ["admin-top-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("title, play_count, download_count, genre")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Genre distribution
  const { data: genreData } = useQuery({
    queryKey: ["admin-genre-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("genre")
        .eq("is_approved", true);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((s) => {
        const g = s.genre || "Other";
        counts[g] = (counts[g] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    },
  });

  // Recent signups
  const { data: recentUsers } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, created_at, avatar_url, account_type")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading analytics...</div>;
  }

  if (!stats) return null;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Songs", value: stats.totalSongs, icon: Music, color: "text-secondary" },
    { label: "Pending", value: stats.pendingSongs, icon: Clock, color: "text-yellow-500" },
    { label: "Artists", value: stats.totalArtists, icon: Mic2, color: "text-primary" },
    { label: "Downloads", value: stats.totalDownloads, icon: Download, color: "text-secondary" },
    { label: "Likes", value: stats.totalLikes, icon: Heart, color: "text-primary" },
    { label: "Comments", value: stats.totalComments, icon: MessageCircle, color: "text-secondary" },
  ];

  const chartData = topSongs?.map((s) => ({
    name: s.title.length > 15 ? s.title.slice(0, 15) + "…" : s.title,
    plays: s.play_count || 0,
    downloads: s.download_count || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-lg font-bold text-foreground">Platform Overview</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-card border border-border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Songs Bar Chart */}
        {chartData.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="font-heading text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Top Songs by Plays
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(0 0% 50%)" }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: "hsl(0 0% 50%)" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 12%)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(0 0% 96%)" }}
                />
                <Bar dataKey="plays" fill="hsl(0 72% 51%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Genre Distribution */}
        {genreData && genreData.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="font-heading text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Music className="h-4 w-4 text-secondary" /> Genre Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {genreData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 12%)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {genreData.map((g, i) => (
                <span key={g.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {g.name} ({g.value})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Users */}
      {recentUsers && recentUsers.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="font-heading text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Recent Signups
          </h3>
          <div className="space-y-2">
            {recentUsers.map((u, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-full w-full object-cover" / loading="lazy" decoding="async">
                  ) : (
                    <div className="h-full w-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {u.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.display_name || "Unknown"}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{(u as any).account_type || "fan"}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
