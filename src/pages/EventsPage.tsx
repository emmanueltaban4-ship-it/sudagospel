import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { useUpcomingEvents } from "@/hooks/use-gospel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket, Sparkles, ExternalLink } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";

const dateLabel = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return `Today · ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, "h:mm a")}`;
  return format(d, "EEE, MMM d · h:mm a");
};

const EventsPage = () => {
  const { data: events = [], isLoading } = useUpcomingEvents();

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-3 md:px-6 py-5 md:py-8 pb-32">
        <header className="mb-6">
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-primary flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Gather & worship
          </p>
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold mt-1 leading-tight">Events & Concerts</h1>
          <p className="text-sm text-muted-foreground mt-2">Upcoming gospel concerts, services and crusades.</p>
        </header>

        {isLoading && (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted/30 rounded-2xl animate-pulse" />)}</div>
        )}

        {!isLoading && events.length === 0 && (
          <Card className="p-10 text-center">
            <Calendar className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="font-heading text-lg font-bold">No upcoming events</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon — artists post new dates regularly.</p>
          </Card>
        )}

        <div className="space-y-3">
          {events.map((e: any) => (
            <Card key={e.id} className="overflow-hidden md:flex hover:border-primary/40 transition">
              {e.cover_url && (
                <img src={e.cover_url} alt={e.title} className="md:w-56 aspect-video md:aspect-auto object-cover" loading="lazy" />
              )}
              <div className="p-4 md:p-5 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="font-heading text-lg md:text-xl font-bold">{e.title}</h3>
                    {e.artists?.name && <p className="text-sm text-muted-foreground mt-0.5">with {e.artists.name}</p>}
                  </div>
                  <Badge className="rounded-full whitespace-nowrap">{dateLabel(e.starts_at)}</Badge>
                </div>
                {(e.location || e.city) && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {[e.location, e.city, e.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {e.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{e.description}</p>}
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  {e.ticket_url && (
                    <Button asChild size="sm" className="rounded-full gap-1.5">
                      <a href={e.ticket_url} target="_blank" rel="noreferrer">
                        <Ticket className="h-3.5 w-3.5" /> Get tickets <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  {e.price_text && <span className="text-xs text-muted-foreground">{e.price_text}</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default EventsPage;
