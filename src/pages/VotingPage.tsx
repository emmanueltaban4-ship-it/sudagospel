import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Vote, Trophy, Clock, CheckCircle2, User } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const VotingPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useDocumentMeta({
    title: "Vote — Sudagospel",
    description: "Vote for your favorite gospel artists in our community polls.",
  });

  const { data: polls, isLoading } = useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allOptions } = useQuery({
    queryKey: ["poll-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poll_options")
        .select("*, artists(name, avatar_url)");
      if (error) throw error;
      return data;
    },
    enabled: !!polls?.length,
  });

  const { data: myVotes } = useQuery({
    queryKey: ["my-votes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poll_votes")
        .select("poll_id, option_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      const { error } = await supabase.from("poll_votes").insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vote cast successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-votes"] });
      queryClient.invalidateQueries({ queryKey: ["poll-options"] });
    },
    onError: (err: any) => {
      if (err.message?.includes("unique")) {
        toast.error("You've already voted in this poll.");
      } else {
        toast.error(err.message);
      }
    },
  });

  const getVotedOptionId = (pollId: string) =>
    myVotes?.find((v: any) => v.poll_id === pollId)?.option_id;

  const isExpired = (poll: any) =>
    poll.ends_at && new Date(poll.ends_at) < new Date();

  return (
    <Layout>
      <div className="container py-6 pb-28 max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Vote className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Community Polls</h1>
        </div>

        {isLoading && (
          <div className="py-16 text-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!isLoading && (!polls || polls.length === 0) && (
          <div className="py-16 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No active polls right now. Check back later!</p>
          </div>
        )}

        <div className="space-y-6">
          {polls?.map((poll: any) => {
            const options = allOptions?.filter((o: any) => o.poll_id === poll.id) || [];
            const totalVotes = options.reduce((s: number, o: any) => s + (o.vote_count || 0), 0);
            const votedId = getVotedOptionId(poll.id);
            const expired = isExpired(poll);

            return (
              <div key={poll.id} className="rounded-2xl bg-card border border-border p-5 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-heading text-lg font-bold text-foreground">{poll.title}</h2>
                    {expired ? (
                      <Badge variant="secondary" className="text-[10px]">Ended</Badge>
                    ) : poll.ends_at ? (
                      <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ends {formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}
                      </Badge>
                    ) : null}
                  </div>
                  {poll.description && (
                    <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  {options.map((opt: any) => {
                    const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
                    const isVoted = votedId === opt.id;
                    const showResults = !!votedId || expired;

                    return (
                      <button
                        key={opt.id}
                        disabled={!!votedId || expired || !user || voteMutation.isPending}
                        onClick={() => voteMutation.mutate({ pollId: poll.id, optionId: opt.id })}
                        className={`relative w-full rounded-xl border p-3 text-left transition-all overflow-hidden ${
                          isVoted
                            ? "border-primary bg-primary/5"
                            : votedId || expired
                            ? "border-border/50 bg-muted/30"
                            : "border-border hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]"
                        }`}
                      >
                        {showResults && (
                          <div
                            className="absolute inset-y-0 left-0 bg-primary/10 rounded-xl transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        )}
                        <div className="relative flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {opt.artists?.avatar_url ? (
                              <img src={opt.artists.avatar_url} alt="" className="h-full w-full object-cover" / loading="lazy" decoding="async">
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                              {opt.label}
                              {isVoted && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                            </p>
                            {opt.artists?.name && opt.artists.name !== opt.label && (
                              <p className="text-[11px] text-muted-foreground">{opt.artists.name}</p>
                            )}
                          </div>
                          {showResults && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-foreground">{pct}%</p>
                              <p className="text-[10px] text-muted-foreground">{opt.vote_count} votes</p>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
                  {!user && " · Sign in to vote"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default VotingPage;
