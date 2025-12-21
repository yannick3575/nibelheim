'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T;
  header: string;
  className?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableVisionProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTableVision<T extends { id: string | number }>({
  data,
  columns,
  className,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
}: DataTableVisionProps<T>) {
  return (
    <div className={cn('glass-vision-strong rounded-xl overflow-hidden relative', className)}>
      {/* Vision UI: Noise + Grid overlays */}
      <div className="noise absolute inset-0 pointer-events-none opacity-30" />
      <div className="grid-pattern absolute inset-0 pointer-events-none opacity-20" />

      {/* Table container */}
      <div className="relative overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="glass-vision border-b border-primary/20">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-primary',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-primary/10">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <p className="text-muted-foreground">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-all duration-200 hover:glass-vision',
                    onRowClick && 'cursor-pointer hover:neon-glow'
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        'px-6 py-4 text-sm text-foreground/90',
                        column.className
                      )}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
}

// Export types for usage
export type { Column as DataTableColumn };
