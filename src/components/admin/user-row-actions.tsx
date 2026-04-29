"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminProvisionVpnAction,
  adminResetPasswordAction,
  adminSetRoleAction,
  adminSuspendVpnAction,
  adminTerminateVpnAction,
  adminUnsuspendVpnAction,
} from "@/lib/admin-actions";
import type { ActionResult } from "@/lib/auth-actions";

interface Props {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
  vpnStatus: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "NONE";
  isSelf: boolean;
}

type SimpleAction = (formData: FormData) => Promise<ActionResult>;

export function UserRowActions({ userId, email, role, vpnStatus, isSelf }: Props) {
  const [pending, startTransition] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPwd, setResetPwd] = useState("");

  function run(action: SimpleAction, label: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("userId", userId);
      const res = await action(fd);
      if (res.ok) {
        toast.success(res.message ?? `${label} done.`);
      } else {
        toast.error(res.error);
      }
    });
  }

  function setRole(newRole: "USER" | "ADMIN") {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("userId", userId);
      fd.set("role", newRole);
      const res = await adminSetRoleAction(fd);
      if (res.ok) toast.success(res.message ?? "Role updated.");
      else toast.error(res.error);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="sm" variant="ghost" aria-label={`Actions for ${email}`} />}
          disabled={pending}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800">
          <DropdownMenuLabel className="text-xs text-slate-400">VPN account</DropdownMenuLabel>
          {vpnStatus === "NONE" && (
            <DropdownMenuItem onClick={() => run(adminProvisionVpnAction, "Provision")}>
              Provision VPN
            </DropdownMenuItem>
          )}
          {vpnStatus === "ACTIVE" && (
            <DropdownMenuItem onClick={() => run(adminSuspendVpnAction, "Suspend")}>
              Suspend
            </DropdownMenuItem>
          )}
          {vpnStatus === "SUSPENDED" && (
            <DropdownMenuItem onClick={() => run(adminUnsuspendVpnAction, "Unsuspend")}>
              Unsuspend
            </DropdownMenuItem>
          )}
          {vpnStatus !== "TERMINATED" && vpnStatus !== "NONE" && (
            <DropdownMenuItem
              className="text-red-300"
              onClick={() => run(adminTerminateVpnAction, "Terminate")}
            >
              Terminate
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-slate-800" />
          <DropdownMenuLabel className="text-xs text-slate-400">Account</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setResetOpen(true)}>Reset password…</DropdownMenuItem>
          {!isSelf &&
            (role === "ADMIN" ? (
              <DropdownMenuItem onClick={() => setRole("USER")}>Demote to user</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setRole("ADMIN")}>Promote to admin</DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle>Reset password for {email}</DialogTitle>
            <DialogDescription>
              The user will be signed out everywhere. Tell them the new password out-of-band.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              value={resetPwd}
              onChange={(e) => setResetPwd(e.target.value)}
              minLength={8}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={resetPwd.length < 8 || pending}
              onClick={() => {
                startTransition(async () => {
                  const fd = new FormData();
                  fd.set("userId", userId);
                  fd.set("password", resetPwd);
                  const res = await adminResetPasswordAction(fd);
                  if (res.ok) {
                    toast.success(res.message ?? "Password reset.");
                    setResetOpen(false);
                    setResetPwd("");
                  } else {
                    toast.error(res.error);
                  }
                });
              }}
            >
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
