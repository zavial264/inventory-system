"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { navItemsForRole } from "@/components/layout/nav-items";
import { signOutAction } from "@/lib/data/auth-actions";
import { BRAND } from "@/lib/brand";
import { initialsOf } from "@/lib/format";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppSidebar({
  userEmail,
  userRole,
}: {
  userEmail: string;
  userRole: AppRole;
}) {
  const pathname = usePathname();
  const items = navItemsForRole(userRole);

  return (
    // Pinned to the viewport with its own height so the page can scroll past it.
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex shrink-0 items-center gap-3 px-5 py-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          {BRAND.initials}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-sidebar-foreground">
            {BRAND.name}
          </span>
          <span className="text-xs text-muted-foreground">{BRAND.tagline}</span>
        </span>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              />
              <span className="flex flex-col gap-0.5">
                <span>{item.label}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {initialsOf(userEmail.split("@")[0] ?? "Admin")}
          </span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium">
              {APP_ROLE_LABELS[userRole]}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {userEmail}
            </span>
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            >
              <LogOutIcon className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ userRole }: { userRole: AppRole }) {
  const pathname = usePathname();
  const items = navItemsForRole(userRole);

  return (
    <div className="sticky top-0 z-30 shrink-0 border-b border-border bg-background/85 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          {BRAND.initials}
        </span>
        <span className="text-sm font-semibold">{BRAND.name}</span>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              <item.icon className="size-3.5" />
              {item.shortLabel}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
