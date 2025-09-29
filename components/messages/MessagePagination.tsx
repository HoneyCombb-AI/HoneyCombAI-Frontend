"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface MessagePaginationProps {
  pagination: PaginationInfo;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
}

export const MessagePagination = React.memo(({
  pagination,
  pageSize,
  onPageSizeChange,
  onPageChange
}: MessagePaginationProps) => {
  // Don't show pagination if no results
  if (pagination.total === 0) {
    return null;
  }

  // If only one page, show simplified view with just the page size selector
  if (pagination.totalPages <= 1) {
    return (
      <footer className="border-t bg-white px-6 py-4 mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing {pagination.total} message{pagination.total !== 1 ? 's' : ''}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-sm">
                  <span>{pageSize}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPageSizeChange(20)}>
                  20
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageSizeChange(50)}>
                  50
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageSizeChange(100)}>
                  100
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t bg-white px-6 py-4 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Showing{" "}
          {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} messages
        </div>

        <div className="flex items-center gap-2">
          {pagination.hasPrev && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
          )}

          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                const pageNum =
                  Math.max(
                    1,
                    Math.min(
                      pagination.totalPages - 4,
                      Math.max(1, pagination.page - 2)
                    )
                  ) + i;

                if (pageNum <= pagination.totalPages) {
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                }
                return null;
              }
            )}
          </div>

          {pagination.hasNext && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              className="gap-2"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-sm">
                <span>{pageSize}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPageSizeChange(20)}>
                20
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPageSizeChange(50)}>
                50
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPageSizeChange(100)}>
                100
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </footer>
  );
});

MessagePagination.displayName = "MessagePagination";