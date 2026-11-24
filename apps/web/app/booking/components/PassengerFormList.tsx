"use client";

import { PassengerForm, PassengerType } from "../types/booking.types";
import styles from "../page.module.css";

interface PassengerFormListProps {
  passengers: PassengerForm[];
  onPassengerChange: (index: number, field: keyof PassengerForm, value: any) => void;
  calculateSeatPrice: (base: number, type: PassengerType) => number;
}

const TYPES: { value: PassengerType; label: string; note: string }[] = [
  { value: "ADULT", label: "Người lớn", note: "Giá chuẩn" },
  { value: "CHILD", label: "Trẻ em", note: "6–10 tuổi · −25%" },
  { value: "STUDENT", label: "Sinh viên", note: "HS/SV · −10%" },
  { value: "SENIOR", label: "Cao tuổi", note: "≥ 60 tuổi · −15%" },
];

const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

export default function PassengerFormList({
  passengers,
  onPassengerChange,
  calculateSeatPrice,
}: PassengerFormListProps) {
  return (
    <section className={styles.cardSection}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderTitle}>
          <span className={styles.cardIcon} aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div>
            <h2>Thông tin hành khách</h2>
            <p className={styles.cardHeaderSub}>{passengers.length} vé · mỗi ghế một hành khách</p>
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <p className={styles.guideText}>
          Nhập đúng thông tin như trên giấy tờ tùy thân (CCCD, CMND, hộ chiếu, hoặc giấy khai sinh với trẻ em).
          Nhân viên sẽ đối chiếu khi lên tàu.
        </p>

        <div className={styles.passengerList}>
          {passengers.map((p, index) => {
            const price = calculateSeatPrice(p.basePrice, p.passengerType);
            const isChild = p.passengerType === "CHILD";
            const nameId = `pax-${index}-name`;
            const docId = `pax-${index}-doc`;

            return (
              <div key={p.id} className={styles.passengerBox}>
                <div className={styles.passengerBoxHeader}>
                  <span className={styles.passengerBadge}>{index + 1}</span>
                  <div className={styles.passengerSeat}>
                    <strong>
                      Toa {p.coachNumber} · Ghế {p.seatNumber}
                    </strong>
                    <span>{p.seatType}</span>
                  </div>
                  <div className={styles.seatPriceBadge}>
                    {price !== p.basePrice && <s>{vnd(p.basePrice)}</s>}
                    <strong>{vnd(price)}</strong>
                  </div>
                </div>

                <fieldset className={styles.typeGroup}>
                  <legend className={styles.label}>
                    Đối tượng <span className={styles.required}>*</span>
                  </legend>
                  <div className={styles.typeOptions}>
                    {TYPES.map((t) => (
                      <label
                        key={t.value}
                        className={`${styles.typeOption} ${p.passengerType === t.value ? styles.typeOptionActive : ""}`}
                      >
                        <input
                          type="radio"
                          name={`pax-${index}-type`}
                          value={t.value}
                          checked={p.passengerType === t.value}
                          onChange={() => onPassengerChange(index, "passengerType", t.value)}
                        />
                        <span className={styles.typeLabel}>{t.label}</span>
                        <span className={styles.typeNote}>{t.note}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor={nameId}>
                      Họ và tên <span className={styles.required}>*</span>
                    </label>
                    <input
                      id={nameId}
                      type="text"
                      autoComplete="off"
                      className={styles.input}
                      placeholder="VD: NGUYEN VAN A"
                      value={p.fullName}
                      onChange={(e) => onPassengerChange(index, "fullName", e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor={docId}>
                      {isChild ? "Ngày sinh của bé" : "Số CCCD / CMND / Hộ chiếu"}{" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      id={docId}
                      type={isChild ? "date" : "text"}
                      autoComplete="off"
                      className={styles.input}
                      placeholder={isChild ? "" : "VD: 001203004567"}
                      value={p.idCard}
                      onChange={(e) => onPassengerChange(index, "idCard", e.target.value)}
                    />
                  </div>
                </div>

                <label className={`${styles.insuranceBox} ${p.hasInsurance ? styles.insuranceOn : ""}`}>
                  <input
                    type="checkbox"
                    checked={p.hasInsurance}
                    onChange={(e) => onPassengerChange(index, "hasInsurance", e.target.checked)}
                  />
                  <span className={styles.insuranceText}>
                    <strong>Bảo hiểm tai nạn đường sắt</strong>
                    <span className={styles.insuranceHint}>Chi trả lên đến 100.000.000 đ cho chuyến đi</span>
                  </span>
                  <span className={styles.insurancePrice}>+5.000 đ</span>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
