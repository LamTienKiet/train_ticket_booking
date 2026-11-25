"use client";

import type { ReactNode } from "react";
import styles from "../admin.module.css";

export type Column<T> = { key: string; label: string; render?: (row: T) => ReactNode; width?: string; align?: "right" };

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string;
  toolbar?: ReactNode;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  total?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
};

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  toolbar,
  onRowClick,
  emptyText = "Chưa có dữ liệu.",
  total,
  page = 1,
  limit = 20,
  onPageChange,
}: Props<T>) {
  const pages = total && onPageChange ? Math.max(1, Math.ceil(total / limit)) : 1;

  return (
    <div className={styles.tableCard}>
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}

      {error && (
        <div role="alert" className={styles.alertError}>
          {error}
        </div>
      )}

      <div className={styles.tableScroll}>
        <table className={styles.table} aria-busy={loading}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width, textAlign: c.align }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              Array.from({ length: 4 }, (_, i) => (
                <tr key={i}>
                  <td colSpan={columns.length}>
                    <span className={styles.skeleton} />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  {error ? "—" : emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={onRowClick ? styles.rowClickable : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} style={{ textAlign: c.align }}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && total !== undefined && (
        <div className={styles.pager}>
          <span>
            {total} kết quả · Trang {page}/{pages}
          </span>
          <div>
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              ‹ Trước
            </button>
            <button type="button" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
              Sau ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
