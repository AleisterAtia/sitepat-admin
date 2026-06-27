// Ikon SVG inline (outline) — tanpa dependensi eksternal. Ukuran diatur lewat className
// pemanggil (mis. "h-5 w-5"); warna mengikuti currentColor.

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const common = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const IconHome = (p: P) => (
  <svg {...common} {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...common} {...p}>
    <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
    <circle cx="9" cy="7" r="3.2" />
    <path d="M22 19v-1a4 4 0 0 0-3-3.85" />
    <path d="M16 3.5A4 4 0 0 1 16 11" />
  </svg>
);

export const IconLayers = (p: P) => (
  <svg {...common} {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 16 9 5 9-5" />
  </svg>
);

export const IconReceipt = (p: P) => (
  <svg {...common} {...p}>
    <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3Z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

export const IconBadge = (p: P) => (
  <svg {...common} {...p}>
    <circle cx="12" cy="9" r="3.2" />
    <path d="M6 21v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
    <path d="M9 3h6l-1 3h-4l-1-3Z" />
  </svg>
);

export const IconLogout = (p: P) => (
  <svg {...common} {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l-5-5 5-5" />
    <path d="M5 12h12" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...common} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...common} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const IconMenu = (p: P) => (
  <svg {...common} {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...common} {...p}>
    <path d="m20 6-11 11-5-5" />
  </svg>
);

export const IconChevronRight = (p: P) => (
  <svg {...common} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...common} {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
