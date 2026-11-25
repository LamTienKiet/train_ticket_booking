"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../../utils/axiosClient";
import ConfirmDialog from "../_components/ConfirmDialog";
import FormModal, { type Field, type FormValues } from "../_components/FormModal";
import StatusBadge from "../_components/StatusBadge";
import { useAdminList } from "../_components/useAdminList";
import styles from "../admin.module.css";

type SeatType = { id: string; code: string; name: string };
type RouteOpt = { id: string; code: string; name: string };
type PassengerFare = { passengerType: string; discountPercent: string };
type Fare = {
  id: string;
  basePrice: string;
  effectiveFrom: string;
  status: string;
  seatType: SeatType;
  passengerFares: PassengerFare[];
};

// Đối tượng được giảm giá; người lớn trả giá gốc
const DISCOUNTS = [
  { type: "CHILD", label: "Trẻ em" },
  { type: "STUDENT", label: "Sinh viên" },
  { type: "SENIOR", label: "Cao tuổi" },
] as const;

const FIELDS: Field[] = [
  { name: "basePrice", label: "Giá gốc cả tuyến (đ)", type: "number", required: true, hint: "Giá chặng ngắn hơn tự tính theo km" },
  ...DISCOUNTS.map((d) => ({ name: d.type, label: `Giảm cho ${d.label} (%)`, type: "number" as const })),
];

const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`;
const pct = (f: Fare, type: string) => f.passengerFares.find((p) => p.passengerType === type)?.discountPercent;

export default function FaresPage() {
  // useSearchParams cần Suspense khi render tĩnh
  return (
    <Suspense>
      <FaresContent />
    </Suspense>
  );
}

function FaresContent() {
  const searchParams = useSearchParams();
  const [seatTypes, setSeatTypes] = useState<SeatType[]>([]);
  // Mở từ trang chi tiết tuyến: ?routeId=...
  const [routeId, setRouteId] = useState(searchParams.get("routeId") ?? "");
  const [editing, setEditing] = useState<{ seatType: SeatType; fare?: Fare } | null>(null);
  const [deleting, setDeleting] = useState<Fare | null>(null);
  const routes = useAdminList<RouteOpt>("/routes", { limit: 100 });
  const fares = useAdminList<Fare>("/fares", { routeId, limit: 100 });

  useEffect(() => {
    api.get<SeatType[]>("/admin/seat-types").then((r) => setSeatTypes(r.data)).catch(() => setSeatTypes([]));
  }, []);

  const fareRows = routeId ? fares.rows : [];
  const toBody = (v: FormValues) => ({
    basePrice: Number(v.basePrice),
    passengerFares: DISCOUNTS.filter((d) => v[d.type]?.trim()).map((d) => ({
      passengerType: d.type,
      discountPercent: Number(v[d.type]),
    })),
  });

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Bảng giá</h1>
          <p className={styles.pageSub}>Mỗi tuyến có một giá gốc cho từng loại ghế, kèm % giảm theo đối tượng hành khách.</p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.toolbar}>
          <label htmlFor="fare-route" className={styles.cellMain}>
            Tuyến
          </label>
          <select
            id="fare-route"
            className={`${styles.input} ${styles.search}`}
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
          >
            <option value="">— Chọn tuyến —</option>
            {routes.rows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} · {r.name}
              </option>
            ))}
          </select>
        </div>

        {fares.error && routeId && (
          <div role="alert" className={styles.alertError}>
            {fares.error}
          </div>
        )}

        {!routeId ? (
          <p className={styles.emptyCell}>Chọn một tuyến để xem và sửa giá.</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table} aria-busy={fares.loading}>
              <thead>
                <tr>
                  <th>Loại ghế</th>
                  <th style={{ textAlign: "right" }}>Giá gốc</th>
                  {DISCOUNTS.map((d) => (
                    <th key={d.type} style={{ textAlign: "right" }}>
                      {d.label}
                    </th>
                  ))}
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {seatTypes.map((st) => {
                  const fare = fareRows.find((f) => f.seatType.id === st.id);
                  return (
                    <tr key={st.id}>
                      <td>
                        <span className={styles.cellMain}>{st.name}</span>
                        <span className={styles.cellSub}>{st.code}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {fare ? <strong>{vnd(Number(fare.basePrice))}</strong> : <StatusBadge value="Chưa có giá" />}
                      </td>
                      {DISCOUNTS.map((d) => {
                        const p = fare && pct(fare, d.type);
                        return (
                          <td key={d.type} style={{ textAlign: "right" }}>
                            {p ? `−${Number(p)}%` : "—"}
                          </td>
                        );
                      })}
                      <td>{fare && <StatusBadge value={fare.status} />}</td>
                      <td>
                        <div className={styles.actions}>
                          <button type="button" className={styles.btnSm} onClick={() => setEditing({ seatType: st, fare })}>
                            {fare ? "Sửa" : "+ Đặt giá"}
                          </button>
                          {fare && (
                            <button type="button" className={styles.btnSmDanger} onClick={() => setDeleting(fare)}>
                              Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormModal
        open={editing !== null}
        title={`${editing?.fare ? "Sửa" : "Đặt"} giá · ${editing?.seatType.name ?? ""}`}
        fields={FIELDS}
        initial={
          editing?.fare
            ? {
                basePrice: Number(editing.fare.basePrice),
                ...Object.fromEntries(DISCOUNTS.map((d) => [d.type, pct(editing.fare!, d.type) && Number(pct(editing.fare!, d.type))])),
              }
            : { CHILD: 25, STUDENT: 10, SENIOR: 15 }
        }
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          const body = toBody(values);
          if (editing!.fare) await api.patch(`/fares/${editing!.fare.id}`, body);
          else
            await api.post("/fares", {
              ...body,
              routeId,
              seatTypeId: editing!.seatType.id,
              effectiveFrom: new Date().toISOString(),
            });
          fares.reload();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Xóa giá?"
        danger
        confirmLabel="Xóa"
        message={`Xóa giá ${deleting?.seatType.name}. Chuyến của tuyến này sẽ không bán được loại ghế đó cho tới khi đặt giá lại.`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await api.delete(`/fares/${deleting!.id}`);
          fares.reload();
        }}
      />
    </>
  );
}
