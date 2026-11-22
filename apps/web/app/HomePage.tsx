"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Navbar from "./components/Navbar";
import { api } from "./utils/axiosClient";

type Station = { id: string; name: string; city: string };

export default function HomePage() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD theo giờ máy

  useEffect(() => {
    api
      .get<Station[]>("/stations")
      .then((res) => setStations(res.data))
      .catch(() => setError("Không tải được danh sách ga. Vui lòng thử lại."));
  }, []);

  const handleSearch = () => {
    if (!from || !to || !date) return setError("Vui lòng chọn ga đi, ga đến và ngày đi.");
    if (from === to) return setError("Ga đi và ga đến không được trùng nhau.");
    setError("");
    router.push(`/trips?${new URLSearchParams({ from, to, date })}`);
  };

  const popularRoutes = [
    {
      id: 1,
      name: "Sài Gòn ➔ Hà Nội",
      trainCode: "Tàu SE1, SE3, SE5",
      image:
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 2,
      name: "Đà Nẵng ➔ Huế",
      trainCode: "Tàu SE19, SE20",
      image:
        "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 3,
      name: "Hà Nội ➔ Sapa (Lào Cai)",
      trainCode: "Tàu SP1, SP3",
      image:
        "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 4,
      name: "Sài Gòn ➔ Nha Trang",
      trainCode: "Tàu SNT1, SNT2",
      image:
        "https://images.unsplash.com/photo-1538356111053-748a48e1acb8?auto=format&fit=crop&q=80&w=600",
    },
  ];

  return (
    <main className={styles.main}>
      {/* NAVBAR DÙNG CHUNG ĐỒNG BỘ AUTH */}
      <Navbar />

      {/* HERO BANNER SECTION */}
      <section className={styles.heroSection}>
        <div className={styles.bannerWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=2000"
            alt="Train Banner"
            className={styles.bannerImage}
          />
        </div>

        {/* QUICK BOOKING WIDGET */}
        <div className={styles.bookingWidgetWrapper}>
          <div className={styles.bookingWidget}>
            <div className={styles.bookingStep}>
              <span className={styles.stepNum}>1</span>
              <select
                className={styles.stepSelect}
                aria-label="Ga đi"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              >
                <option value="">Chọn Ga Đi</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.bookingDivider}></div>

            <div className={styles.bookingStep}>
              <span className={styles.stepNum}>2</span>
              <select
                className={styles.stepSelect}
                aria-label="Ga đến"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              >
                <option value="">Chọn Ga Đến</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.bookingDivider}></div>

            <div className={styles.bookingStep}>
              <span className={styles.stepNum}>3</span>
              <input
                type="date"
                className={styles.stepInput}
                aria-label="Ngày đi"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <button type="button" onClick={handleSearch} className={styles.fastBookBtn}>
              Tìm vé nhanh
            </button>
          </div>
          {error && (
            <p role="alert" style={{ color: "#dc2626", marginTop: 8, textAlign: "center" }}>
              {error}
            </p>
          )}
        </div>
      </section>

      {/* POPULAR ROUTES SECTION */}
      <section className={styles.popularSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.titleLine}></span>
            CHUYẾN TÀU <span className={styles.highlight}>PHỔ BIẾN</span>
          </h2>
          <div className={styles.filterTabs}>
            <button className={`${styles.filterTab} ${styles.activeFilter}`}>
              Đang chạy
            </button>
            <button className={styles.filterTab}>Sắp chạy</button>
            <button className={styles.filterTab}>Tàu cao tốc</button>
            <button className={styles.filterTab}>Toàn quốc</button>
          </div>
        </div>

        <div className={styles.routesGrid}>
          {popularRoutes.map((route) => (
            <div key={route.id} className={styles.routeCard}>
              <div className={styles.cardImageWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={route.image}
                  alt={route.name}
                  className={styles.cardImage}
                />
                <div className={styles.cardOverlay}>
                  <Link href="/trips" className={styles.bookNowBtn}>
                    Đặt Ngay
                  </Link>
                </div>
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.routeTitle}>{route.name}</h3>
                <p className={styles.routeCode}>{route.trainCode}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

