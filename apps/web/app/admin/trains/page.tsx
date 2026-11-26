"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../utils/axiosClient";
import DataTable, { type Column } from "../_components/DataTable";
import FormModal, { toPayload } from "../_components/FormModal";
import StatusBadge from "../_components/StatusBadge";
import { useAdminList } from "../_components/useAdminList";
import styles from "../admin.module.css";
import { TRAIN_FIELDS } from "./fields";

type Train = { id: string; code: string; name: string; status: string; totalCoaches: number; totalSeats: number };

export default function TrainsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const { rows, loading, error, reload } = useAdminList<Train>("/trains", { search });

  const columns: Column<Train>[] = [
    { key: "code", label: "Mác tàu", width: "100px", render: (t) => <span className={styles.mono}>{t.code}</span> },
    { key: "name", label: "Tên tàu", render: (t) => <span className={styles.cellMain}>{t.name}</span> },
    {
      key: "totalCoaches",
      label: "Số toa",
      align: "right",
      render: (t) => (t.totalCoaches ? t.totalCoaches : <StatusBadge value="Chưa có toa" />),
    },
    { key: "totalSeats", label: "Tổng chỗ", align: "right" },
    { key: "status", label: "Trạng thái", render: (t) => <StatusBadge value={t.status} /> },
    { key: "go", label: "", align: "right", render: () => <span className={styles.crumb}>Chi tiết →</span> },
  ];

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Tàu &amp; toa</h1>
          <p className={styles.pageSub}>Mỗi mác tàu (VD: SE1) dùng được cho chuyến của nhiều ngày. Bấm vào một tàu để thêm hoặc xóa toa.</p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={() => setCreating(true)}>
          + Thêm tàu
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        loading={loading}
        error={error}
        onRowClick={(t) => router.push(`/admin/trains/${t.id}`)}
        emptyText="Chưa có tàu nào."
        toolbar={
          <input
            className={`${styles.input} ${styles.search}`}
            placeholder="Tìm theo mã hoặc tên tàu..."
            aria-label="Tìm tàu"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />

      <FormModal
        open={creating}
        title="Thêm tàu mới"
        fields={TRAIN_FIELDS}
        initial={{ status: "ACTIVE" }}
        submitLabel="Tạo tàu"
        onClose={() => setCreating(false)}
        onSubmit={async (values) => {
          const { data } = await api.post("/trains", toPayload(values));
          reload();
          // Tàu mới chưa có toa: chuyển ngay sang trang chi tiết để thêm toa
          router.push(`/admin/trains/${data.id}`);
        }}
      />
    </>
  );
}
