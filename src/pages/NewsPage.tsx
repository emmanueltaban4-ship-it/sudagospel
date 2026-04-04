import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { usePublishedArticles } from "@/hooks/use-articles";
import { Calendar, ArrowRight, Tag, Newspaper } from "lucide-react";
import { format } from "date-fns";

const NewsPage = () => {
  const { data: articles, isLoading } = usePublishedArticles();

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-6">
          📰 Gospel News & Blog
        </h1>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="py-16 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="font-heading text-lg font-bold text-foreground mb-1">No articles yet</h2>
            <p className="text-sm text-muted-foreground">Stay tuned for the latest gospel news and updates.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/news/${article.slug}`}
                className="group rounded-xl bg-card border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/30"
              >
                {article.cover_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.cover_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {article.category && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        <Tag className="h-3 w-3" />
                        {article.category}
                      </span>
                    )}
                    {article.published_at && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(article.published_at), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.excerpt}</p>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                    Read More <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NewsPage;
