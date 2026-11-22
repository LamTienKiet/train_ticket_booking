"use client";

import { PassengerForm, PassengerType } from "../types/booking.types";
import styles from "../page.module.css";

interface PassengerFormListProps {
  passengers: PassengerForm[];
  onPassengerChange: (
    index: number,
    field: keyof PassengerForm,
    value: any
  ) => void;
  calculateSeatPrice: (base: number, type: PassengerType) => number;
}

export default function PassengerFormList({
  passengers,
  onPassengerChange,
  calculateSeatPrice,
}: PassengerFormListProps) {
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <h2>Thông tin hành khách đi tàu</h2>
        </div>
        <span className={styles.cardHeaderSub}>
          Tổng cộng {passengers.length} vé ({passengers.length} chỗ ngồi)
        </span>
      </div>

      <div className={styles.cardBody}>
        <p className={styles.guideText}>
          ⚠️ Vui lòng nhập chính xác thông tin theo giấy tờ tùy thân (CCCD, CMND,
          Hộ chiếu hoặc Giấy khai sinh cho trẻ em) để đảm bảo quyền lợi khi lên
          tàu.
        </p>

        <div className={styles.passengerList}>
          {passengers.map((passenger, index) => {
            const currentPrice = calculateSeatPrice(
              passenger.basePrice,
              passenger.passengerType
            );

            return (
              <div key={passenger.id} className={styles.passengerBox}>
                <div className={styles.passengerBoxHeader}>
                  <div className={styles.passengerBadge}>
                    Hành khách {index + 1}
                  </div>
                  <div className={styles.seatBadgeInfo}>
                    {passenger.seatLabel} ({passenger.seatType})
                  </div>
                  <div className={styles.seatPriceBadge}>
                    {currentPrice.toLocaleString("vi-VN")} đ
                  </div>
                </div>

                <div className={styles.formGrid}>
                  {/* Họ và tên */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Họ và tên hành khách{" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="VÍ DỤ: NGUYEN VAN A"
                      value={passenger.fullName}
                      onChange={(e) =>
                        onPassengerChange(
                          index,
                          "fullName",
                          e.target.value.toUpperCase()
                        )
                      }
                    />
                  </div>

                  {/* Đối tượng hành khách */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Đối tượng hành khách{" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.select}
                      value={passenger.passengerType}
                      onChange={(e) =>
                        onPassengerChange(
                          index,
                          "passengerType",
                          e.target.value as PassengerType
                        )
                      }
                    >
                      <option value="ADULT">Người lớn (Tiêu chuẩn)</option>
                      <option value="CHILD">
                        Trẻ em (6 - 10 tuổi) - Giảm 25%
                      </option>
                      <option value="STUDENT">
                        Học sinh / Sinh viên - Giảm 10%
                      </option>
                      <option value="SENIOR">
                        Người cao tuổi (≥ 60 tuổi) - Giảm 15%
                      </option>
                    </select>
                  </div>

                  {/* Số CCCD / CMND hoặc Ngày sinh */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      {passenger.passengerType === "CHILD"
                        ? "Ngày sinh của bé (dd/mm/yyyy)"
                        : "Số CCCD / CMND / Hộ chiếu"}{" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type={
                        passenger.passengerType === "CHILD" ? "date" : "text"
                      }
                      className={styles.input}
                      placeholder={
                        passenger.passengerType === "CHILD"
                          ? ""
                          : "Nhập 12 số CCCD"
                      }
                      value={passenger.idCard}
                      onChange={(e) =>
                        onPassengerChange(index, "idCard", e.target.value)
                      }
                    />
                  </div>

                  {/* Tùy chọn bảo hiểm */}
                  <div className={styles.insuranceBox}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={passenger.hasInsurance}
                        onChange={(e) =>
                          onPassengerChange(
                            index,
                            "hasInsurance",
                            e.target.checked
                          )
                        }
                      />
                      <span>Bảo hiểm tai nạn đường sắt nâng cao (+5.000 đ)</span>
                    </label>
                    <span className={styles.insuranceHint}>
                      Bảo hiểm trách nhiệm chuyến đi lên đến 100.000.000 đ
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

