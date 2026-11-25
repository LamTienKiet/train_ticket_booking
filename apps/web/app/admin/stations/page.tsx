"use client";

import { useState } from "react";
import { api } from "../../utils/axiosClient";
import DataTable, { type Column } from "../_components/DataTable";
import FormModal, { toPayload, type Field } from "../_components/FormModal";
import ConfirmDialog from "../_components/ConfirmDialog";
import StatusBadge from "../_components/StatusBadge";
import { useAdminList } from "../_components/useAdminList";
import styles from "../admin.module.css";

type Station = {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string | null;
  status: "ACTIVE" | "INACTIVE";
  _count?: { routeStations: number };
};

const FIELDS: Field[] = [
  { name: "code", label: "Mã ga", type: "text", required: true, placeholder: "VD: HAN", hint: "Viết hoa, không dấu, tối đa 20 ký tự" },
  { name: "name", label: "Tên ga", type: "text", required: true, placeholder: "VD: Ga Hà Nội" },
  { name: "city", label: "Thành phố / Tỉnh", type: "text", required: true },
  { name: "address", label: "Địa chỉ", type: "textarea" },
  {
    name: "status",
    label: "Trạng thái",
    type: "select",
    options: [
      { value: "ACTIVE", label: "Hoạt động" },
      { value: "INACTIVE", label: "Ngừng hoạt động" },
    ],
  },
];

export default function StationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editing, setEditing] = useState<Station | "new" | null>(null);
  const [deleting, setDeleting] = useState<Station | null>(null);
  const [notice, setNotice] = useState("");
  const { rows, loading, error, reload } = useAdminList<Station>("/stations", { search, status });

  const columns: Column<Station>[] = [
    { key: "code", label: "Mã", width: "90px", render: (s) => <span className={styles.mono}>{s.code}</span> },
    { key: "name", label: "Tên ga", render: (s) => <span className={styles.cellMain}>{s.name}</span> },
    { key: "city", label: "Thành phố" },
    { key: "address", label: "Địa chỉ", render: (s) => s.address || <span className={styles.cellSub}>—</span> },
    { key: "routes", label: "Số tuyến", align: "right", render: (s) => s._count?.routeStations ?? 0 },
    { key: "status", label: "Trạng thái", render: (s) => <StatusBadge value={s.status} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (s) => (
        <div className={styles.actions}>
          <button type="button" className={styles.btnSm} onClick={() => setEditing(s)}>
            Sửa
          </button>
          <button type="button" className={styles.btnSmDanger} onClick={() => setDeleting(s)}>
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Ga tàu</h1>
          <p className={styles.pageSub}>Danh sách nhà ga dùng để lập tuyến và tìm chuyến.</p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={() => setEditing("new")}>
          + Thêm ga
        </button>
      </div>

      {notice && (
        <div role="status" className={styles.alertInfo} style={{ margin: "0 0 16px" }}>
          {notice}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.id}
        loading={loading}
        error={error}
        emptyText="Không có ga nào."
        toolbar={
          <>
            <input
              className={`${styles.input} ${styles.search}`}
              placeholder="Tìm theo mã, tên ga, thành phố..."
              aria-label="Tìm ga"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className={styles.tabs} role="tablist" aria-label="Lọc trạng thái">
              {(["ACTIVE", "INACTIVE"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={status === s}
                  className={`${styles.tab} ${status === s ? styles.tabActive : ""}`}
                  onClick={() => setStatus(s)}
                >
                  {s === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
                </button>
              ))}
            </div>
          </>
        }
      />

      <FormModal
        open={editing !== null}
        title={editing === "new" ? "Thêm ga mới" : "Sửa thông tin ga"}
        fields={FIELDS}
        initial={editing === "new" ? { status: "ACTIVE" } : (editing ?? undefined)}
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          const body = toPayload(values);
          if (editing === "new") await api.post("/stations", body);
          else if (editing) await api.patch(`/stations/${editing.id}`, body);
          setNotice("");
          reload();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Xóa ga?"
        danger
        confirmLabel="Xóa"
        message={
          <>
            Xóa <b>{deleting?.name}</b>? Nếu ga đã nằm trong tuyến hoặc chuyến, hệ thống sẽ chuyển sang <b>ngừng hoạt động</b>{" "}
            thay vì xóa.
          </>
        }
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          const { data } = await api.delete(`/stations/${deleting!.id}`);
          setNotice(data?.deactivated ? data.message : `Đã xóa ga ${deleting!.name}.`);
          reload();
        }}
      />
    </>
  );
}
