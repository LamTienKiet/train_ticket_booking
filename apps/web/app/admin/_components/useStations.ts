"use client";

import { useEffect, useState } from "react";
import { api } from "../../utils/axiosClient";

export type StationOption = { id: string; code: string; name: string; city: string };

/** Danh sách ga đang hoạt động cho các ô chọn ga */
export function useStations() {
  const [stations, setStations] = useState<StationOption[]>([]);
  useEffect(() => {
    api
      .get<StationOption[]>("/stations")
      .then((r) => setStations(r.data))
      .catch(() => setStations([]));
  }, []);
  return stations;
}

/** 610 → "10h 10m" */
export const fmtMinutes = (m: number) => `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`;
