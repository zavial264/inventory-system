"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

export const TABLE_PAGE_SIZE = 50;

export function useClientPagination<T>(items: T[], pageSize = TABLE_PAGE_SIZE) {
  const [page, setPage] = React.useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const resetPage = React.useCallback(() => setPage(1), []);

  return {
    page: currentPage,
    pageCount,
    pageSize,
    total: items.length,
    rangeFrom: items.length === 0 ? 0 : start + 1,
    rangeTo: Math.min(start + pageSize, items.length),
    items: items.slice(start, start + pageSize),
    setPage,
    resetPage,
  };
}

export function TablePagination({
  page,
  pageCount,
  rangeFrom,
  rangeTo,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  rangeFrom: number;
  rangeTo: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {formatNumber(rangeFrom)}–{formatNumber(rangeTo)} of{" "}
        {formatNumber(total)}
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeftIcon />
            Previous
          </Button>
          <p className="min-w-24 text-center text-sm text-muted-foreground">
            Page {formatNumber(page)} of {formatNumber(pageCount)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            Next
            <ChevronRightIcon />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
