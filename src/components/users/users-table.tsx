"use client";

import * as React from "react";
import { toast } from "sonner";
import { MailIcon, PlusIcon, ShieldCheckIcon } from "lucide-react";

import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listPlatformUsersAction,
  updatePlatformUserRoleAction,
} from "@/lib/data/user-actions";
import { formatDateTime } from "@/lib/format";
import {
  APP_ROLE_LABELS,
  APP_ROLES,
  type AppRole,
  type PlatformUser,
} from "@/lib/types";

export function UsersTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: PlatformUser[];
  currentUserId: string;
}) {
  const [users, setUsers] = React.useState(initialUsers);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    const result = await listPlatformUsersAction();
    if (result.ok) setUsers(result.data);
  }, []);

  const changeRole = async (userId: string, role: AppRole) => {
    setUpdatingId(userId);
    const result = await updatePlatformUserRoleAction({ userId, role });
    setUpdatingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`Role updated to ${APP_ROLE_LABELS[role]}`);
    await reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          onClick={() => setDialogOpen(true)}
        >
          <PlusIcon />
          Add admin
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={ShieldCheckIcon}
          title="No platform users yet"
          description="Add an admin account and share the login details manually."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Email</TableHead>
                <TableHead className="w-40">Role</TableHead>
                <TableHead className="w-44">Invited</TableHead>
                <TableHead className="w-44">Last sign-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const isLastSuperAdmin =
                  user.role === "super_admin" &&
                  users.filter((entry) => entry.role === "super_admin").length <= 1;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                          <MailIcon className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.email}</p>
                          {isSelf ? (
                            <p className="text-xs text-muted-foreground">You</p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isSelf ? (
                        <Badge variant="outline">
                          {APP_ROLE_LABELS[user.role]}
                        </Badge>
                      ) : (
                        <Select
                          value={user.role}
                          disabled={updatingId === user.id}
                          onValueChange={(value) =>
                            changeRole(user.id, value as AppRole)
                          }
                        >
                          <SelectTrigger aria-label={`Role for ${user.email}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {APP_ROLES.map((role) => (
                              <SelectItem
                                key={role}
                                value={role}
                                disabled={
                                  isLastSuperAdmin &&
                                  role === "admin" &&
                                  user.role === "super_admin"
                                }
                              >
                                {APP_ROLE_LABELS[role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.invitedAt ? formatDateTime(user.invitedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastSignInAt
                        ? formatDateTime(user.lastSignInAt)
                        : "Never"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={reload}
      />
    </div>
  );
}
