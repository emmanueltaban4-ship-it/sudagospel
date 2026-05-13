import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { usePublishedArticles } from "@/hooks/use-articles";
import { Calendar, ArrowRight, Tag, Newspaper } from "lucide-react";
import { format } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 9;

const NewsPage = () => {
  const { data: articles, isLoading } = usePublishedArticles();
  const [category, setCategory] = useState<string>("All");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (articles ?? []).forEach((a) => a.category && set.add(a.category));
    return ["All", ...Array.from(set).sort()];
  }, [articles]);

  const filtered = useMemo(() => {
    if (!articles) return [];
    return category === "All" ? articles : articles.filter((a) => a.category === category);
  }, [articles, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const onCategory = (c: string) => {
    setCategory(c);
    setPage(1);
  };

  return (
    <Layout>
      <div className="container py-6">
        <header className="mb-5">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-1">
            📰 Gospel News & Blog
          </h1>
          <p className="text-sm text-muted-foreground">
            Latest stories, releases, and updates from the Suda Gospel gospel community.
          </p>
        </header>

        {/* Category chips */}
        {categories.length > 1 && (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {categories.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  onClick={() => onCategory(c)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="font-heading text-lg font-bold text-foreground mb-1">No articles yet</h2>
            <p className="text-sm text-muted-foreground">
              {category === "All"
                ? "Stay tuned for the latest gospel news and updates."
                : `No articles in "${category}" yet.`}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paged.map((article) => (
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
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
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

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.max(1, p - 1));
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const n = i + 1;
                      return (
                        <PaginationItem key={n}>
                          <PaginationLink
                            href="#"
                            isActive={n === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(n);
                            }}
                          >
                            {n}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.min(totalPages, p + 1));
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default NewsPage;
