"use client";

import { useState } from "react";
import { api } from "../../utils/axiosClient";
import { fmtDate } from "../../utils/format";
import { authService } from "../../services/auth.service";
import ConfirmDialog from "../_components/ConfirmDialog";
import DataTable, { type Column } from "../_components/DataTable";
import FormModal, { type Field } from "../_components/FormModal";
import StatusBadge from "../_components/StatusBadge";
import { useAdminList } from "../_components/useAdminList";
import styles from "../admin.module.css";

type Account = {
  id: string;
  username: string;
  email: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "BANNED";
  createdAt: string;
  bookingsCount: number;
  user: { fullName: string | null; phone: string | null } | null;
};

const ROLE_LABEL: Record<string, string> = { CUSTOMER: "Khách hàng", STAFF: "Nhân viên", ADMIN: "Quản trị" };
const ROLE_FIELDS: Field[] = [
  {
    name: "role",
    label: "Vai trò",
    type: "select",
    required: true,
    options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })),
    hint: "Quản trị có toàn quyền trang admin",
  },
];
const LIMIT = 20;

export default function UsersPage() {
  const me = authService.getCurrentUser();
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [changingRole, setChangingRole] = useState<Account | null>(null);
  const [toggling, setToggling] = useState<Account | null>(null);
  const list = useAdminList<Account>("/users", { keyword, role, status, page, limit: LIMIT });

  const isMe = (a: Account) => a.id === me?.accountId;

  const columns: Column<Account>[] = [
    {
      key: "name",
      label: "Người dùng",
      render: (a) => (
        <>
          <span className={styles.cellMain}>
            {a.user?.fullName || a.username} {isMe(a) && <span className={styles.cellSub} style={{ display: "inline" }}>(bạn)</span>}
          </span>
          <span className={styles.cellSub}>@{a.username}</span>
        </>
      ),
    },
    {
      key: "contact",
      label: "Liên hệ",
      render: (a) => (
        <>
          {a.email}
          <span className={styles.cellSub}>{a.user?.phone || "—"}</span>
        </>
      ),
    },
    { key: "role", label: "Vai trò", render: (a) => ROLE_LABEL[a.role] },
    { key: "bookings", label: "Số đơn", align: "right", render: (a) => a.bookingsCount },
    { key: "status", label: "Trạng thái", render: (a) => <StatusBadge value={a.status} /> },
    { key: "created", label: "Ngày tạo", render: (a) => fmtDate(a.createdAt) },
    {
      key: "actions",
      label: "",
      align: "right",
      // Không cho tự khóa / tự hạ quyền chính mình
      render: (a) =>
        isMe(a) ? null : (
          <div className={styles.actions}>
            <button type="button" className={styles.btnSm} onClick={() => setChangingRole(a)}>
              Đổi vai trò
            </button>
            <button type="button" className={a.status === "BANNED" ? styles.btnSm : styles.btnSmDanger} onClick={() => setToggling(a)}>
              {a.status === "BANNED" ? "Mở khóa" : "Khóa"}
            </button>
          </div>
        ),
    },
  ];

  const filter = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    set(e.target.value);
    setPage(1);
  };

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Người dùng</h1>
          <p className={styles.pageSub}>Khóa tài khoản vi phạm hoặc cấp quyền nhân viên / quản trị.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(a) => a.id}
        loading={list.loading}
        error={list.error}
        total={list.total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        emptyText="Không có người dùng nào."
        toolbar={
          <>
            <input
              className={`${styles.input} ${styles.search}`}
              placeholder="Tìm tên, tài khoản, email, SĐT..."
              aria-label="Tìm người dùng"
              value={keyword}
              onChange={filter(setKeyword)}
            />
            <select className={styles.input} style={{ width: 160 }} aria-label="Lọc vai trò" value={role} onChange={filter(setRole)}>
              <option value="">Mọi vai trò</option>
              {Object.entries(ROLE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select className={styles.input} style={{ width: 170 }} aria-label="Lọc trạng thái" value={status} onChange={filter(setStatus)}>
              <option value="">Mọi trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="BANNED">Đã khóa</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
          </>
        }
      />

      <FormModal
        open={changingRole !== null}
        title={`Đổi vai trò · ${changingRole?.username ?? ""}`}
        fields={ROLE_FIELDS}
        initial={changingRole ?? undefined}
        onClose={() => setChangingRole(null)}
        onSubmit={async (v) => {
          await api.patch(`/users/${changingRole!.id}`, { role: v.role });
          list.reload();
        }}
      />

      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.status === "BANNED" ? "Mở khóa tài khoản?" : "Khóa tài khoản?"}
        danger={toggling?.status !== "BANNED"}
        confirmLabel={toggling?.status === "BANNED" ? "Mở khóa" : "Khóa"}
        message={
          toggling?.status === "BANNED"
            ? `${toggling.username} sẽ đăng nhập lại được.`
            : `${toggling?.username} sẽ không đăng nhập được nữa. Đơn đã đặt vẫn giữ nguyên.`
        }
        onClose={() => setToggling(null)}
        onConfirm={async () => {
          await api.patch(`/users/${toggling!.id}`, { status: toggling!.status === "BANNED" ? "ACTIVE" : "BANNED" });
          list.reload();
        }}
      />
    </>
  );
}
