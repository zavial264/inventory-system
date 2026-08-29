import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { TrackingBoard } from "@/components/tracking/tracking-board";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Work Tracking",
};

export default function TrackingPage() {
  return (
    <>
      <PageHeader
        title="Work tracking"
        description="What each tailor is holding, what has come back, and what is still in progress."
        actions={
          <Button asChild>
            <Link href="/assign">
              <PlusIcon />
              Assign work
            </Link>
          </Button>
        }
      />
      <TrackingBoard />
    </>
  );
}
