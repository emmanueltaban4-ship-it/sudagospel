import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Edit2, Trash2, BadgeCheck, BadgeX, Mic2, Save, ArrowLeft, UserPlus, Mail, Lock, Eye, EyeOff, Copy, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const useAllArtists = () => {
  return useQuery({
    queryKey: ["admin-all-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

const AdminArtistManagement = () => {
  const { data: artists, isLoading } = useAllArtists();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", bio: "", genre: "", youtube_channel_url: "" });

  // Account creation state
  const [accountDialog, setAccountDialog] = useState<any>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{ email: string; password: string; artist_name: string } | null>(null);

  // Bulk account creation
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ total: number; done: number; current: string; results: Array<{ name: string; email: string; password: string; success: boolean; error?: string }> } | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-all-artists"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["artists"] });
  };

  const updateArtist = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; bio?: string; genre?: string; is_verified?: boolean; youtube_channel_url?: string | null }) => {
      const { error } = await supabase.from("artists").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Artist updated");
      setEditing(null);
      invalidateAll();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteArtist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("artists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Artist deleted");
      invalidateAll();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createAccount = useMutation({
    mutationFn: async ({ email, password, artist_id }: { email: string; password: string; artist_id: string }) => {
      const { data, error } = await supabase.functions.invoke("create-artist-account", {
        body: { email, password, artist_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Account created for ${data.artist_name}`);
      setCreatedAccount({ email: accountEmail, password: accountPassword, artist_name: data.artist_name });
      setAccountEmail("");
      setAccountPassword("");
      invalidateAll();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
    let pw = "";
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setAccountPassword(pw);
  };

  const generateEmail = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
    return `${slug}@sudagospel.com`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleBulkCreate = async () => {
    const unlinked = artists?.filter(a => !a.user_id) || [];
    if (unlinked.length === 0) {
      toast.info("All artists already have accounts");
      return;
    }

    setBulkProgress({ total: unlinked.length, done: 0, current: "", results: [] });

    for (let i = 0; i < unlinked.length; i++) {
      const artist = unlinked[i];
      const email = generateEmail(artist.name);
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
      let pw = "";
      for (let j = 0; j < 12; j++) pw += chars[Math.floor(Math.random() * chars.length)];

      setBulkProgress(prev => prev ? { ...prev, done: i, current: artist.name } : null);

      try {
        const { data, error } = await supabase.functions.invoke("create-artist-account", {
          body: { email, password: pw, artist_id: artist.id },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setBulkProgress(prev => prev ? {
          ...prev,
          done: i + 1,
          results: [...prev.results, { name: artist.name, email, password: pw, success: true }],
        } : null);
      } catch (err: any) {
        setBulkProgress(prev => prev ? {
          ...prev,
          done: i + 1,
          results: [...prev.results, { name: artist.name, email, password: pw, success: false, error: err.message }],
        } : null);
      }
    }

    invalidateAll();
  };

  const exportCredentials = () => {
    if (!bulkProgress?.results) return;
    const successful = bulkProgress.results.filter(r => r.success);
    const csv = "Artist Name,Email,Password\n" + successful.map(r => `"${r.name}","${r.email}","${r.password}"`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "artist_credentials.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const unlinkedCount = artists?.filter(a => !a.user_id).length || 0;

  const filtered = artists?.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to artists
        </button>
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">Edit Artist</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Name</label>
            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Genre</label>
            <Input value={editForm.genre} onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Bio</label>
            <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={4} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">YouTube Channel URL</label>
            <Input value={editForm.youtube_channel_url} onChange={(e) => setEditForm({ ...editForm, youtube_channel_url: e.target.value })} placeholder="@channelname or full URL" />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => updateArtist.mutate({ id: editing.id, name: editForm.name, genre: editForm.genre, bio: editForm.bio, youtube_channel_url: editForm.youtube_channel_url || null })} disabled={updateArtist.isPending}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading artists...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-bold text-foreground">
          All Artists ({artists?.length || 0})
        </h2>
        {unlinkedCount > 0 && (
          <Button
            size="sm"
            onClick={() => setBulkMode(true)}
            className="rounded-full gap-1.5 bg-primary text-primary-foreground"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Create All Accounts ({unlinkedCount})
          </Button>
        )}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search artists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-input bg-card pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        {filtered?.map((artist) => (
          <div key={artist.id} className="rounded-xl bg-card border border-border p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex-shrink-0 overflow-hidden bg-muted">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center"><Mic2 className="h-4 w-4 text-muted-foreground" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{artist.name}</span>
                  {artist.is_verified && (
                    <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                  {artist.user_id ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-500/10 rounded-full px-2 py-0.5">
                      <CheckCircle className="h-3 w-3" /> Account
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                      No account
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {artist.genre || "No genre"} · {artist.bio ? artist.bio.slice(0, 50) + "..." : "No bio"}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!artist.user_id && (
                  <Button
                    size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full"
                    title="Create account"
                    onClick={() => {
                      setAccountDialog(artist);
                      setAccountEmail(generateEmail(artist.name));
                      generatePassword();
                      setCreatedAccount(null);
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5 text-primary" />
                  </Button>
                )}
                <Button
                  size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full"
                  title={artist.is_verified ? "Unverify" : "Verify"}
                  onClick={() => updateArtist.mutate({ id: artist.id, is_verified: !artist.is_verified })}
                >
                  {artist.is_verified ? <BadgeX className="h-3.5 w-3.5 text-primary" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full"
                  onClick={() => { setEditing(artist); setEditForm({ name: artist.name, bio: artist.bio || "", genre: artist.genre || "", youtube_channel_url: artist.youtube_channel_url || "" }); }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="h-8 w-8 p-0 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => { if (confirm("Delete this artist? This will also remove all their songs.")) deleteArtist.mutate(artist.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Single Account Creation Dialog */}
      <Dialog open={!!accountDialog} onOpenChange={(open) => { if (!open) { setAccountDialog(null); setCreatedAccount(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Create Account for {accountDialog?.name}
            </DialogTitle>
            <DialogDescription>
              Create a login account so this artist can manage their profile and songs.
            </DialogDescription>
          </DialogHeader>

          {createdAccount ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-foreground">Account Created!</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Email:</span>
                    <div className="flex items-center gap-1">
                      <code className="text-sm bg-muted px-2 py-0.5 rounded">{createdAccount.email}</code>
                      <button onClick={() => copyToClipboard(createdAccount.email)} className="text-muted-foreground hover:text-foreground">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Password:</span>
                    <div className="flex items-center gap-1">
                      <code className="text-sm bg-muted px-2 py-0.5 rounded">{createdAccount.password}</code>
                      <button onClick={() => copyToClipboard(createdAccount.password)} className="text-muted-foreground hover:text-foreground">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={() => { copyToClipboard(`Email: ${createdAccount.email}\nPassword: ${createdAccount.password}`); }} variant="outline" className="w-full gap-2">
                <Copy className="h-4 w-4" /> Copy All Credentials
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} className="pl-10" placeholder="artist@sudagospel.net" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    className="pl-10 pr-20"
                    placeholder="Min 6 characters"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground p-1">
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={generatePassword} className="text-xs text-primary hover:underline px-1">
                      Generate
                    </button>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => createAccount.mutate({ email: accountEmail, password: accountPassword, artist_id: accountDialog.id })}
                disabled={createAccount.isPending || !accountEmail || accountPassword.length < 6}
                className="w-full gap-2 rounded-full bg-primary text-primary-foreground"
              >
                {createAccount.isPending ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Create Account
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Creation Dialog */}
      <Dialog open={bulkMode} onOpenChange={(open) => { if (!open) { setBulkMode(false); setBulkProgress(null); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Bulk Create Artist Accounts
            </DialogTitle>
            <DialogDescription>
              Create accounts for all {unlinkedCount} artists without accounts. Each artist gets an auto-generated email and password.
            </DialogDescription>
          </DialogHeader>

          {!bulkProgress ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-2">
                <p>This will create accounts for <strong className="text-foreground">{unlinkedCount} artists</strong>:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Email format: <code>artist.name@sudagospel.net</code></li>
                  <li>Random 12-character passwords</li>
                  <li>You can download credentials as CSV after</li>
                </ul>
              </div>
              <Button onClick={handleBulkCreate} className="w-full gap-2 rounded-full bg-primary text-primary-foreground">
                <UserPlus className="h-4 w-4" /> Create {unlinkedCount} Accounts
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground font-medium">{bulkProgress.done}/{bulkProgress.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                  />
                </div>
                {bulkProgress.current && bulkProgress.done < bulkProgress.total && (
                  <p className="text-xs text-muted-foreground">Creating account for {bulkProgress.current}...</p>
                )}
              </div>

              {bulkProgress.done === bulkProgress.total && (
                <>
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                    <p className="text-sm font-medium text-foreground">
                      ✅ {bulkProgress.results.filter(r => r.success).length} accounts created,{" "}
                      {bulkProgress.results.filter(r => !r.success).length} failed
                    </p>
                  </div>
                  <Button onClick={exportCredentials} variant="outline" className="w-full gap-2">
                    <Copy className="h-4 w-4" /> Download Credentials CSV
                  </Button>
                </>
              )}

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {bulkProgress.results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded ${r.success ? "bg-green-500/5" : "bg-destructive/5"}`}>
                    {r.success ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <span className="text-destructive flex-shrink-0">✗</span>
                    )}
                    <span className="font-medium text-foreground truncate">{r.name}</span>
                    {r.success ? (
                      <span className="text-muted-foreground ml-auto flex-shrink-0">{r.email}</span>
                    ) : (
                      <span className="text-destructive ml-auto flex-shrink-0 truncate">{r.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminArtistManagement;
