"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { MOCK_TRIP_DETAIL } from "./mock-trip-data";
import Navbar from "../components/Navbar";

export default function TripPage() {
  // State quản lý danh sách chuyến tàu từ API
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State quản lý xem lộ trình dừng của tàu nào (mở / đóng)
  const [openStopsTrainId, setOpenStopsTrainId] = useState<string | null>(null);

  const toggleStops = (trainId: string) => {
    setOpenStopsTrainId((prev) => (prev === trainId ? null : trainId));
  };

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch("http://localhost:3001/trips");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setTrips(data);
          }
        }
      } catch (e) {
        console.error("Lỗi khi tải danh sách chuyến tàu:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrips();
  }, []);

  // Lấy thông tin tuyến đường tóm tắt
  const firstTrip = trips.length > 0 ? trips[0] : null;
  const originStationName =
    firstTrip?.route?.originStation?.name || MOCK_TRIP_DETAIL.originStation;
  const destinationStationName =
    firstTrip?.route?.destinationStation?.name ||
    MOCK_TRIP_DETAIL.destinationStation;
  const departureDate =
    firstTrip?.departureDate || MOCK_TRIP_DETAIL.departureDate;
  const distanceKm =
    firstTrip?.route?.distanceKm || MOCK_TRIP_DETAIL.distanceKm;
  const tripCode = firstTrip?.route?.code || MOCK_TRIP_DETAIL.tripCode;

  return (
    <main className={styles.main}>
      {/* NAVBAR DÙNG CHUNG ĐỒNG BỘ AUTH */}
      <Navbar />

      {/* ─────────────────────────────────────────────────────────────
          NỘI DUNG CHÍNH: DANH SÁCH CHUYẾN TÀU
          ───────────────────────────────────────────────────────────── */}
      <div className={styles.container}>
        {/* THANH TÓM TẮT HÀNH TRÌNH */}
        <section className={styles.searchSummaryBar}>
          <div className={styles.routeInfo}>
            <span className={styles.routeText}>
              {originStationName} ➔ {destinationStationName}
            </span>
            <span className={styles.routeDate}>
              Ngày đi: {departureDate}
            </span>
          </div>
          <div className={styles.routeMeta}>
            Khoảng cách: {distanceKm.toLocaleString("vi-VN")} km |
            Mã tuyến: {tripCode}
          </div>
        </section>

        {/* TIÊU ĐỀ DANH SÁCH TÀU */}
        <div className={styles.trainListHeader}>
          <h1 className={styles.trainListTitle}>
            Các đoàn tàu đảm nhận chuyến này ({trips.length > 0 ? trips.length : MOCK_TRIP_DETAIL.trains.length} đoàn tàu)
          </h1>
          <span className={styles.trainCount}>
            Chọn đoàn tàu phù hợp để chuyển sang bước chọn chỗ ngồi
          </span>
        </div>

        {/* DANH SÁCH CÁC ĐOÀN TÀU */}
        <div className={styles.trainsList}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              Đang tải danh sách các chuyến tàu thực tế...
            </div>
          ) : trips.length > 0 ? (
            trips.map((trip) => {
              const isSoldOut = trip.availableSeats === 0;
              const isStopsOpen = openStopsTrainId === trip.id;

              return (
                <div
                  key={trip.id}
                  className={`${styles.trainRowCard} ${
                    isSoldOut ? styles.trainDisabled : ""
                  }`}
                >
                  <div className={styles.trainMainContent}>
                    {/* CỘT 1: MÁC TÀU */}
                    <div className={styles.trainIdentity}>
                      <span className={styles.trainCode}>Tàu {trip.train.code}</span>
                      <span className={styles.trainName}>{trip.train.name}</span>
                    </div>

                    {/* CỘT 2: GIỜ CHẠY */}
                    <div className={styles.trainTimeline}>
                      <div className={styles.timeBlock}>
                        <span className={styles.timeVal}>{trip.departureTime}</span>
                        <span className={styles.stationSub}>
                          {trip.route.originStation?.name || "Ga đi"}
                        </span>
                      </div>

                      <div className={styles.durationBlock}>
                        <span className={styles.durationText}>{trip.duration}</span>
                        <div className={styles.durationLine}></div>
                      </div>

                      <div className={styles.timeBlock} style={{ textAlign: "right" }}>
                        <span className={styles.timeVal}>{trip.arrivalTime}</span>
                        <span className={styles.stationSub}>
                          {trip.route.destinationStation?.name || "Ga đến"}
                        </span>
                      </div>
                    </div>

                    {/* CỘT 3: SỐ GHẾ CÒN LẠI DƯỚI MỖI TÀU & GIÁ VÉ */}
                    <div className={styles.trainSeatStatus}>
                      <span className={styles.priceFromText}>Giá vé chỉ từ</span>
                      <span className={styles.priceVal}>
                        {Number(trip.minPrice).toLocaleString("vi-VN")} đ
                      </span>

                      {/* SỐ CHỖ CÒN LẠI */}
                      {isSoldOut ? (
                        <span className={styles.seatBadgeSoldOut}>
                          Hết chỗ
                        </span>
                      ) : (
                        <span className={styles.seatBadgeAvailable}>
                          Còn {trip.availableSeats} chỗ
                        </span>
                      )}
                    </div>

                    {/* CỘT 4: NÚT CHỌN CHỖ HOẶC NÚT DISABLE */}
                    <div className={styles.trainActionCol}>
                      {isSoldOut ? (
                        <button
                          type="button"
                          disabled
                          className={`${styles.btnSelectSeats} ${styles.btnDisabled}`}
                          title="Đoàn tàu này đã hết chỗ, không thể chọn"
                        >
                          Hết vé
                        </button>
                      ) : (
                        <Link
                          href={`/trips/seats?tripId=${trip.id}&train=${trip.train.code}`}
                          className={styles.btnSelectSeats}
                        >
                          Chọn chỗ
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleStops(trip.id)}
                        className={styles.toggleStopsBtn}
                      >
                        {isStopsOpen ? "Ẩn ga dừng ▲" : "Xem ga dừng ▼"}
                      </button>
                    </div>
                  </div>

                  {/* KHU VỰC BẢNG GA DỪNG ĐỖ CHI TIẾT */}
                  {isStopsOpen && (
                    <div className={styles.stopsCollapse}>
                      <table className={styles.stopsTable}>
                        <thead>
                          <tr>
                            <th>STT</th>
                            <th>Tên ga</th>
                            <th>Mã ga</th>
                            <th>Giờ đến</th>
                            <th>Giờ đi</th>
                            <th>Thời gian đỗ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trip.stops?.map((stop: any, sIndex: number) => (
                            <tr key={sIndex}>
                              <td>{sIndex + 1}</td>
                              <td>
                                <strong>{stop.stationName}</strong>
                              </td>
                              <td>{stop.stationCode}</td>
                              <td>{stop.arrivalTime}</td>
                              <td>{stop.departureTime}</td>
                              <td>{stop.stopDuration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            MOCK_TRIP_DETAIL.trains.map((train) => {
              const isSoldOut = train.availableSeats === 0;
              const isStopsOpen = openStopsTrainId === train.id;

              return (
                <div
                  key={train.id}
                  className={`${styles.trainRowCard} ${
                    isSoldOut ? styles.trainDisabled : ""
                  }`}
                >
                  <div className={styles.trainMainContent}>
                    <div className={styles.trainIdentity}>
                      <span className={styles.trainCode}>Tàu {train.trainCode}</span>
                      <span className={styles.trainName}>{train.trainName}</span>
                    </div>

                    <div className={styles.trainTimeline}>
                      <div className={styles.timeBlock}>
                        <span className={styles.timeVal}>{train.departureTime}</span>
                        <span className={styles.stationSub}>Hà Nội</span>
                      </div>

                      <div className={styles.durationBlock}>
                        <span className={styles.durationText}>{train.duration}</span>
                        <div className={styles.durationLine}></div>
                      </div>

                      <div className={styles.timeBlock} style={{ textAlign: "right" }}>
                        <span className={styles.timeVal}>{train.arrivalTime}</span>
                        <span className={styles.stationSub}>Sài Gòn</span>
                      </div>
                    </div>

                    <div className={styles.trainSeatStatus}>
                      <span className={styles.priceFromText}>Giá vé chỉ từ</span>
                      <span className={styles.priceVal}>
                        {train.minPrice.toLocaleString("vi-VN")} đ
                      </span>

                      {isSoldOut ? (
                        <span className={styles.seatBadgeSoldOut}>
                          Hết chỗ
                        </span>
                      ) : (
                        <span className={styles.seatBadgeAvailable}>
                          Còn {train.availableSeats} chỗ
                        </span>
                      )}
                    </div>

                    <div className={styles.trainActionCol}>
                      {isSoldOut ? (
                        <button
                          type="button"
                          disabled
                          className={`${styles.btnSelectSeats} ${styles.btnDisabled}`}
                        >
                          Hết vé
                        </button>
                      ) : (
                        <Link
                          href={`/trips/seats?train=${train.trainCode}`}
                          className={styles.btnSelectSeats}
                        >
                          Chọn chỗ
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleStops(train.id)}
                        className={styles.toggleStopsBtn}
                      >
                        {isStopsOpen ? "Ẩn ga dừng ▲" : "Xem ga dừng ▼"}
                      </button>
                    </div>
                  </div>

                  {isStopsOpen && (
                    <div className={styles.stopsCollapse}>
                      <table className={styles.stopsTable}>
                        <thead>
                          <tr>
                            <th>STT</th>
                            <th>Tên ga</th>
                            <th>Mã ga</th>
                            <th>Giờ đến</th>
                            <th>Giờ đi</th>
                            <th>Thời gian đỗ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MOCK_TRIP_DETAIL.stops.map((stop, sIndex) => (
                            <tr key={sIndex}>
                              <td>{sIndex + 1}</td>
                              <td>
                                <strong>{stop.stationName}</strong>
                              </td>
                              <td>{stop.stationCode}</td>
                              <td>{stop.arrivalTime}</td>
                              <td>{stop.departureTime}</td>
                              <td>{stop.stopDuration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

