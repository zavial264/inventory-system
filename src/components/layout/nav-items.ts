import {
  ClipboardListIcon,
  PlusCircleIcon,
  ReceiptTextIcon,
  TagsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
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
];
