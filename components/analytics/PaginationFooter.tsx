import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface PaginationFooterProps {
    pagination: PaginationInfo | null;
    onPageChange: (newPage: number) => void;
}

export function PaginationFooter({ pagination, onPageChange }: PaginationFooterProps) {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
        <footer className="border-t bg-white px-6 py-4 mt-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                    Showing{" "}
                    {(pagination.page - 1) * pagination.limit + 1}{" "}
                    to{" "}
                    {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                    )}{" "}
                    of <span className="font-semibold text-gray-900">{pagination.total}</span> results
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(pagination.page - 1)}
                        className="gap-2"
                        disabled={!pagination.hasPrev}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                    </Button>
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
                                            className="w-8 h-8 p-0"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                }
                                return null;
                            }
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(pagination.page + 1)}
                        className="gap-2"
                        disabled={!pagination.hasNext}
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-sm text-gray-600">
                    Page <span className="font-medium text-gray-900">{pagination.page}</span> of {pagination.totalPages}
                </div>
            </div>
        </footer>
    );
}
