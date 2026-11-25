import styles from "../admin.module.css";

export default function StatCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        {icon && (
          <span className={styles.statIcon} aria-hidden>
            {icon}
          </span>
        )}
      </div>
      <strong className={styles.statValue}>{value}</strong>
      {hint && <span className={styles.statHint}>{hint}</span>}
    </div>
  );
}
