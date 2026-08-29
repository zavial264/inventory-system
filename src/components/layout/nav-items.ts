import {
  ClipboardListIcon,
  PlusCircleIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  TagsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import type { AppRole } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
  superAdminOnly?: boolean;
};

export const navItems: NavItem[] = [
  {
    href: "/tracking",
    label: "Work Tracking",
    shortLabel: "Tracking",
    icon: ClipboardListIcon,
    description: "Assigned, completed and remaining pieces",
  },
  {
    href: "/assign",
    label: "Assign Work",
    shortLabel: "Assign",
    icon: PlusCircleIcon,
    description: "Hand articles to an employee",
  },
  {
    href: "/employees",
    label: "Employees",
    shortLabel: "Employees",
    icon: UsersIcon,
    description: "Manage the tailors on your books",
  },
  {
    href: "/articles",
    label: "Articles & Rates",
    shortLabel: "Articles",
    icon: TagsIcon,
    description: "Stitching rates for each article",
  },
  {
    href: "/receipts",
    label: "Receipts",
    shortLabel: "Receipts",
    icon: ReceiptTextIcon,
    description: "Handover slips issued to employees",
  },
  {
    href: "/users",
    label: "Platform Users",
    shortLabel: "Users",
    icon: ShieldCheckIcon,
    description: "Create admins and manage roles",
    superAdminOnly: true,
  },
];

export function navItemsForRole(role: AppRole) {
  return navItems.filter(
    (item) => !item.superAdminOnly || role === "super_admin",
  );
}
