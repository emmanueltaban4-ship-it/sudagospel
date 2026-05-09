import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, ChevronRight } from "lucide-react";
import { useTodayDevotional } from "@/hooks/use-gospel";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

const DailyDevotionalCard = () => {
  const { data: dev, isLoading } = useTodayDevotional();
  const [open, setOpen] = useState(false);

  if (isLoading || !dev) return null;

  return (
    <>
      <Card
        className="p-4 md:p-5 mb-4 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10 cursor-pointer hover:border-primary/40 transition"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-start gap-3">
          {dev.image_url ? (
            <img src={dev.image_url} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" loading="lazy" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Today's Devotional
            </p>
            <h3 className="font-heading font-bold text-base md:text-lg mt-0.5 truncate">{dev.title}</h3>
            {dev.scripture_ref && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{dev.scripture_ref}</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground self-center" />
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary text-left">
              {format(new Date(dev.publish_date), "EEEE, MMMM d")}
            </p>
            <DialogTitle className="font-heading text-xl md:text-2xl font-extrabold text-left">{dev.title}</DialogTitle>
            {dev.scripture_ref && (
              <p className="text-sm text-primary text-left flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> {dev.scripture_ref}
              </p>
            )}
          </DialogHeader>
          {dev.image_url && (
            <img src={dev.image_url} alt="" className="w-full rounded-xl mb-2" loading="lazy" />
          )}
          {dev.scripture_text && (
            <blockquote className="border-l-2 border-primary pl-3 italic text-sm text-muted-foreground my-3">
              "{dev.scripture_text}"
            </blockquote>
          )}
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{dev.content}</div>
          {dev.author && <p className="text-xs text-muted-foreground mt-4">— {dev.author}</p>}
          <Button onClick={() => setOpen(false)} className="rounded-full mt-4">Amen</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DailyDevotionalCard;
