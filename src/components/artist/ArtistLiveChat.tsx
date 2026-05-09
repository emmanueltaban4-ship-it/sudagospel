import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Props { artistId: string; isOwner?: boolean; }

interface ChatMsg {
  id: string;
  artist_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_hidden: boolean;
  profile?: { display_name?: string | null; avatar_url?: string | null };
}

const ArtistLiveChat = ({ artistId, isOwner }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("artist_chat_messages")
        .select("*")
        .eq("artist_id", artistId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!mounted) return;
      const msgs = (data ?? []).reverse();
      // Hydrate profiles
      const ids = [...new Set(msgs.map((m: any) => m.user_id))];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
        msgs.forEach((m: any) => { m.profile = map.get(m.user_id); });
      }
      setMessages(msgs as ChatMsg[]);
      setLoading(false);
    })();

    const channel = supabase.channel(`artist-chat-${artistId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "artist_chat_messages", filter: `artist_id=eq.${artistId}` }, async (payload) => {
        const m = payload.new as any;
        const { data: p } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", m.user_id).maybeSingle();
        m.profile = p;
        setMessages((prev) => [...prev, m]);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "artist_chat_messages", filter: `artist_id=eq.${artistId}` }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [artistId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!user) { navigate("/auth"); return; }
    const text = input.trim();
    if (!text || text.length > 500) return;
    setSending(true);
    const { error } = await supabase.from("artist_chat_messages").insert({ artist_id: artistId, user_id: user.id, content: text });
    setSending(false);
    if (error) toast.error(error.message);
    else setInput("");
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("artist_chat_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-[500px]">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="font-heading font-bold text-sm">Live Chat</h3>
        <span className="ml-auto text-xs text-muted-foreground">{messages.length} messages</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /> : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Be the first to say something 👋</p>
        ) : messages.map((m) => (
          <div key={m.id} className="flex items-start gap-2 group">
            {m.profile?.avatar_url ? (
              <img src={m.profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-xs font-semibold truncate">{m.profile?.display_name || "User"}</p>
                <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</p>
              </div>
              <p className="text-sm text-foreground/90 break-words">{m.content}</p>
            </div>
            {(isOwner || user?.id === m.user_id) && (
              <button onClick={() => del(m.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border flex items-center gap-2">
        <Input
          placeholder={user ? "Say something..." : "Sign in to chat"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          maxLength={500}
          disabled={!user || sending}
        />
        <Button size="icon" onClick={send} disabled={!input.trim() || sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default ArtistLiveChat;
