import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Shield, ShieldCheck, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type UserRole = Tables<"user_roles">;

interface UserWithRole extends Profile {
  roles: string[];
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleDialog, setRoleDialog] = useState<UserWithRole | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    const rolesMap = new Map<string, string[]>();
    (rolesRes.data ?? []).forEach((r: UserRole) => {
      const existing = rolesMap.get(r.user_id) || [];
      existing.push(r.role);
      rolesMap.set(r.user_id, existing);
    });

    const usersWithRoles: UserWithRole[] = (profilesRes.data ?? []).map((p) => ({
      ...p,
      roles: rolesMap.get(p.user_id) || ["user"],
    }));
    setUsers(usersWithRoles);
    setLoading(false);
  };

  const filtered = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(s) ||
      u.user_id.toLowerCase().includes(s) ||
      (u.phone || "").includes(s)
    );
  });

  const toggleRole = async (userId: string, role: "admin" | "moderator", hasRole: boolean) => {
    setSaving(true);
    if (hasRole) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(`Removed ${role} role.`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(`Added ${role} role.`);
    }
    setSaving(false);
    setRoleDialog(null);
    fetchUsers();
  };

  return (
    <AdminLayout title="Users" description={`${users.length} registered users`}>
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">User ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Target Exam</th>
                  <th className="px-4 py-3 text-left font-semibold">Roles</th>
                  <th className="px-4 py-3 text-left font-semibold">Joined</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.user_id.slice(0, 12)}…</td>
                      <td className="px-4 py-3">{u.phone || "—"}</td>
                      <td className="px-4 py-3">
                        {u.target_exam ? (
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{u.target_exam.toUpperCase()}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {u.roles.map((r) => (
                            <span
                              key={r}
                              className={`rounded px-2 py-0.5 text-xs font-medium ${
                                r === "admin"
                                  ? "bg-destructive/10 text-destructive"
                                  : r === "moderator"
                                  ? "bg-accent/10 text-accent-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setRoleDialog(u)}
                          className="rounded p-1.5 hover:bg-muted"
                          title="Manage roles"
                        >
                          <UserCog className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border p-3 text-center text-xs text-muted-foreground">
            Showing {filtered.length} of {users.length} users
          </div>
        </div>
      )}

      {/* Role Management Dialog */}
      <Dialog open={!!roleDialog} onOpenChange={(open) => !open && setRoleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Roles — {roleDialog?.full_name || "User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(["admin", "moderator"] as const).map((role) => {
              const hasRole = roleDialog?.roles.includes(role) ?? false;
              return (
                <div key={role} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    {role === "admin" ? <ShieldCheck className="h-4 w-4 text-destructive" /> : <Shield className="h-4 w-4 text-accent" />}
                    <span className="font-medium capitalize">{role}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={hasRole ? "destructive" : "outline"}
                    disabled={saving}
                    onClick={() => roleDialog && toggleRole(roleDialog.user_id, role, hasRole)}
                  >
                    {hasRole ? "Remove" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
