"use client";

interface QrCodeGraphicProps {
  size?: number;
  seed?: string;
}

/**
 * Hiển thị hình ảnh mã QR giả lập dạng vector SVG sắc nét
 */
export default function QrCodeGraphic({
  size = 180,
  seed = "LIONRAIL",
}: QrCodeGraphicProps) {
  // Tạo ma trận điểm giả lập dựa trên seed để mỗi vé có hình QR hơi khác nhau
  const cells: { x: number; y: number }[] = [];
  const grid = 21;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const isFinderZone = (r: number, c: number) => {
    if (r < 8 && c < 8) return true;
    if (r < 8 && c >= grid - 8) return true;
    if (r >= grid - 8 && c < 8) return true;
    return false;
  };

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      if (isFinderZone(r, c)) continue;
      const val = ((r * 17 + c * 31 + hash) ^ (r * c)) % 5;
      if (val === 0 || val === 2) {
        cells.push({ x: c, y: r });
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${grid + 2} ${grid + 2}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", backgroundColor: "#ffffff" }}
      aria-label={`Mã QR ${seed}`}
    >
      <rect width={grid + 2} height={grid + 2} fill="#ffffff" />

      <g transform="translate(1, 1)">
        {/* 3 ô định vị góc chuẩn QR */}
        {[
          { x: 0, y: 0 },
          { x: grid - 7, y: 0 },
          { x: 0, y: grid - 7 },
        ].map((pos, idx) => (
          <g key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
            <rect width="7" height="7" rx="0.8" fill="#0f172a" />
            <rect x="1" y="1" width="5" height="5" rx="0.4" fill="#ffffff" />
            <rect x="2" y="2" width="3" height="3" rx="0.3" fill="#0f172a" />
          </g>
        ))}

        {/* Các ô dữ liệu ma trận */}
        {cells.map((cell, idx) => (
          <rect
            key={idx}
            x={cell.x}
            y={cell.y}
            width="0.92"
            height="0.92"
            rx="0.15"
            fill="#0f172a"
          />
        ))}
      </g>
    </svg>
  );
}

