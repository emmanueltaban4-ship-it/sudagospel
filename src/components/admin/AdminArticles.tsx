import { useState } from "react";
import { useAllArticles, useCreateArticle, useUpdateArticle, useDeleteArticle, Article } from "@/hooks/use-articles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const CATEGORIES = ["News", "Events", "Music", "Inspiration", "Announcements"];

const AdminArticles = () => {
  const { data: articles, isLoading } = useAllArticles();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();

  const [editing, setEditing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    cover_url: "",
    category: "News",
    is_published: false,
  });

  const resetForm = () => {
    setForm({ title: "", slug: "", content: "", excerpt: "", cover_url: "", category: "News", is_published: false });
    setEditing(null);
    setCreating(false);
  };

  const startEdit = (article: Article) => {
    setEditing(article);
    setCreating(false);
    setForm({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || "",
      cover_url: article.cover_url || "",
      category: article.category || "News",
      is_published: article.is_published,
    });
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const slug = form.slug.trim() || slugify(form.title);

    if (editing) {
      updateArticle.mutate({ id: editing.id, ...form, slug }, { onSuccess: resetForm });
    } else {
      createArticle.mutate({ ...form, slug }, { onSuccess: resetForm });
    }
  };

  // Show editor form
  if (creating || editing) {
    return (
      <div>
        <button onClick={resetForm} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to articles
        </button>
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">
          {editing ? "Edit Article" : "New Article"}
        </h2>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })}
              placeholder="Article title"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Slug (URL)</label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="article-url-slug"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    form.category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Cover Image URL</label>
            <Input
              value={form.cover_url}
              onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
              placeholder="https://..."
            />
            {form.cover_url && (
              <img src={form.cover_url} alt="Cover preview" className="mt-2 h-32 w-full object-cover rounded-lg" />
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Excerpt</label>
            <Textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Short summary shown in cards..."
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Content</label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Full article content..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-foreground">Publish immediately</span>
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={createArticle.isPending || updateArticle.isPending}>
              {editing ? "Save Changes" : "Create Article"}
            </Button>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  // Articles list
  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading articles...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Articles ({articles?.length || 0})
        </h2>
        <Button size="sm" className="gap-1 rounded-full" onClick={() => { resetForm(); setCreating(true); }}>
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      {!articles || articles.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-heading font-bold text-foreground mb-1">No articles yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first blog post to get started.</p>
          <Button size="sm" className="gap-1 rounded-full" onClick={() => { resetForm(); setCreating(true); }}>
            <Plus className="h-4 w-4" /> Create Article
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map((article) => (
            <div
              key={article.id}
              className="rounded-xl bg-card border border-border p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground truncate">{article.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      article.is_published
                        ? "bg-green-500/10 text-green-600"
                        : "bg-yellow-500/10 text-yellow-600"
                    }`}>
                      {article.is_published ? "Published" : "Draft"}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {article.category}
                    </span>
                  </div>
                  {article.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{article.excerpt}</p>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => {
                      updateArticle.mutate({
                        id: article.id,
                        is_published: !article.is_published,
                        published_at: !article.is_published ? new Date().toISOString() : article.published_at,
                      });
                    }}
                    title={article.is_published ? "Unpublish" : "Publish"}
                  >
                    {article.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => startEdit(article)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Delete this article?")) deleteArticle.mutate(article.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminArticles;
