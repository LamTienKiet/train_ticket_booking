"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../utils/axiosClient";
import { apiErrorMessage } from "../../../utils/apiError";
import ConfirmDialog from "../../_components/ConfirmDialog";
import FormModal, { toPayload } from "../../_components/FormModal";
import StatusBadge from "../../_components/StatusBadge";
import styles from "../../admin.module.css";
import { COACH_KINDS, TRAIN_FIELDS } from "../fields";

type Coach = {
  id: string;
  coachNumber: number;
  coachType: "SEATING" | "SLEEPER";
  capacity: number;
  seats: { seatType: { code: string; name: string } }[];
};
type TrainDetail = { id: string; code: string; name: string; status: string; totalSeats: number; coaches: Coach[] };

export default function TrainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [train, setTrain] = useState<TrainDetail | null>(null);
  const [error, setError] = useState("");
  const [busyKind, setBusyKind] = useState("");
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState<Coach | null>(null);
  const [deletingTrain, setDeletingTrain] = useState(false);

  const load = useCallback(
    () =>
      api
        .get<TrainDetail>(`/trains/${id}`)
        .then((r) => {
          setTrain(r.data);
          setError("");
        })
        .catch((e) => setError(apiErrorMessage(e, "Không tải được thông tin tàu."))),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const addCoach = async (kind: string) => {
    setBusyKind(kind);
    setError("");
    try {
      await api.post(`/trains/${id}/coaches`, { kind });
      await load();
    } catch (e) {
      setError(apiErrorMessage(e, "Không thêm được toa."));
    } finally {
      setBusyKind("");
    }
  };

  return (
    <>
      <Link href="/admin/trains" className={styles.crumb}>
        ← Danh sách tàu
      </Link>

      {error && (
        <div role="alert" className={styles.alertError} style={{ margin: "0 0 16px" }}>
          {error}
        </div>
      )}

      {!train ? (
        !error && <p className={styles.pageSub}>Đang tải...</p>
      ) : (
        <>
          <div className={styles.pageHead}>
            <div>
              <h1 className={styles.pageTitle}>
                {train.code} · {train.name}
              </h1>
              <p className={styles.pageSub}>
                {train.coaches.length} toa · {train.totalSeats} chỗ · <StatusBadge value={train.status} />
              </p>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={() => setEditing(true)}>
                Sửa thông tin
              </button>
              <button type="button" className={styles.btnGhost} onClick={() => setDeletingTrain(true)}>
                Xóa tàu
              </button>
            </div>
          </div>

          {train.coaches.length === 0 && (
            <div className={styles.alertWarn} style={{ margin: "0 0 16px" }}>
              Tàu chưa có toa nên <b>chưa tạo chuyến được</b>. Thêm ít nhất một toa bên dưới.
            </div>
          )}

          <div className={styles.grid2}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Danh sách toa</h2>
              {train.coaches.length === 0 ? (
                <p className={styles.pageSub}>Chưa có toa.</p>
              ) : (
                <ul className={styles.list}>
                  {train.coaches.map((c) => (
                    <li key={c.id} className={styles.listItem}>
                      <div>
                        <span className={styles.cellMain}>Toa {c.coachNumber}</span>
                        <span className={styles.cellSub}>
                          {c.seats[0]?.seatType.name ?? (c.coachType === "SEATING" ? "Toa ghế" : "Toa giường")} ·{" "}
                          {c.capacity} chỗ
                        </span>
                      </div>
                      <button type="button" className={styles.btnSmDanger} onClick={() => setRemoving(c)}>
                        Xóa toa
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Thêm toa</h2>
              <p className={styles.pageSub} style={{ marginTop: -6, marginBottom: 14 }}>
                Toa mới được gắn vào cuối đoàn tàu, ghế tự sinh theo sơ đồ chuẩn.
              </p>
              <ul className={styles.list}>
                {COACH_KINDS.map((k) => (
                  <li key={k.value} className={styles.listItem}>
                    <div>
                      <span className={styles.cellMain}>{k.label}</span>
                      <span className={styles.cellSub}>{k.seats} chỗ / toa</span>
                    </div>
                    <button
                      type="button"
                      className={styles.btnSm}
                      disabled={busyKind !== ""}
                      onClick={() => addCoach(k.value)}
                    >
                      {busyKind === k.value ? "Đang thêm..." : "+ Thêm"}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <FormModal
            open={editing}
            title="Sửa thông tin tàu"
            fields={TRAIN_FIELDS}
            initial={train}
            onClose={() => setEditing(false)}
            onSubmit={async (values) => {
              await api.patch(`/trains/${id}`, toPayload(values));
              await load();
            }}
          />

          <ConfirmDialog
            open={removing !== null}
            title={`Xóa toa ${removing?.coachNumber}?`}
            danger
            confirmLabel="Xóa toa"
            message="Toa và toàn bộ ghế sẽ bị xóa. Không xóa được nếu đã có ghế trong đơn đặt vé."
            onClose={() => setRemoving(null)}
            onConfirm={async () => {
              await api.delete(`/trains/${id}/coaches/${removing!.id}`);
              await load();
            }}
          />

          <ConfirmDialog
            open={deletingTrain}
            title={`Xóa tàu ${train.code}?`}
            danger
            confirmLabel="Xóa"
            message="Nếu tàu đã có chuyến, hệ thống chuyển sang ngừng hoạt động thay vì xóa."
            onClose={() => setDeletingTrain(false)}
            onConfirm={async () => {
              const { data } = await api.delete(`/trains/${id}`);
              if (data?.deactivated) await load();
              else router.replace("/admin/trains");
            }}
          />
        </>
      )}
    </>
  );
}
