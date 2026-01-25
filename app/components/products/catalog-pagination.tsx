"use client";

import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
    totalPages: number;
    currentPage: number;
}

export function CatalogPagination({ totalPages, currentPage }: PaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (totalPages <= 1) return null;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const handlePageChange = (page: number) => {
        router.push(createPageURL(page));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(
                    <Button
                        key={i}
                        variant={currentPage === i ? "default" : "outline"}
                        size="icon"
                        onClick={() => handlePageChange(i)}
                        className="w-10 h-10 rounded-xl font-bold"
                    >
                        {i}
                    </Button>
                );
            }
        } else {
            // Logic for ellipsis if many pages
            pages.push(
                <Button
                    key={1}
                    variant={currentPage === 1 ? "default" : "outline"}
                    size="icon"
                    onClick={() => handlePageChange(1)}
                    className="w-10 h-10 rounded-xl font-bold"
                >
                    1
                </Button>
            );

            if (currentPage > 3) {
                pages.push(<MoreHorizontal key="dots-start" className="text-muted-foreground w-4" />);
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(
                    <Button
                        key={i}
                        variant={currentPage === i ? "default" : "outline"}
                        size="icon"
                        onClick={() => handlePageChange(i)}
                        className="w-10 h-10 rounded-xl font-bold"
                    >
                        {i}
                    </Button>
                );
            }

            if (currentPage < totalPages - 2) {
                pages.push(<MoreHorizontal key="dots-end" className="text-muted-foreground w-4" />);
            }

            pages.push(
                <Button
                    key={totalPages}
                    variant={currentPage === totalPages ? "default" : "outline"}
                    size="icon"
                    onClick={() => handlePageChange(totalPages)}
                    className="w-10 h-10 rounded-xl font-bold"
                >
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-12 pb-8">
            <Button
                variant="outline"
                size="icon"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-10 h-10 rounded-xl"
            >
                <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
                {renderPageNumbers()}
            </div>

            <Button
                variant="outline"
                size="icon"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="w-10 h-10 rounded-xl"
            >
                <ChevronRight className="w-5 h-5" />
            </Button>
        </div>
    );
}
