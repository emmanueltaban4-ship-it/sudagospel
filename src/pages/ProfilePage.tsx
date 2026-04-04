import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Music, Heart, Download, Settings } from "lucide-react";

const ProfilePage = () => {
  return (
    <Layout>
      <div className="container py-6 max-w-lg mx-auto">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
          Your Profile
        </h1>

        {/* Not logged in state */}
        <div className="rounded-2xl bg-card border border-border p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <LogIn className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-heading font-bold text-lg text-foreground mb-2">
            Welcome to Sudagospel
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to save your favorite songs, follow artists, and download music for offline listening.
          </p>
          <div className="flex flex-col gap-3">
            <Button className="gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <LogIn className="h-4 w-4" /> Sign In
            </Button>
            <Button variant="outline" className="gap-2 rounded-full border-border text-foreground hover:bg-muted">
              <UserPlus className="h-4 w-4" /> Create Account
            </Button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 space-y-2">
          {[
            { icon: Music, label: "My Uploads", count: "0 songs" },
            { icon: Heart, label: "Liked Songs", count: "0 songs" },
            { icon: Download, label: "Downloads", count: "0 songs" },
            { icon: Settings, label: "Settings", count: "" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted transition-colors"
            >
              <item.icon className="h-5 w-5 text-primary" />
              <span className="flex-1 text-left text-sm font-medium text-foreground">
                {item.label}
              </span>
              {item.count && (
                <span className="text-xs text-muted-foreground">{item.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
