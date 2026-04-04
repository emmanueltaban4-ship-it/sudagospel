import { useAllUsers } from "@/hooks/use-admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, ShieldOff, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

const AdminUserManagement = () => {
  const { data: users, isLoading } = useAllUsers();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" as any });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin" as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, { makeAdmin }) => {
      toast.success(makeAdmin ? "Admin role granted" : "Admin role revoked");
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading users...</div>;
  }

  const filtered = users?.filter((u) =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-foreground mb-4">
        Users ({users?.length || 0})
      </h2>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-input bg-card pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        {filtered?.map((user) => {
          const roles = (user as any).roles || [];
          const isAdmin = roles.some((r: any) => r.role === "admin");

          return (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-xl bg-card border border-border p-3 hover:shadow-sm transition-shadow"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-brand flex-shrink-0 flex items-center justify-center text-sm font-bold text-primary-foreground">
                {user.display_name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground truncate">
                    {user.display_name || "Unnamed"}
                  </span>
                  {isAdmin && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className={`gap-1 text-xs rounded-full ${
                  isAdmin ? "text-destructive border-destructive/30" : "text-primary border-primary/30"
                }`}
                onClick={() => toggleAdmin.mutate({ userId: user.user_id, makeAdmin: !isAdmin })}
                disabled={toggleAdmin.isPending}
              >
                {isAdmin ? (
                  <>
                    <ShieldOff className="h-3 w-3" /> Remove
                  </>
                ) : (
                  <>
                    <Shield className="h-3 w-3" /> Make Admin
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminUserManagement;
