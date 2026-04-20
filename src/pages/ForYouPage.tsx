import Layout from "@/components/Layout";
import { useForYouFeed, useDailyMix } from "@/hooks/use-discovery";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles, Repeat2, Music2, Play } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/use-document-meta";

const ForYouPage = () => {
  useDocumentMeta({
    title: "For You — SudaGospel",
    description: "Personalized gospel music picks based on what you love.",
  });
  const { user } = useAuth();
  const { data: feed = [], isLoading } = useForYouFeed();
  const { data: mix = [] } = useDailyMix();
  const { play } = usePlayer();

  if (!user) {
    return (
      <Layout>
        <div className="px-6 pt-20 pb-32 text-center max-w-md mx-auto">
          <Sparkles className="h-14 w-14 mx-auto text-primary mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Your feed awaits</h1>
          <p className="text-muted-foreground mb-6">Sign in to see personalized picks, new releases from artists you follow, and Daily Mix.</p>
          <Link to="/auth"><Button size="lg" className="w-full">Sign in</Button></Link>
        </div>
      </Layout>
    );
  }

  const mixQueue = (mix as any[]).map((s) => ({ id: s.song_id, title: s.title, artist: s.artist_name, fileUrl: s.file_url, coverUrl: s.cover_url }));

  return (
    <Layout>
      <div className="px-4 pt-6 pb-32 max-w-3xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="font-heading text-3xl font-bold">For You</h1>
          </div>
          <p className="text-sm text-muted-foreground">Built from artists you follow and what you've been playing.</p>
        </div>

        {/* Daily Mix */}
        {mix.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                <Music2 className="h-5 w-5 text-secondary" /> Your Daily Mix
              </h2>
              {mixQueue.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => play(mixQueue[0], mixQueue)}
                  className="rounded-full"
                >
                  <Play className="h-4 w-4 mr-1 fill-current" /> Play
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(mix as any[]).slice(0, 6).map((s) => (
                <button
                  key={s.song_id}
                  onClick={() => play({ id: s.song_id, title: s.title, artist: s.artist_name, fileUrl: s.file_url, coverUrl: s.cover_url }, mixQueue)}
                  className="group text-left"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
                    {s.cover_url && <img src={s.cover_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />}
                  </div>
                  <p className="text-sm font-semibold mt-2 truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.artist_name}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Feed */}
        <section>
          <h2 className="font-heading text-xl font-bold mb-3">From your follows</h2>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : feed.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Follow artists to see their new releases and reposts here.</p>
              <Link to="/artists" className="inline-block mt-3"><Button variant="outline" size="sm">Browse artists</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(feed as any[]).map((item, i) => (
                <div key={`${item.song_id}-${i}`} className="bg-card rounded-xl p-3 border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    {item.feed_type === "repost" ? (
                      <><Repeat2 className="h-3.5 w-3.5 text-secondary" /> <span className="font-medium text-foreground">{item.actor_name}</span> reposted</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5 text-primary" /> New release</>
                    )}
                    <span className="ml-auto">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                  </div>
                  <button
                    onClick={() => play({ id: item.song_id, title: item.title, artist: item.artist_name, fileUrl: item.file_url, coverUrl: item.cover_url })}
                    className="flex gap-3 items-center w-full text-left group"
                  >
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted relative flex-shrink-0">
                      {item.cover_url && <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-5 w-5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.artist_name}</p>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default ForYouPage;
