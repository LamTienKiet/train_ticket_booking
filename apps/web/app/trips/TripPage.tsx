"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import Navbar from "../components/Navbar";
import { api } from "../utils/axiosClient";
import { apiErrorMessage } from "../utils/apiError";
import { fmtDate, fmtTime } from "../utils/format";

type Station = { id: string; name: string };
type Stop = {
  stopOrder: number;
  station: Station;
  arrivalTime: string | null;
  departureTime: string | null;
};
type SearchStation = Station & { scheduledTime: string };
type SearchTrip = {
  id: string;
  departureTime: string;
  arrivalTime: string;
  train: { id: string; code: string; name: string };
  route: { id: string; code: string; name: string; distanceKm: string | null };
  originStation: SearchStation | null;
  destinationStation: SearchStation | null;
  faresByType: { basePrice: number }[];
  totalAvailableSeats: number;
};

// GET /trips/search và GET /trips trả cùng dạng; đổi về dữ liệu hiển thị của một thẻ chuyến
const toTripRow = (t: SearchTrip) => {
  const dep = t.originStation?.scheduledTime ?? t.departureTime;
  const arr = t.destinationStation?.scheduledTime ?? t.arrivalTime;
  const mins = Math.round((new Date(arr).getTime() - new Date(dep).getTime()) / 60000);
  const prices = t.faresByType.map((f) => f.basePrice);
  return {
    id: t.id,
    train: t.train,
    route: t.route,
    originStation: t.originStation,
    destinationStation: t.destinationStation,
    departureTime: fmtTime(dep),
    departureDate: fmtDate(dep),
    arrivalTime: fmtTime(arr),
    arrivalDate: fmtDate(arr),
    duration: `${Math.floor(mins / 60)}h ${mins % 60}m`,
    minPrice: prices.length ? Math.min(...prices) : 0,
    availableSeats: t.totalAvailableSeats,
  };
};
type TripRow = ReturnType<typeof toTripRow>;

export default function TripPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
          Đang tải...
        </div>
      }
    >
      <TripContent />
    </Suspense>
  );
}

function TripContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");
  const isSearch = Boolean(from && to && date);
  const today = new Date().toLocaleDateString("en-CA");

  const [stations, setStations] = useState<Station[]>([]);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Form tìm kiếm ngay trên trang, điền sẵn theo URL
  const [formFrom, setFormFrom] = useState(from ?? "");
  const [formTo, setFormTo] = useState(to ?? "");
  const [formDate, setFormDate] = useState(date ?? "");
  const [formError, setFormError] = useState("");

  // Lịch trình ga dừng, tải khi khách bấm xem
  const [openStopsId, setOpenStopsId] = useState<string | null>(null);
  const [stopsByTrip, setStopsByTrip] = useState<Record<string, Stop[]>>({});
  const [stopsError, setStopsError] = useState("");

  useEffect(() => {
    api
      .get<Station[]>("/stations")
      .then(({ data }) => setStations(data))
      .catch(() => setFormError("Không tải được danh sách ga."));
  }, []);

  // Có điều kiện tìm => tìm theo chặng; không có => các chuyến sắp khởi hành
  useEffect(() => {
    const request = isSearch
      ? api.get<SearchTrip[]>("/trips/search", {
          params: { originStationId: from, destinationStationId: to, departureDate: date },
        })
      : api.get<SearchTrip[]>("/trips");
    request
      .then(({ data }) => {
        setListError("");
        setTrips(data.map(toTripRow));
      })
      .catch((e) => {
        setTrips([]);
        setListError(apiErrorMessage(e, "Không tải được danh sách chuyến tàu."));
      })
      .finally(() => setIsLoading(false));
  }, [isSearch, from, to, date]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFrom || !formTo || !formDate)
      return setFormError("Vui lòng chọn ga đi, ga đến và ngày đi.");
    if (formFrom === formTo) return setFormError("Ga đi và ga đến không được trùng nhau.");
    setFormError("");
    setIsLoading(true);
    router.push(`/trips?${new URLSearchParams({ from: formFrom, to: formTo, date: formDate })}`);
  };

  const swapStations = () => {
    setFormFrom(formTo);
    setFormTo(formFrom);
  };

  const toggleStops = (tripId: string) => {
    if (openStopsId === tripId) return setOpenStopsId(null);
    setOpenStopsId(tripId);
    setStopsError("");
    if (stopsByTrip[tripId]) return;
    api
      .get<{ stops: Stop[] }>(`/trips/${tripId}`)
      .then(({ data }) => setStopsByTrip((m) => ({ ...m, [tripId]: data.stops })))
      .catch((e) => setStopsError(apiErrorMessage(e, "Không tải được lịch trình.")));
  };

  const stationName = (id: string | null) => stations.find((s) => s.id === id)?.name ?? "";
  const heading = isSearch
    ? `${stationName(from)} → ${stationName(to)}`
    : "Chuyến tàu sắp khởi hành";
  const subheading = isSearch
    ? `Ngày đi ${new Date(`${date}T00:00:00`).toLocaleDateString("vi-VN")}`
    : "Chọn một chuyến bên dưới, hoặc tìm theo ga và ngày bạn muốn đi";

  return (
    <main className={styles.main}>
      <Navbar />

      {/* KHUNG TIÊU ĐỀ + TÌM KIẾM */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>{heading}</h1>
          <p className={styles.heroSub}>{subheading}</p>

          <form className={styles.searchPanel} onSubmit={handleSearch}>
            <label className={styles.searchField}>
              <span>Ga đi</span>
              <select value={formFrom} onChange={(e) => setFormFrom(e.target.value)}>
                <option value="">Chọn ga đi</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className={styles.swapBtn}
              onClick={swapStations}
              aria-label="Đổi chiều ga đi và ga đến"
              title="Đổi chiều"
            >
              ⇄
            </button>

            <label className={styles.searchField}>
              <span>Ga đến</span>
              <select value={formTo} onChange={(e) => setFormTo(e.target.value)}>
                <option value="">Chọn ga đến</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.searchField}>
              <span>Ngày đi</span>
              <input
                type="date"
                min={today}
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </label>

            <button type="submit" className={styles.searchBtn}>
              Tìm chuyến
            </button>
          </form>
          {formError && (
            <p role="alert" className={styles.formError}>
              {formError}
            </p>
          )}
        </div>
      </section>

      <div className={styles.container}>
        <div className={styles.trainListHeader}>
          <h2 className={styles.trainListTitle}>
            {isLoading ? "Đang tải..." : `${trips.length} chuyến tàu`}
          </h2>
          {isSearch && (
            <Link href="/trips" className={styles.clearSearch}>
              Xem tất cả chuyến sắp chạy
            </Link>
          )}
        </div>

        <div className={styles.trainsList}>
          {isLoading ? (
            [0, 1, 2].map((i) => <div key={i} className={styles.skeletonCard} aria-hidden />)
          ) : trips.length > 0 ? (
            trips.map((trip) => {
              const isSoldOut = trip.availableSeats === 0;
              const seatHref = isSearch
                ? `/trips/seats?tripId=${trip.id}&from=${from}&to=${to}`
                : `/trips/seats?tripId=${trip.id}`;
              const segStations = isSearch ? [from, to] : [];

              return (
                <article
                  key={trip.id}
                  className={`${styles.trainRowCard} ${isSoldOut ? styles.trainDisabled : ""}`}
                >
                  <div className={styles.trainMainContent}>
                    {/* MÁC TÀU */}
                    <div className={styles.trainIdentity}>
                      <span className={styles.trainCode}>{trip.train.code}</span>
                      <span className={styles.trainName}>{trip.train.name}</span>
                      <button
                        type="button"
                        className={styles.toggleStopsBtn}
                        aria-expanded={openStopsId === trip.id}
                        onClick={() => toggleStops(trip.id)}
                      >
                        {openStopsId === trip.id ? "Ẩn lịch trình ▴" : "Xem lịch trình ▾"}
                      </button>
                    </div>

                    {/* GIỜ ĐI - GIỜ ĐẾN */}
                    <div className={styles.trainTimeline}>
                      <div className={styles.timeBlock}>
                        <span className={styles.timeVal}>{trip.departureTime}</span>
                        <span className={styles.dateSub}>{trip.departureDate}</span>
                        <span className={styles.stationSub}>
                          {trip.originStation?.name || "Ga đi"}
                        </span>
                      </div>

                      <div className={styles.durationBlock}>
                        <span className={styles.durationText}>{trip.duration}</span>
                        <div className={styles.durationLine}></div>
                        <span className={styles.routeCodeText}>{trip.route.code}</span>
                      </div>

                      <div className={`${styles.timeBlock} ${styles.timeBlockEnd}`}>
                        <span className={styles.timeVal}>{trip.arrivalTime}</span>
                        <span className={styles.dateSub}>{trip.arrivalDate}</span>
                        <span className={styles.stationSub}>
                          {trip.destinationStation?.name || "Ga đến"}
                        </span>
                      </div>
                    </div>

                    {/* GIÁ & CHỖ */}
                    <div className={styles.trainSeatStatus}>
                      <span className={styles.priceFromText}>Giá vé chỉ từ</span>
                      <span className={styles.priceVal}>
                        {Number(trip.minPrice).toLocaleString("vi-VN")} đ
                      </span>
                      {isSoldOut ? (
                        <span className={styles.seatBadgeSoldOut}>Hết chỗ</span>
                      ) : (
                        <span className={styles.seatBadgeAvailable}>
                          Còn {trip.availableSeats} chỗ
                        </span>
                      )}
                    </div>

                    {/* HÀNH ĐỘNG */}
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
                        <Link href={seatHref} className={styles.btnSelectSeats}>
                          Chọn chỗ
                        </Link>
                      )}
                    </div>
                  </div>

                  {openStopsId === trip.id && (
                    <div className={styles.stopsCollapse}>
                      {stopsByTrip[trip.id] ? (
                        <ol className={styles.stopsTimeline}>
                          {stopsByTrip[trip.id].map((st, i, all) => (
                            <li
                              key={st.stopOrder}
                              className={
                                segStations.includes(st.station.id) ? styles.stopActive : undefined
                              }
                            >
                              <span className={styles.stopName}>{st.station.name}</span>
                              <span className={styles.stopTimes}>
                                {i === 0 || !st.arrivalTime
                                  ? `Xuất phát ${fmtTime(st.departureTime ?? "")}`
                                  : i === all.length - 1 || !st.departureTime
                                    ? `Đến ${fmtTime(st.arrivalTime)}`
                                    : `Đến ${fmtTime(st.arrivalTime)} · Đi ${fmtTime(st.departureTime)}`}
                              </span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <span role="status">{stopsError || "Đang tải lịch trình..."}</span>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          ) : (
            <div role="status" className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden>
                🚆
              </div>
              <p>
                {listError ||
                  (isSearch
                    ? "Không có chuyến tàu nào cho chặng và ngày đã chọn. Thử đổi ngày hoặc ga khác."
                    : "Hiện chưa có chuyến tàu nào sắp khởi hành.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
