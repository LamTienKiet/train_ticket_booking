import styles from "../admin.module.css";

type Props = { data: { label: string; value: number }[]; formatValue: (n: number) => string; height?: number };

/** Biểu đồ cột SVG đơn giản; mỗi cột có <title> để rê chuột xem số */
export default function BarChart({ data, formatValue, height = 220 }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / Math.max(1, data.length);
  const labelEvery = Math.ceil(data.length / 10);

  return (
    <figure className={styles.chart}>
      <svg viewBox={`0 0 100 ${height / 4}`} preserveAspectRatio="none" role="img" aria-label="Biểu đồ doanh thu theo ngày">
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" x2="100" y1={(height / 4) * g} y2={(height / 4) * g} className={styles.chartGrid} />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * (height / 4 - 2);
          return (
            <rect key={d.label} x={i * w + w * 0.15} width={w * 0.7} y={height / 4 - h} height={h} rx="0.6" className={styles.chartBar}>
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className={styles.chartAxis}>
        {data.map((d, i) => (
          <span key={d.label} style={{ width: `${w}%` }}>
            {i % labelEvery === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      <figcaption className={styles.chartMax}>Cao nhất: {formatValue(max)}</figcaption>
    </figure>
  );
}
