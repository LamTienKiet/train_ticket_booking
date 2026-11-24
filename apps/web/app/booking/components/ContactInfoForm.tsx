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
          <span className={styles.cardIcon} aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </span>
          <div>
            <h2>Người đặt vé</h2>
            <p className={styles.cardHeaderSub}>Vé điện tử và mã đặt chỗ sẽ gửi về thông tin này</p>
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="contact-name">
              Họ và tên <span className={styles.required}>*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              autoComplete="name"
              className={styles.input}
              placeholder="Nguyễn Văn A"
              value={contactInfo.fullName}
              onChange={(e) => onContactInfoChange({ ...contactInfo, fullName: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="contact-phone">
              Số điện thoại <span className={styles.required}>*</span>
            </label>
            <input
              id="contact-phone"
              type="tel"
              autoComplete="tel"
              className={styles.input}
              placeholder="0912 345 678"
              value={contactInfo.phone}
              onChange={(e) => onContactInfoChange({ ...contactInfo, phone: e.target.value })}
            />
            <span className={styles.fieldHint}>Dùng để tra cứu đơn và nhận mã đặt chỗ (PNR)</span>
          </div>

          <div className={styles.formGroupFull}>
            <label className={styles.label} htmlFor="contact-email">
              Email nhận vé <span className={styles.required}>*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              autoComplete="email"
              className={styles.input}
              placeholder="ban@email.com"
              value={contactInfo.email}
              onChange={(e) => onContactInfoChange({ ...contactInfo, email: e.target.value })}
            />
            <span className={styles.fieldHint}>Vé điện tử có mã QR lên tàu sẽ được gửi về email này</span>
          </div>
        </div>

        <div className={styles.vatToggleBox}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={needInvoice} onChange={(e) => onNeedInvoiceChange(e.target.checked)} />
            <span>
              <strong>Xuất hóa đơn điện tử (VAT)</strong>
              <span className={styles.fieldHint}> — dành cho công ty / đơn vị</span>
            </span>
          </label>

          {needInvoice && (
            <div className={styles.vatForm}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="vat-company">Tên công ty / đơn vị</label>
                <input
                  id="vat-company"
                  type="text"
                  autoComplete="organization"
                  className={styles.input}
                  placeholder="Công ty TNHH ..."
                  value={invoiceInfo.companyName}
                  onChange={(e) => onInvoiceInfoChange({ ...invoiceInfo, companyName: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="vat-tax">Mã số thuế</label>
                <input
                  id="vat-tax"
                  type="text"
                  className={styles.input}
                  placeholder="0101234567"
                  value={invoiceInfo.taxCode}
                  onChange={(e) => onInvoiceInfoChange({ ...invoiceInfo, taxCode: e.target.value })}
                />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.label} htmlFor="vat-address">Địa chỉ công ty</label>
                <input
                  id="vat-address"
                  type="text"
                  autoComplete="street-address"
                  className={styles.input}
                  placeholder="Số nhà, đường, phường, quận..."
                  value={invoiceInfo.companyAddress}
                  onChange={(e) => onInvoiceInfoChange({ ...invoiceInfo, companyAddress: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
