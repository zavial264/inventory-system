"use client";

import * as React from "react";
import { LockIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { useInventory } from "@/lib/store/inventory-provider";

export function ArticlesTable() {
  const { state, assignmentViews } = useInventory();

  const rows = React.useMemo(
    () =>
      [...state.articleTypes]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((article) => ({
          article,
          openLines: assignmentViews.filter(
            (view) =>
              view.articleTypeId === article.id && view.remainingQuantity > 0,
          ).length,
        })),
    [state.articleTypes, assignmentViews],
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
        <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          Rates are read-only here by design. Each assignment stores the rate
          that applied on the day it was created, so changing a rate later never
          rewrites past work.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Article</TableHead>
              <TableHead className="w-40 text-right">
                Stitching rate
              </TableHead>
              <TableHead className="w-32 text-right">Open lines</TableHead>
              <TableHead className="w-28">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ article, openLines }) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{article.name}</TableCell>
                <TableCell className="tabular text-right font-medium">
                  {formatCurrency(article.stitchingPrice)}
                </TableCell>
                <TableCell className="tabular text-right text-muted-foreground">
                  {openLines}
                </TableCell>
                <TableCell>
                  <Badge variant={article.isActive ? "success" : "outline"}>
                    {article.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
