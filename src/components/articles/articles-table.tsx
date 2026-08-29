"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  BanIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  TagIcon,
} from "lucide-react";

import { ArticleDialog } from "@/components/articles/article-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/format";
import { useInventory } from "@/lib/store/inventory-provider";
import type { ArticleType } from "@/lib/types";

export function ArticlesTable() {
  const { state, assignmentViews, isSuperAdmin, setArticleTypeActive } =
    useInventory();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ArticleType | undefined>();

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
          remaining: assignmentViews
            .filter((view) => view.articleTypeId === article.id)
            .reduce((total, view) => total + view.remainingQuantity, 0),
        })),
    [state.articleTypes, assignmentViews],
  );

  const toggleActive = async (article: ArticleType) => {
    const result = await setArticleTypeActive(article.id, !article.isActive);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      article.isActive
        ? `${article.name} deactivated`
        : `${article.name} reactivated`,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            {isSuperAdmin
              ? "Each assignment stores the rate that applied on the day it was created, so changing a rate later never rewrites past work."
              : "Rates are read-only here. Each assignment stores the rate that applied on the day it was created, so a later price change never rewrites past work."}
          </p>
        </div>
        {isSuperAdmin ? (
          <Button
            className="shrink-0"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <PlusIcon />
            Add article
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="No articles yet"
          description={
            isSuperAdmin
              ? "Add garment types and their stitching rates to start assigning work."
              : "Article types will appear here once they are set up."
          }
        />
      ) : (
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
                {isSuperAdmin ? (
                  <TableHead className="w-px text-right">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ article, openLines, remaining }) => (
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
                  {isSuperAdmin ? (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Edit ${article.name}`}
                              onClick={() => {
                                setEditing(article);
                                setDialogOpen(true);
                              }}
                            >
                              <PencilIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit name or rate</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={
                                article.isActive
                                  ? `Deactivate ${article.name}`
                                  : `Reactivate ${article.name}`
                              }
                              onClick={() => toggleActive(article)}
                            >
                              {article.isActive ? (
                                <BanIcon />
                              ) : (
                                <TagIcon />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {article.isActive
                              ? remaining > 0
                                ? `${remaining} piece${remaining === 1 ? "" : "s"} still pending — deactivation blocked`
                                : "Deactivate (hidden from new assignments)"
                              : "Reactivate"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isSuperAdmin ? (
        <ArticleDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          article={editing}
        />
      ) : null}
    </div>
  );
}
