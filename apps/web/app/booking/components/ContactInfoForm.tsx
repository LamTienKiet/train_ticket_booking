"use client";

import { ContactInfo, InvoiceInfo } from "../types/booking.types";
import styles from "../page.module.css";

interface ContactInfoFormProps {
  contactInfo: ContactInfo;
  onContactInfoChange: (info: ContactInfo) => void;
  needInvoice: boolean;
  onNeedInvoiceChange: (need: boolean) => void;
  invoiceInfo: InvoiceInfo;
  onInvoiceInfoChange: (info: InvoiceInfo) => void;
}

export default function ContactInfoForm({
  contactInfo,
  onContactInfoChange,
  needInvoice,
  onNeedInvoiceChange,
  invoiceInfo,
  onInvoiceInfoChange,
}: ContactInfoFormProps) {
  return (
    <section className={styles.cardSection}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderTitle}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <h2>Thông tin người đặt vé (Nhận vé điện tử)</h2>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.formGrid}>
          {/* Họ tên người đặt */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Họ và tên người đặt <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder="Nguyễn Văn A"
              value={contactInfo.fullName}
              onChange={(e) =>
                onContactInfoChange({ ...contactInfo, fullName: e.target.value })
              }
            />
          </div>

          {/* SĐT */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Số điện thoại di động <span className={styles.required}>*</span>
            </label>
            <input
              type="tel"
              className={styles.input}
              placeholder="0912 345 678"
              value={contactInfo.phone}
              onChange={(e) =>
                onContactInfoChange({ ...contactInfo, phone: e.target.value })
              }
            />
            <span className={styles.fieldHint}>
              Mã đặt chỗ (PNR) sẽ được gửi qua SMS
            </span>
          </div>

          {/* Email */}
          <div className={styles.formGroupFull}>
            <label className={styles.label}>
              Địa chỉ Email nhận vé điện tử <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              className={styles.input}
              placeholder="ban@email.com"
              value={contactInfo.email}
              onChange={(e) =>
                onContactInfoChange({ ...contactInfo, email: e.target.value })
              }
            />
            <span className={styles.fieldHint}>
              File vé điện tử PDF có mã QR lên tàu sẽ gửi về email này
            </span>
          </div>
        </div>

        {/* Tùy chọn xuất hóa đơn VAT */}
        <div className={styles.vatToggleBox}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={needInvoice}
              onChange={(e) => onNeedInvoiceChange(e.target.checked)}
            />
            <strong>Yêu cầu xuất hóa đơn điện tử GTGT (VAT)</strong>
          </label>

          {needInvoice && (
            <div className={styles.vatForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tên công ty / Đơn vị</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Công ty TNHH ..."
                  value={invoiceInfo.companyName}
                  onChange={(e) =>
                    onInvoiceInfoChange({
                      ...invoiceInfo,
                      companyName: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Mã số thuế (MST)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="0101234567"
                  value={invoiceInfo.taxCode}
                  onChange={(e) =>
                    onInvoiceInfoChange({
                      ...invoiceInfo,
                      taxCode: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Địa chỉ công ty</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Số nhà, đường, phường, quận..."
                  value={invoiceInfo.companyAddress}
                  onChange={(e) =>
                    onInvoiceInfoChange({
                      ...invoiceInfo,
                      companyAddress: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

