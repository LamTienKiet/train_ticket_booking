"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../utils/axiosClient";
import { apiErrorMessage } from "../../utils/apiError";

type Params = Record<string, string | number | undefined>;

/** Gọi GET danh sách; chấp nhận API trả mảng hoặc { items, total } (hoặc { data, total }) */
export function useAdminList<T>(url: string, params: Params = {}) {
  const [tick, setTick] = useState(0);
  const paramsKey = JSON.stringify(params);
  const requestKey = `${url}#${tick}#${paramsKey}`;
  // Kết quả gắn với khóa request; đang tải = kết quả hiện có thuộc request cũ
  const [result, setResult] = useState<{ key: string; rows: T[]; total: number; error: string }>({
    key: "",
    rows: [],
    total: 0,
    error: "",
  });

  useEffect(() => {
    let alive = true;
    const clean = Object.fromEntries(
      Object.entries(JSON.parse(paramsKey) as Params).filter(([, v]) => v !== undefined && v !== ""),
    );
    api
      .get(url, { params: clean })
      .then(({ data }) => {
        if (!alive) return;
        const list: T[] = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
        const total = Array.isArray(data) ? list.length : (data.total ?? data.meta?.total ?? list.length);
        setResult({ key: requestKey, rows: list, total, error: "" });
      })
      .catch((e) => {
        if (alive) setResult((r) => ({ ...r, key: requestKey, error: apiErrorMessage(e, "Không tải được dữ liệu.") }));
      });
    return () => {
      alive = false;
    };
  }, [url, paramsKey, requestKey]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { rows: result.rows, total: result.total, loading: result.key !== requestKey, error: result.error, reload };
}
