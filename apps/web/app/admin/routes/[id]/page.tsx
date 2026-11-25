"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../utils/axiosClient";
import { apiErrorMessage } from "../../../utils/apiError";
import ConfirmDialog from "../../_components/ConfirmDialog";
import FormModal, { toPayload, type Field } from "../../_components/FormModal";
import StatusBadge from "../../_components/StatusBadge";
import { fmtMinutes, useStations } from "../../_components/useStations";
import styles from "../../admin.module.css";

type Stop = {
  stationId: string;
  stopOrder: number;
  arrivalOffsetMinutes: number;
  departureOffsetMinutes: number;
  distanceFromOriginKm: string | null;
  station: { name: string; code: string };
};
type RouteDetail = {
  id: string;
  code: string;
  name: string;
  status: string;
  distanceKm: string | null;
  estimatedDurationMins: number | null;
  originStationId: string;
  destinationStationId: string;
  originStation: { name: string };
  destinationStation: { name: string };
  routeStations: Stop[];
  _count: { trips: number; fareRules: number };
};

const NUMS = ["stopOrder", "arrivalOffsetMinutes", "departureOffsetMinutes", "distanceFromOriginKm"];

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const stations = useStations();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [error, setError] = useState("");
  const [addingStop, setAddingStop] = useState(false);
  const [removingStop, setRemovingStop] = useState<Stop | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    () =>
      api
        .get<RouteDetail>(`/routes/${id}`)
        .then((r) => {
          setRoute(r.data);
          setError("");
        })
        .catch((e) => setError(apiErrorMessage(e, "Không tải được tuyến."))),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const stationOptions = stations.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));
  const stopFields: Field[] = [
    { name: "stationId", label: "Ga", type: "select", required: true, options: stationOptions },
    { name: "stopOrder", label: "Thứ tự dừng", type: "number", required: true, hint: "1 = ga đầu tuyến" },
    { name: "arrivalOffsetMinutes", label: "Đến sau (phút từ giờ xuất phát)", type: "number", required: true },
    { name: "departureOffsetMinutes", label: "Rời ga sau (phút từ giờ xuất phát)", type: "number", required: true, hint: "Bằng hoặc lớn hơn giờ đến" },
    { name: "distanceFromOriginKm", label: "Km từ ga đầu", type: "number", hint: "Dùng để tính giá theo chặng" },
  ];
  const routeFields: Field[] = [
    { name: "name", label: "Tên tuyến", type: "text", required: true },
    { name: "distanceKm", label: "Chiều dài (km)", type: "number" },
    { name: "estimatedDurationMins", label: "Thời gian chạy dự kiến (phút)", type: "number" },
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

  // Gợi ý ga dừng tiếp theo: chưa có ga nào thì là ga đầu tuyến ở phút 0, km 0
  const nextStop = (r: RouteDetail) => {
    const last = r.routeStations[r.routeStations.length - 1];
    return last
      ? { stopOrder: last.stopOrder + 1 }
      : { stationId: r.originStationId, stopOrder: 1, arrivalOffsetMinutes: 0, departureOffsetMinutes: 0, distanceFromOriginKm: 0 };
  };

  const stops = route?.routeStations ?? [];
  const lastIsDestination = route && stops.length > 0 && stops[stops.length - 1].stationId === route.destinationStationId;

  return (
    <>
      <Link href="/admin/routes" className={styles.crumb}>
        ← Danh sách tuyến
      </Link>

      {error && (
        <div role="alert" className={styles.alertError} style={{ margin: "0 0 16px" }}>
          {error}
        </div>
      )}

      {route && (
        <>
          <div className={styles.pageHead}>
            <div>
              <h1 className={styles.pageTitle}>
                {route.code} · {route.name}
              </h1>
              <p className={styles.pageSub}>
                {route.originStation.name} → {route.destinationStation.name}
                {route.distanceKm && ` · ${Number(route.distanceKm).toLocaleString("vi-VN")} km`} · {route._count.trips} chuyến ·{" "}
                <StatusBadge value={route.status} />
              </p>
            </div>
            <div className={styles.actions}>
              <Link href={`/admin/fares?routeId=${route.id}`} className={styles.btnGhost} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                Bảng giá ({route._count.fareRules})
              </Link>
              <button type="button" className={styles.btnGhost} onClick={() => setEditing(true)}>
                Sửa
              </button>
              <button type="button" className={styles.btnGhost} onClick={() => setDeleting(true)}>
                Xóa tuyến
              </button>
            </div>
          </div>

          {stops.length < 2 && (
            <div className={styles.alertWarn} style={{ margin: "0 0 16px" }}>
              Tuyến cần ít nhất <b>2 ga dừng</b> (ga đầu và ga cuối) mới tạo chuyến được.
            </div>
          )}
          {stops.length >= 2 && !lastIsDestination && (
            <div className={styles.alertWarn} style={{ margin: "0 0 16px" }}>
              Ga dừng cuối cùng chưa phải ga cuối tuyến ({route.destinationStation.name}).
            </div>
          )}

          <section className={styles.tableCard}>
            <div className={styles.toolbar} style={{ justifyContent: "space-between" }}>
              <strong>Ga dừng theo thứ tự</strong>
              <button type="button" className={styles.btnPrimary} onClick={() => setAddingStop(true)}>
                + Thêm ga dừng
              </button>
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ga</th>
                    <th>Đến sau</th>
                    <th>Rời ga sau</th>
                    <th style={{ textAlign: "right" }}>Km từ ga đầu</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {stops.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyCell}>
                        Chưa có ga dừng.
                      </td>
                    </tr>
                  ) : (
                    stops.map((s, i) => (
                      <tr key={s.stationId}>
                        <td>{s.stopOrder}</td>
                        <td>
                          <span className={styles.cellMain}>{s.station.name}</span>
                          <span className={styles.cellSub}>{s.station.code}</span>
                        </td>
                        <td>{i === 0 ? "—" : fmtMinutes(s.arrivalOffsetMinutes)}</td>
                        <td>
                          {i === stops.length - 1 ? "—" : fmtMinutes(s.departureOffsetMinutes)}
                          {i > 0 && i < stops.length - 1 && s.departureOffsetMinutes > s.arrivalOffsetMinutes && (
                            <span className={styles.cellSub}>dừng {s.departureOffsetMinutes - s.arrivalOffsetMinutes} phút</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {s.distanceFromOriginKm !== null ? Number(s.distanceFromOriginKm).toLocaleString("vi-VN") : "—"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button type="button" className={styles.btnSmDanger} onClick={() => setRemovingStop(s)}>
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <FormModal
            open={addingStop}
            title="Thêm ga dừng"
            fields={stopFields}
            initial={nextStop(route)}
            submitLabel="Thêm"
            onClose={() => setAddingStop(false)}
            onSubmit={async (values) => {
              await api.post(`/routes/${id}/stations`, toPayload(values, NUMS));
              await load();
            }}
          />

          <FormModal
            open={editing}
            title="Sửa tuyến"
            fields={routeFields}
            initial={route}
            onClose={() => setEditing(false)}
            onSubmit={async (values) => {
              await api.patch(`/routes/${id}`, toPayload(values, ["distanceKm", "estimatedDurationMins"]));
              await load();
            }}
          />

          <ConfirmDialog
            open={removingStop !== null}
            title="Xóa ga dừng?"
            danger
            confirmLabel="Xóa"
            message={
              <>
                Bỏ <b>{removingStop?.station.name}</b> khỏi tuyến. Chuyến đã tạo trước đó không bị ảnh hưởng.
              </>
            }
            onClose={() => setRemovingStop(null)}
            onConfirm={async () => {
              await api.delete(`/routes/${id}/stations/${removingStop!.stationId}`);
              await load();
            }}
          />

          <ConfirmDialog
            open={deleting}
            title={`Xóa tuyến ${route.code}?`}
            danger
            confirmLabel="Xóa"
            message="Nếu tuyến đã có chuyến, hệ thống chuyển sang ngừng hoạt động thay vì xóa. Bảng giá của tuyến cũng bị xóa."
            onClose={() => setDeleting(false)}
            onConfirm={async () => {
              const { data } = await api.delete(`/routes/${id}`);
              if (data?.deactivated) await load();
              else router.replace("/admin/routes");
            }}
          />
        </>
      )}
    </>
  );
}
