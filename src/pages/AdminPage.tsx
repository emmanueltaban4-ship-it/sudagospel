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
import { Shield, CheckSquare, Users, MessageCircle, BarChart3, ArrowLeft, FileText, Settings2, Music, Mic2, Megaphone, DollarSign, Tag, Disc3, Flag, Star, Mail, Video, BadgeCheck, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

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

        <div className="flex gap-6">
          {/* Vertical sidebar menu */}
          <nav className="hidden md:flex flex-col gap-1 w-52 flex-shrink-0 sticky top-20 self-start">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                {tab.label}
                {tab.id === "approvals" && stats && stats.pendingSongs > 0 && (
                  <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.id ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground"
                  }`}>
                    {stats.pendingSongs}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Mobile drawer menu */}
          <div className="md:hidden w-full mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 w-full rounded-xl bg-muted px-4 py-3 text-sm font-medium text-foreground">
                  <Menu className="h-4 w-4" />
                  {tabs.find(t => t.id === activeTab)?.label || "Menu"}
                  {(() => { const Icon = tabs.find(t => t.id === activeTab)?.icon; return Icon ? <Icon className="h-4 w-4 ml-auto text-primary" /> : null; })()}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetTitle className="px-4 pt-5 pb-2 text-lg font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Admin
                </SheetTitle>
                <nav className="flex flex-col gap-0.5 px-2 pb-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                  {tabs.map((tab) => (
                    <SheetTrigger key={tab.id} asChild>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-3 text-sm font-medium transition-colors text-left ${
                          activeTab === tab.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <tab.icon className="h-4 w-4 flex-shrink-0" />
                        {tab.label}
                        {tab.id === "approvals" && stats && stats.pendingSongs > 0 && (
                          <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            activeTab === tab.id ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground"
                          }`}>
                            {stats.pendingSongs}
                          </span>
                        )}
                      </button>
                    </SheetTrigger>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-w-0">
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
            {activeTab === "verification" && <AdminVerificationRequests />}
            {activeTab === "emails" && <AdminEmailLogs />}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPage;
