import { Calendar, ArrowRight } from "lucide-react";

interface NewsCardProps {
  title: string;
  excerpt: string;
  date: string;
  category: string;
}

const NewsCard = ({ title, excerpt, date, category }: NewsCardProps) => {
  return (
    <article className="group rounded-lg bg-card border border-border p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/30">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary">
          {category}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {date}
        </span>
      </div>
      <h3 className="font-heading font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{excerpt}</p>
      <button className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all">
        Read More <ArrowRight className="h-4 w-4" />
      </button>
    </article>
  );
};

export default NewsCard;
