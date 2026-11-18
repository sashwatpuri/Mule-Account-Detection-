import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  rowsPerPage,
  totalItems,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-[#0D1527] border-t border-white/8 text-xs text-slate-400">
      {/* Left: Rows Per Page Selector */}
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="h-7 rounded border border-white/10 bg-[#111C33] px-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
        <span className="hidden md:inline text-slate-500">|</span>
        <span className="font-mono text-slate-300">
          Showing {startItem}–{endItem} of {totalItems}
        </span>
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex items-center gap-1 self-end sm:self-auto">
        <span className="mr-2 text-[11px] text-slate-400">
          Page <strong className="text-white font-mono">{currentPage}</strong> of{' '}
          <span className="font-mono">{Math.max(1, totalPages)}</span>
        </span>

        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="h-7 w-7 p-0 border-white/10 text-slate-400 disabled:opacity-30"
          title="First Page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>

        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-7 w-7 p-0 border-white/10 text-slate-400 disabled:opacity-30"
          title="Previous Page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-7 w-7 p-0 border-white/10 text-slate-400 disabled:opacity-30"
          title="Next Page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="h-7 w-7 p-0 border-white/10 text-slate-400 disabled:opacity-30"
          title="Last Page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
