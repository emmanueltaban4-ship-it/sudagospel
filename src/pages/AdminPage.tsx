import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin, useAdminStats } from "@/hooks/use-admin";
import Layout from "@/components/Layout";
import AdminApprovalQueue from "@/components/admin/AdminApprovalQueue";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminModeration from "@/components/admin/AdminModeration";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminArticles from "@/components/admin/AdminArticles";
import AdminSiteSettings from "@/components/admin/AdminSiteSettings";
import AdminSongManagement from "@/components/admin/AdminSongManagement";
import AdminArtistManagement from "@/components/admin/AdminArtistManagement";
import AdminAds from "@/components/admin/AdminAds";
import AdminMonetization from "@/components/admin/AdminMonetization";
import AdminGenreManagement from "@/components/admin/AdminGenreManagement";
import AdminAlbumManagement from "@/components/admin/AdminAlbumManagement";
import AdminReports from "@/components/admin/AdminReports";
import AdminFeaturedContent from "@/components/admin/AdminFeaturedContent";
import AdminEmailLogs from "@/components/admin/AdminEmailLogs";
import AdminVideoManagement from "@/components/admin/AdminVideoManagement";
import AdminVerificationRequests from "@/components/admin/AdminVerificationRequests";
import { Shield, CheckSquare, Users, MessageCircle, BarChart3, ArrowLeft, FileText, Settings2, Music, Mic2, Megaphone, DollarSign, Tag, Disc3, Flag, Star, Mail, Video, BadgeCheck } from "lucide-react";

const tabs = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "monetization", label: "Monetization", icon: DollarSign },
  { id: "ads", label: "Ads", icon: Megaphone },
  { id: "songs", label: "Songs", icon: Music },
  { id: "videos", label: "Videos", icon: Video },
  { id: "artists", label: "Artists", icon: Mic2 },
  { id: "albums", label: "Albums", icon: Disc3 },
  { id: "genres", label: "Genres", icon: Tag },
  { id: "articles", label: "Articles", icon: FileText },
  { id: "approvals", label: "Approvals", icon: CheckSquare },
  { id: "users", label: "Users", icon: Users },
  { id: "moderation", label: "Moderation", icon: MessageCircle },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "featured", label: "Featured", icon: Star },
  { id: "verification", label: "Verification", icon: BadgeCheck },
  { id: "emails", label: "Emails", icon: Mail },
] as const;

type TabId = typeof tabs[number]["id"];

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: stats } = useAdminStats();
  const [activeTab, setActiveTab] = useState<TabId>("analytics");

  if (authLoading || roleLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-heading text-xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-sm text-muted-foreground mb-4">You don't have admin privileges.</p>
          <button onClick={() => navigate("/")} className="text-sm text-primary hover:underline">
            Go Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          {stats && stats.pendingSongs > 0 && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
              {stats.pendingSongs} pending
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "approvals" && stats && stats.pendingSongs > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.id ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground"
                }`}>
                  {stats.pendingSongs}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "analytics" && <AdminAnalytics />}
        {activeTab === "settings" && <AdminSiteSettings />}
        {activeTab === "monetization" && <AdminMonetization />}
        {activeTab === "ads" && <AdminAds />}
        {activeTab === "songs" && <AdminSongManagement />}
        {activeTab === "artists" && <AdminArtistManagement />}
        {activeTab === "videos" && <AdminVideoManagement />}
        {activeTab === "albums" && <AdminAlbumManagement />}
        {activeTab === "genres" && <AdminGenreManagement />}
        {activeTab === "articles" && <AdminArticles />}
        {activeTab === "approvals" && <AdminApprovalQueue />}
        {activeTab === "users" && <AdminUserManagement />}
        {activeTab === "moderation" && <AdminModeration />}
        {activeTab === "reports" && <AdminReports />}
        {activeTab === "featured" && <AdminFeaturedContent />}
        {activeTab === "emails" && <AdminEmailLogs />}
      </div>
    </Layout>
  );
};

export default AdminPage;
