import { useParams, Link } from "react-router-dom";
import { useArticleBySlug } from "@/hooks/use-articles";
import Layout from "@/components/Layout";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";

const ArticleDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useArticleBySlug(slug || "");

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="font-heading text-xl font-bold text-foreground mb-2">Article not found</h1>
          <Link to="/news" className="text-sm text-primary hover:underline">Back to News</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container py-6 max-w-3xl mx-auto">
        <Link
          to="/news"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to News
        </Link>

        {article.cover_url && (
          <div className="rounded-2xl overflow-hidden mb-6 aspect-video">
            <img
              src={article.cover_url}
              alt={article.title}
              className="w-full h-full object-cover"
             loading="lazy" decoding="async" />
          </div>
        )}

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {article.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Tag className="h-3 w-3" />
              {article.category}
            </span>
          )}
          {article.published_at && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(article.published_at), "MMM d, yyyy")}
            </span>
          )}
        </div>

        <h1 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground leading-tight mb-4">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            {article.excerpt}
          </p>
        )}

        <div className="prose prose-sm md:prose-base max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
          {article.content}
        </div>
      </article>
    </Layout>
  );
};

export default ArticleDetailPage;
