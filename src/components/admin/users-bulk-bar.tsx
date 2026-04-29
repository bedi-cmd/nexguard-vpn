"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminBulkVpnAction } from "@/lib/admin-actions";

export function UsersBulkBar({
  selectedIds,
  onClear,
}: {
  selectedIds: string[];
  onClear: () => void;
}) {
  const [pending, startTransition] = useTransition();

  if (selectedIds.length === 0) return null;

  function bulk(op: "suspend" | "unsuspend") {
    startTransition(async () => {
      const res = await adminBulkVpnAction({ ids: selectedIds, op });
      if (res.ok) {
        toast.success(res.message ?? "Done.");
        onClear();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-sm">
      <span className="text-cyan-300">{selectedIds.length} selected</span>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => bulk("suspend")}>
        Suspend VPN
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => bulk("unsuspend")}>
        Unsuspend VPN
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
