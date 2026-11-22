"use client";

import styles from "../page.module.css";
import { BookingFilterTab, BookingRecord } from "../types/ticket.types";

interface TicketStatusTabsProps {
  activeTab: BookingFilterTab;
  onTabChange: (tab: BookingFilterTab) => void;
  records: BookingRecord[];
}

export default function TicketStatusTabs({
  activeTab,
  onTabChange,
  records,
}: TicketStatusTabsProps) {
  const counts: Record<BookingFilterTab, number> = {
    ALL: records.length,
    CONFIRMED: records.filter((r) => r.status === "CONFIRMED").length,
    PENDING: records.filter((r) => r.status === "PENDING").length,
    COMPLETED: records.filter((r) => r.status === "COMPLETED").length,
    CANCELLED: records.filter((r) => r.status === "CANCELLED").length,
  };

  const tabs: { key: BookingFilterTab; label: string }[] = [
    { key: "ALL", label: "Tất cả" },
    { key: "CONFIRMED", label: "Sắp khởi hành" },
    { key: "PENDING", label: "Chờ thanh toán" },
    { key: "COMPLETED", label: "Đã hoàn thành" },
    { key: "CANCELLED", label: "Đã hủy" },
  ];

  return (
    <div className={styles.statusTabsBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`${styles.statusTabBtn} ${
              isActive ? styles.statusTabActive : ""
            }`}
          >
            <span>{tab.label}</span>
            <span className={styles.statusCountBadge}>{counts[tab.key]}</span>
          </button>
        );
      })}
    </div>
  );
}

