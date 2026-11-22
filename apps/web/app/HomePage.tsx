"use client";

import Link from "next/link";
import styles from "./page.module.css";
import Navbar from "./components/Navbar";

export default function HomePage() {
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
              <select className={styles.stepSelect}>
                <option value="">Chọn Ga Đi</option>
                <option value="HN">Hà Nội</option>
                <option value="SG">Sài Gòn</option>
                <option value="DN">Đà Nẵng</option>
              </select>
            </div>
            <div className={styles.bookingDivider}></div>

            <div className={styles.bookingStep}>
              <span className={styles.stepNum}>2</span>
              <select className={styles.stepSelect}>
                <option value="">Chọn Ga Đến</option>
                <option value="SG">Sài Gòn</option>
                <option value="HN">Hà Nội</option>
                <option value="DN">Đà Nẵng</option>
              </select>
            </div>
            <div className={styles.bookingDivider}></div>

            <div className={styles.bookingStep}>
              <span className={styles.stepNum}>3</span>
              <input type="date" className={styles.stepInput} />
            </div>
            <div className={styles.bookingDivider}></div>

            <div className={styles.bookingStep}>
              <span className={styles.stepNum}>4</span>
              <select className={styles.stepSelect}>
                <option value="">Loại Ghế</option>
                <option value="SEAT">Ngồi mềm điều hòa</option>
                <option value="BED">Giường nằm</option>
              </select>
            </div>

            <Link href="/trips" className={styles.fastBookBtn}>
              Tìm vé nhanh
            </Link>
          </div>
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

