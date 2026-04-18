import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  totalItems?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemLabel = 'items',
  totalItems
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-must-border bg-must-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-must-text-secondary">
        Page {currentPage} of {totalPages}
        {typeof totalItems === 'number' ? ` • ${totalItems} ${itemLabel}` : ''}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          icon={<ChevronLeftIcon className="w-4 h-4" />}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          icon={<ChevronRightIcon className="w-4 h-4" />}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
