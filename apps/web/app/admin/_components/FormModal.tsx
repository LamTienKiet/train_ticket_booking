"use client";

import { useEffect, useState } from "react";
import { apiErrorMessage } from "../../utils/apiError";
import styles from "../admin.module.css";

export type Field = {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "datetime" | "textarea";
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  placeholder?: string;
};

export type FormValues = Record<string, string>;

type Props = {
  open: boolean;
  title: string;
  fields: Field[];
  initial?: Record<string, unknown>;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
  /** Nội dung phụ dưới form, nhận giá trị đang nhập (VD: xem trước giờ đến) */
  footer?: (values: FormValues) => React.ReactNode;
};

const toInput = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default function FormModal(props: Props) {
  // Đóng là gỡ hẳn form, mở lại thì khởi tạo giá trị mới từ `initial`
  return props.open ? <FormBody {...props} /> : null;
}

function FormBody({ title, fields, initial, submitLabel = "Lưu", onClose, onSubmit, footer }: Props) {
  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(fields.map((f) => [f.name, toInput(initial?.[f.name])])),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Không lưu được. Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="form-modal-title" onSubmit={submit}>
        <div className={styles.modalHead}>
          <h2 id="form-modal-title">{title}</h2>
          <button type="button" className={styles.iconBtn} aria-label="Đóng" onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {fields.map((f, i) => {
            const id = `f-${f.name}`;
            const common = {
              id,
              name: f.name,
              required: f.required,
              value: values[f.name] ?? "",
              className: styles.input,
              autoFocus: i === 0,
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setValues((v) => ({ ...v, [f.name]: e.target.value })),
            };
            return (
              <div key={f.name} className={styles.field}>
                <label htmlFor={id}>
                  {f.label} {f.required && <span className={styles.req}>*</span>}
                </label>
                {f.type === "select" ? (
                  <select {...common}>
                    <option value="">— Chọn —</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea {...common} rows={3} placeholder={f.placeholder} />
                ) : (
                  <input
                    {...common}
                    type={f.type === "datetime" ? "datetime-local" : f.type}
                    placeholder={f.placeholder}
                    step={f.type === "number" ? "any" : undefined}
                  />
                )}
                {f.hint && <span className={styles.hint}>{f.hint}</span>}
              </div>
            );
          })}
          {footer?.(values)}
          {error && (
            <div role="alert" className={styles.alertError}>
              {error}
            </div>
          )}
        </div>

        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? "Đang lưu..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
