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
    // Ngày tàu rời ga đầu tuyến: cùng mác tàu chạy hằng ngày, ngày này phân biệt các chuyến
    runDate: fmtDate(t.departureTime),
    route: t.route,
    originStation: t.originStation,
    destinationStation: t.destinationStation,
    departureTime: fmtTime(dep),
    departureDate: fmtDate(dep),
    arrivalTime: fmtTime(arr),
    arrivalDate: fmtDate(arr),
    departureTs: new Date(dep).getTime(),
    depHour: Number(fmtTime(dep).slice(0, 2)),
    durationMins: mins,
    duration: `${Math.floor(mins / 60)}h ${mins % 60}m`,
    minPrice: prices.length ? Math.min(...prices) : 0,
    availableSeats: t.totalAvailableSeats,
  };
};
type TripRow = ReturnType<typeof toTripRow>;

// Khung giờ khởi hành theo giờ Việt Nam: [từ giờ, đến trước giờ)
const TIME_SLOTS = [
  { key: "", label: "Mọi giờ", range: [0, 24] },
  { key: "morning", label: "Sáng 5h–12h", range: [5, 12] },
  { key: "afternoon", label: "Chiều 12h–18h", range: [12, 18] },
  { key: "evening", label: "Tối 18h–24h", range: [18, 24] },
  { key: "night", label: "Đêm 0h–5h", range: [0, 5] },
] as const;
const SORTS = {
  departure: { label: "Giờ đi sớm nhất", cmp: (a: TripRow, b: TripRow) => a.departureTs - b.departureTs },
  price: { label: "Giá thấp nhất", cmp: (a: TripRow, b: TripRow) => a.minPrice - b.minPrice },
  duration: { label: "Đi nhanh nhất", cmp: (a: TripRow, b: TripRow) => a.durationMins - b.durationMins },
};
type SortKey = keyof typeof SORTS;
const PAGE_SIZE = 10;

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

  // Lọc / sắp xếp / phân trang trên trình duyệt: API trả toàn bộ chuyến của chặng hoặc sắp chạy
  const [slot, setSlot] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("departure");
  const [page, setPage] = useState(1);

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
    setPage(1);
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

  const [slotFrom, slotTo] = TIME_SLOTS.find((s) => s.key === slot)!.range;
  const filtered = trips
    .filter((t) => t.depHour >= slotFrom && t.depHour < slotTo && (!availableOnly || t.availableSeats > 0))
    .sort(SORTS[sort].cmp);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageTrips = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const isFiltered = slot !== "" || availableOnly;
  // Đổi bộ lọc thì quay về trang 1
  const withReset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
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
            {isLoading
              ? "Đang tải..."
              : isFiltered
                ? `${filtered.length} / ${trips.length} chuyến tàu`
                : `${trips.length} chuyến tàu`}
          </h2>
          {isSearch && (
            <Link href="/trips" className={styles.clearSearch}>
              Xem tất cả chuyến sắp chạy
            </Link>
          )}
        </div>

        {!isLoading && trips.length > 0 && (
          <div className={styles.filterBar}>
            <div className={styles.chipGroup} role="group" aria-label="Lọc theo giờ khởi hành">
              {TIME_SLOTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={slot === s.key}
                  className={`${styles.chip} ${slot === s.key ? styles.chipActive : ""}`}
                  onClick={() => withReset(setSlot)(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className={styles.filterRight}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => withReset(setAvailableOnly)(e.target.checked)}
                />
                Chỉ chuyến còn chỗ
              </label>
              <label className={styles.sortLabel}>
                Sắp xếp
                <select value={sort} onChange={(e) => withReset(setSort)(e.target.value as SortKey)}>
                  {(Object.keys(SORTS) as SortKey[]).map((k) => (
                    <option key={k} value={k}>
                      {SORTS[k].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        <div className={styles.trainsList}>
          {isLoading ? (
            [0, 1, 2].map((i) => <div key={i} className={styles.skeletonCard} aria-hidden />)
          ) : pageTrips.length > 0 ? (
            pageTrips.map((trip) => {
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
                      <span className={styles.runDate}>Chuyến ngày {trip.runDate}</span>
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
                  (trips.length > 0
                    ? "Không có chuyến nào khớp bộ lọc. Thử chọn khung giờ khác."
                    : isSearch
                    ? "Không có chuyến tàu nào cho chặng và ngày đã chọn. Thử đổi ngày hoặc ga khác."
                    : "Hiện chưa có chuyến tàu nào sắp khởi hành.")}
              </p>
            </div>
          )}
        </div>

        {!isLoading && totalPages > 1 && (
          <nav className={styles.pager} aria-label="Phân trang chuyến tàu">
            <button
              type="button"
              className={styles.pagerBtn}
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              ‹ Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === currentPage ? "page" : undefined}
                className={`${styles.pagerBtn} ${n === currentPage ? styles.pagerActive : ""}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={styles.pagerBtn}
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Sau ›
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}
