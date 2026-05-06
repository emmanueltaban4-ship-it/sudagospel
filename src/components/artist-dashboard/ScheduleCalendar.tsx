import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Music, Calendar as CalIcon } from "lucide-react";
import { Link } from "react-router-dom";

const ScheduleCalendar = ({ artistId }: { artistId: string }) => {
  const [month, setMonth] = useState(new Date());

  const { data: songs = [] } = useQuery({
    queryKey: ["scheduled-calendar", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, cover_url, scheduled_release_at, release_status")
        .eq("artist_id", artistId)
        .eq("release_status", "scheduled")
        .order("scheduled_release_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const all = eachDayOfInterval({ start, end });
    const padding = getDay(start);
    return { all, padding };
  }, [month]);

  const songsByDay = useMemo(() => {
    const m = new Map<string, any[]>();
    songs.forEach((s) => {
      if (!s.scheduled_release_at) return;
      const key = format(new Date(s.scheduled_release_at), "yyyy-MM-dd");
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(s);
    });
    return m;
  }, [songs]);

  const upcoming = songs.filter((s) => s.scheduled_release_at && new Date(s.scheduled_release_at) > new Date());

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading text-lg font-bold flex items-center gap-2">
            <CalIcon className="h-4 w-4 text-primary" /> Release calendar
          </h3>
          <p className="text-xs text-muted-foreground">Scheduled drops</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-bold w-28 text-center">{format(month, "MMM yyyy")}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-muted-foreground mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: days.padding }).map((_, i) => <div key={"p" + i} />)}
        {days.all.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const has = songsByDay.has(key);
          const isToday = isSameDay(d, new Date());
          return (
            <div
              key={key}
              className={`aspect-square rounded-lg border text-xs flex flex-col items-center justify-center relative ${
                has ? "border-primary/60 bg-primary/10 font-bold" : "border-border/40"
              } ${isToday ? "ring-1 ring-primary" : ""}`}
            >
              <span className={has ? "text-primary" : "text-muted-foreground"}>{format(d, "d")}</span>
              {has && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>

      {upcoming.length > 0 && (
        <div className="mt-5 pt-4 border-t space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Upcoming</p>
          {upcoming.map((s) => (
            <Link key={s.id} to={`/song/${s.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition">
              <div className="h-9 w-9 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {s.cover_url ? <img src={s.cover_url} className="h-full w-full object-cover" / loading="lazy" decoding="async"> :
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Music className="h-3.5 w-3.5 text-primary" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{s.title}</p>
                <p className="text-[11px] text-muted-foreground">{format(new Date(s.scheduled_release_at!), "MMM d, yyyy 'at' p")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ScheduleCalendar;
