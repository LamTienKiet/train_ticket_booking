"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../utils/axiosClient";
import DataTable, { type Column } from "../_components/DataTable";
import FormModal, { toPayload, type Field } from "../_components/FormModal";
import StatusBadge from "../_components/StatusBadge";
import { useAdminList } from "../_components/useAdminList";
import { fmtMinutes, useStations } from "../_components/useStations";
import styles from "../admin.module.css";

type Route = {
  id: string;
  code: string;
  name: string;
  distanceKm: string | null;
  estimatedDurationMins: number | null;
  status: string;
  originStation: { name: string };
  destinationStation: { name: string };
  _count: { routeStations: number; trips: number; fareRules: number };
};

const LIMIT = 20;

export default function RoutesPage() {
  const router = useRouter();
  const stations = useStations();
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const { rows, total, loading, error, reload } = useAdminList<Route>("/routes", { keyword, page, limit: LIMIT });

  const stationOptions = stations.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));
  const fields: Field[] = [
    { name: "code", label: "Mã tuyến", type: "text", required: true, placeholder: "VD: HAN-HUE" },
    { name: "name", label: "Tên tuyến", type: "text", required: true, placeholder: "VD: Hà Nội - Huế" },
    { name: "originStationId", label: "Ga đầu", type: "select", required: true, options: stationOptions },
    { name: "destinationStationId", label: "Ga cuối", type: "select", required: true, options: stationOptions },
    { name: "distanceKm", label: "Chiều dài (km)", type: "number" },
    { name: "estimatedDurationMins", label: "Thời gian chạy dự kiến (phút)", type: "number" },
  ];

  const columns: Column<Route>[] = [
    { key: "code", label: "Mã", render: (r) => <span className={styles.mono}>{r.code}</span> },
    {
      key: "name",
      label: "Tuyến",
      render: (r) => (
        <>
          <span className={styles.cellMain}>{r.name}</span>
          <span className={styles.cellSub}>
            {r.originStation.name} → {r.destinationStation.name}
          </span>
        </>
      ),
    },
    { key: "km", label: "Km", align: "right", render: (r) => (r.distanceKm ? Number(r.distanceKm).toLocaleString("vi-VN") : "—") },
    { key: "dur", label: "Thời gian", render: (r) => (r.estimatedDurationMins ? fmtMinutes(r.estimatedDurationMins) : "—") },
    {
      key: "stops",
      label: "Ga dừng",
      align: "right",
      render: (r) => (r._count.routeStations >= 2 ? r._count.routeStations : <StatusBadge value="Chưa đủ ga" />),
    },
    { key: "fares", label: "Bảng giá", align: "right", render: (r) => r._count.fareRules || <StatusBadge value="Chưa có giá" /> },
    { key: "trips", label: "Chuyến", align: "right", render: (r) => r._count.trips },
    { key: "status", label: "Trạng thái", render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Tuyến</h1>
          <p className={styles.pageSub}>Tuyến cần ít nhất 2 ga dừng và có bảng giá thì mới mở bán chuyến được.</p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={() => setCreating(true)}>
          + Thêm tuyến
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRowClick={(r) => router.push(`/admin/routes/${r.id}`)}
        total={total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        toolbar={
          <input
            className={`${styles.input} ${styles.search}`}
            placeholder="Tìm theo mã, tên tuyến, tên ga..."
            aria-label="Tìm tuyến"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
          />
        }
      />

      <FormModal
        open={creating}
        title="Thêm tuyến mới"
        fields={fields}
        submitLabel="Tạo tuyến"
        onClose={() => setCreating(false)}
        onSubmit={async (values) => {
          const { data } = await api.post("/routes", toPayload(values, ["distanceKm", "estimatedDurationMins"]));
          reload();
          router.push(`/admin/routes/${data.id}`);
        }}
      />
    </>
  );
}
