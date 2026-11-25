"use client";

import { useState } from "react";
import { apiErrorMessage } from "../../utils/apiError";
import styles from "../admin.module.css";

type Props = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

export default function ConfirmDialog({ open, title, message, confirmLabel = "Xác nhận", danger, onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(apiErrorMessage(e, "Thao tác không thành công."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles.modalSm}`} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className={styles.modalHead}>
          <h2 id="confirm-title">{title}</h2>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.confirmText}>{message}</p>
          {error && (
            <div role="alert" className={styles.alertError}>
              {error}
            </div>
          )}
        </div>
        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnGhost} onClick={onClose} autoFocus>
            Không
          </button>
          <button type="button" className={danger ? styles.btnDanger : styles.btnPrimary} disabled={busy} onClick={run}>
            {busy ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
