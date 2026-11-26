"use client";

import { useState } from "react";
import { api } from "../../utils/axiosClient";
import { fmtDate, fmtTime } from "../../utils/format";
import ConfirmDialog from "../_components/ConfirmDialog";
import DataTable, { type Column } from "../_components/DataTable";
import FormModal, { type Field, type FormValues } from "../_components/FormModal";
import StatusBadge, { STATUS_LABEL } from "../_components/StatusBadge";
import { useAdminList } from "../_components/useAdminList";
import { fmtMinutes } from "../_components/useStations";
import styles from "../admin.module.css";

type Trip = {
  id: string;
  tripCode: string;
  status: string;
  departureTime: string;
  arrivalTime: string;
  route: { id: string; code: string; name: string };
  train: { id: string; code: string };
  soldSeats: number;
  totalSeats: number;
};
type RouteOpt = { id: string; code: string; name: string; estimatedDurationMins: number | null; _count: { routeStations: number } };
type TrainOpt = { id: string; code: string; name: string; totalCoaches: number; status: string };

const STATUSES = ["SCHEDULED", "BOARDING", "DEPARTED", "COMPLETED", "CANCELLED"];
const LIMIT = 20;

// datetime-local hiểu theo giờ máy người dùng (admin ở VN) → gửi ISO UTC
const toIso = (local: string) => new Date(local).toISOString();
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function TripsPage() {
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [deleting, setDeleting] = useState<Trip | null>(null);
  const [notice, setNotice] = useState("");

  const trips = useAdminList<Trip>("/trips/admin", { status, from, to, page, limit: LIMIT });
  const routes = useAdminList<RouteOpt>("/routes", { status: "ACTIVE", limit: 100 });
  const trains = useAdminList<TrainOpt>("/trains", { status: "ACTIVE" });

  const createFields: Field[] = [
    { name: "tripCode", label: "Mã chuyến", type: "text", required: true, placeholder: "VD: SE1-20261201" },
    {
      name: "routeId",
      label: "Tuyến",
      type: "select",
      required: true,
      options: routes.rows.map((r) => ({
        value: r.id,
        label: `${r.code} · ${r.name}${r._count.routeStations < 2 ? " (chưa đủ ga dừng)" : ""}`,
      })),
    },
    {
      name: "trainId",
      label: "Mác tàu",
      type: "select",
      required: true,
      options: trains.rows.map((t) => ({
        value: t.id,
        label: `${t.code} · ${t.name}${t.totalCoaches === 0 ? " (chưa có toa)" : ` · ${t.totalCoaches} toa`}`,
      })),
    },
    { name: "departureTime", label: "Giờ khởi hành", type: "datetime", required: true, hint: "Giờ đến và giờ tại từng ga được tính tự động từ tuyến" },
  ];

  const editFields: Field[] = [
    { name: "departureTime", label: "Giờ khởi hành", type: "datetime", required: true, hint: "Không đổi được khi chuyến đã có vé" },
    { name: "status", label: "Trạng thái", type: "select", required: true, options: STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })) },
  ];

  const preview = (v: FormValues) => {
    const route = routes.rows.find((r) => r.id === v.routeId);
    if (!route || !v.departureTime || !route.estimatedDurationMins) return null;
    const arrive = new Date(new Date(v.departureTime).getTime() + route.estimatedDurationMins * 60000).toISOString();
    return (
      <div className={styles.alertInfo} style={{ margin: 0 }}>
        Dự kiến đến <b>{fmtTime(arrive)}</b> ngày {fmtDate(arrive)} ({fmtMinutes(route.estimatedDurationMins)}). Giờ chính xác lấy
        theo ga dừng của tuyến.
      </div>
    );
  };

  const columns: Column<Trip>[] = [
    { key: "tripCode", label: "Mã chuyến", render: (t) => <span className={styles.mono}>{t.tripCode}</span> },
    {
      key: "route",
      label: "Tuyến / Tàu",
      render: (t) => (
        <>
          <span className={styles.cellMain}>{t.route.name}</span>
          <span className={styles.cellSub}>Tàu {t.train.code}</span>
        </>
      ),
    },
    {
      key: "dep",
      label: "Khởi hành",
      render: (t) => (
        <>
          <span className={styles.cellMain}>{fmtTime(t.departureTime)}</span>
          <span className={styles.cellSub}>{fmtDate(t.departureTime)}</span>
        </>
      ),
    },
    {
      key: "arr",
      label: "Đến",
      render: (t) => (
        <>
          <span className={styles.cellMain}>{fmtTime(t.arrivalTime)}</span>
          <span className={styles.cellSub}>{fmtDate(t.arrivalTime)}</span>
        </>
      ),
    },
    {
      key: "sold",
      label: "Đã bán",
      render: (t) => (
        <div className={styles.progress} title={`${t.soldSeats}/${t.totalSeats} chỗ`}>
          <span className={styles.progressTrack}>
            <span className={styles.progressFill} style={{ width: `${t.totalSeats ? (t.soldSeats / t.totalSeats) * 100 : 0}%` }} />
          </span>
          <span>
            {t.soldSeats}/{t.totalSeats}
          </span>
        </div>
      ),
    },
    { key: "status", label: "Trạng thái", render: (t) => <StatusBadge value={t.status} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (t) => (
        <div className={styles.actions}>
          <button type="button" className={styles.btnSm} onClick={() => setEditing(t)}>
            Sửa
          </button>
          {t.status !== "CANCELLED" && (
            <button type="button" className={styles.btnSmDanger} onClick={() => setDeleting(t)}>
              {t.soldSeats > 0 ? "Hủy" : "Xóa"}
            </button>
          )}
        </div>
      ),
    },
  ];

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Chuyến tàu</h1>
          <p className={styles.pageSub}>Tạo chuyến từ tuyến (đủ ga dừng, có giá) và tàu (có toa).</p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={() => setCreating(true)}>
          + Tạo chuyến
        </button>
      </div>

      {notice && (
        <div role="status" className={styles.alertInfo} style={{ margin: "0 0 16px" }}>
          {notice}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={trips.rows}
        rowKey={(t) => t.id}
        loading={trips.loading}
        error={trips.error}
        total={trips.total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        emptyText="Không có chuyến nào khớp bộ lọc."
        toolbar={
          <>
            <select className={styles.input} style={{ width: 180 }} aria-label="Lọc trạng thái" value={status} onChange={(e) => resetPage(setStatus)(e.target.value)}>
              <option value="">Mọi trạng thái</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <label className={styles.cellSub} htmlFor="trip-from">
              Từ
            </label>
            <input id="trip-from" type="date" className={styles.input} style={{ width: 160 }} value={from} onChange={(e) => resetPage(setFrom)(e.target.value)} />
            <label className={styles.cellSub} htmlFor="trip-to">
              đến
            </label>
            <input id="trip-to" type="date" className={styles.input} style={{ width: 160 }} value={to} onChange={(e) => resetPage(setTo)(e.target.value)} />
          </>
        }
      />

      <FormModal
        open={creating}
        title="Tạo chuyến mới"
        fields={createFields}
        submitLabel="Tạo chuyến"
        footer={preview}
        onClose={() => setCreating(false)}
        onSubmit={async (v) => {
          await api.post("/trips", { tripCode: v.tripCode.trim(), routeId: v.routeId, trainId: v.trainId, departureTime: toIso(v.departureTime) });
          setNotice(`Đã tạo chuyến ${v.tripCode.trim()}.`);
          trips.reload();
        }}
      />

      <FormModal
        open={editing !== null}
        title={`Sửa chuyến ${editing?.tripCode ?? ""}`}
        fields={editFields}
        initial={editing ? { departureTime: toLocalInput(editing.departureTime), status: editing.status } : undefined}
        onClose={() => setEditing(null)}
        onSubmit={async (v) => {
          const body: Record<string, string> = { status: v.status };
          // chỉ gửi giờ khi thật sự đổi, để chuyến đã có vé vẫn đổi được trạng thái
          if (v.departureTime !== toLocalInput(editing!.departureTime)) body.departureTime = toIso(v.departureTime);
          await api.patch(`/trips/${editing!.id}`, body);
          trips.reload();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={deleting?.soldSeats ? "Hủy chuyến?" : "Xóa chuyến?"}
        danger
        confirmLabel={deleting?.soldSeats ? "Hủy chuyến" : "Xóa"}
        message={
          deleting?.soldSeats
            ? `Chuyến ${deleting.tripCode} đã có ${deleting.soldSeats} chỗ được đặt nên sẽ được chuyển sang Đã hủy (không xóa).`
            : `Xóa chuyến ${deleting?.tripCode}?`
        }
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          const { data } = await api.delete(`/trips/${deleting!.id}`);
          setNotice(data?.message ?? `Đã xóa chuyến ${deleting!.tripCode}.`);
          trips.reload();
        }}
      />
    </>
  );
}
