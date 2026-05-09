import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HandHeart, Sparkles, Send, EyeOff } from "lucide-react";
import { usePrayerRequests, useCreatePrayerRequest, useTogglePrayer, useMyPrayerReactions } from "@/hooks/use-gospel";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const PrayerWallPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = usePrayerRequests();
  const create = useCreatePrayerRequest();
  const toggle = useTogglePrayer();

  const [content, setContent] = useState("");
  const [anon, setAnon] = useState(false);

  const ids = useMemo(() => requests.map((r: any) => r.id), [requests]);
  const { data: myReactions } = useMyPrayerReactions(ids);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-3 md:px-6 py-5 md:py-8 pb-32">
        <header className="mb-6 text-center">
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-primary flex items-center gap-1.5 justify-center">
            <Sparkles className="h-3 w-3" /> Stand together in prayer
          </p>
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold mt-1 leading-tight">Prayer Wall</h1>
          <p className="text-sm text-muted-foreground mt-2">Share what you're carrying. The community will pray with you.</p>
        </header>

        {/* Composer */}
        <Card className="p-4 mb-6">
          {!user ? (
            <div className="text-center py-3">
              <p className="text-sm text-muted-foreground mb-3">Sign in to share a prayer request.</p>
              <Button onClick={() => navigate("/auth")} className="rounded-full">Sign in</Button>
            </div>
          ) : (
            <>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share what you'd like prayer for..."
                rows={3}
                maxLength={1000}
                className="resize-none"
              />
              <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Switch checked={anon} onCheckedChange={setAnon} />
                  <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" /> Post anonymously</span>
                </label>
                <Button
                  size="sm"
                  className="rounded-full gap-1.5"
                  disabled={!content.trim() || create.isPending}
                  onClick={() => create.mutate({ content, isAnonymous: anon }, { onSuccess: () => setContent("") })}
                >
                  <Send className="h-3.5 w-3.5" /> Share
                </Button>
              </div>
            </>
          )}
        </Card>

        {isLoading && (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted/30 rounded-2xl animate-pulse" />)}</div>
        )}

        <div className="space-y-3">
          {requests.map((r: any) => {
            const prayed = myReactions?.has(r.id) ?? false;
            const name = r.is_anonymous ? "Anonymous" : (r.profiles?.display_name || "Someone");
            const avatar = !r.is_anonymous ? r.profiles?.avatar_url : null;
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    {avatar && <AvatarImage src={avatar} alt={name} />}
                    <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{name}</p>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm mt-1.5 whitespace-pre-wrap">{r.content}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <Button
                        size="sm"
                        variant={prayed ? "default" : "outline"}
                        className="rounded-full gap-1.5 h-8 text-xs"
                        onClick={() => user ? toggle.mutate({ requestId: r.id, has: prayed }) : navigate("/auth")}
                      >
                        <HandHeart className={`h-3.5 w-3.5 ${prayed ? "fill-current" : ""}`} />
                        {prayed ? "I prayed" : "Pray"}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {r.prayer_count} {r.prayer_count === 1 ? "prayer" : "prayers"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {!isLoading && requests.length === 0 && (
            <Card className="p-10 text-center">
              <HandHeart className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="font-heading text-lg font-bold">Be the first to share</p>
              <p className="text-xs text-muted-foreground mt-1">Your request can encourage someone else.</p>
            </Card>
          )}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default PrayerWallPage;
