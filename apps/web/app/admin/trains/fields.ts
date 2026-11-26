import type { Field } from "../_components/FormModal";

export const TRAIN_FIELDS: Field[] = [
  { name: "code", label: "Mác tàu", type: "text", required: true, placeholder: "VD: SE7" },
  { name: "name", label: "Tên tàu", type: "text", required: true, placeholder: "VD: Tàu Thống Nhất SE7" },
  {
    name: "status",
    label: "Trạng thái",
    type: "select",
    options: [
      { value: "ACTIVE", label: "Hoạt động" },
      { value: "MAINTENANCE", label: "Bảo trì" },
      { value: "INACTIVE", label: "Ngừng hoạt động" },
    ],
  },
];

export const COACH_KINDS = [
  { value: "SOFT", label: "Ghế mềm điều hòa", seats: 10 },
  { value: "K4", label: "Giường nằm khoang 4", seats: 8 },
  { value: "K6", label: "Giường nằm khoang 6", seats: 12 },
] as const;
