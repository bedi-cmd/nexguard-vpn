"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DashboardSidebar } from "./sidebar";

export function MobileNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="bg-slate-950 border-slate-800 w-72 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <DashboardSidebar isAdmin={isAdmin} />
      </SheetContent>
    </Sheet>
  );
}
