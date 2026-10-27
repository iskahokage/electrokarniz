import { formatMeters } from "@/lib/format";

type Props = {
  length: number;
  oneSide: boolean;
  rows: 0 | 1;
  locale: "ru" | "ky";
  stroke?: string;
  accent?: string;
  /** Шторы закрываются и открываются по кругу — от центра или в одну сторону, как выбрано. */
  animate?: boolean;
  className?: string;
};

// Схема окна как на чертеже: рельс сверху, размерная линия, шторы показывают выбранное открытие.
// Ширина окна в схеме растёт с длиной, чтобы человек видел, что именно меняет цену.
export function WindowScheme({ length, oneSide, rows, locale, stroke = "currentColor", accent = "currentColor", animate = false, className }: Props) {
  const W = 320;
  const H = 200;
  // Рисунок ограничен 1–12 м, чтобы не вылезать за viewBox; подпись показывает настоящую длину.
  const drawn = Math.min(12, Math.max(1, length));
  const w = 120 + ((drawn - 1) / 11) * 180; // 1–12 м → 120–300 px
  const label = locale === "ky" ? `Карниздин схемасы: ${formatMeters(length, locale)}` : `Схема карниза: ${formatMeters(length, locale)}`;
  const x0 = (W - w) / 2;
  const panelW = Math.min(46, w * 0.22);
  // Штора нарисована закрытой и сжата к краю через scaleX: анимация только меняет масштаб.
  // Без анимации (и при «уменьшить движение») стоит в собранном положении.
  const closedW = oneSide ? w : w / 2;
  const panel = (originX: number, x: number) => (
    <g
      className={animate ? "ws-panel" : undefined}
      style={{ transformBox: "view-box", transformOrigin: `${originX}px 0`, transform: `scaleX(${panelW / closedW})`, ["--s0" as string]: panelW / closedW }}
    >
      <rect x={x} y={44} width={closedW} height={136} fill={stroke} fillOpacity=".08" stroke={stroke} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {Array.from({ length: 5 }, (_, i) => (
        <line key={i} x1={x + (closedW / 5) * (i + 0.5)} y1={46} x2={x + (closedW / 5) * (i + 0.5)} y2={178} stroke={stroke} strokeOpacity=".35" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label}>
      {/* размерная линия */}
      <line x1={x0} y1={18} x2={x0 + w} y2={18} stroke={accent} strokeWidth="1" />
      <line x1={x0} y1={12} x2={x0} y2={24} stroke={accent} strokeWidth="1" />
      <line x1={x0 + w} y1={12} x2={x0 + w} y2={24} stroke={accent} strokeWidth="1" />
      <rect x={W / 2 - 34} y={9} width={68} height={18} fill="var(--color-paper)" />
      <text x={W / 2} y={22} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono-x, ui-monospace, monospace)" fill={accent}>
        {formatMeters(length, locale)}
      </text>
      {/* рельс */}
      <line x1={x0 - 6} y1={40} x2={x0 + w + 6} y2={40} stroke={stroke} strokeWidth="2" />
      {rows === 1 && <line x1={x0 - 6} y1={45} x2={x0 + w + 6} y2={45} stroke={stroke} strokeWidth="1" strokeOpacity=".6" />}
      {/* окно */}
      <rect x={x0 + 14} y={56} width={w - 28} height={118} fill="none" stroke={stroke} strokeOpacity=".5" strokeWidth="1" />
      <line x1={W / 2} y1={56} x2={W / 2} y2={174} stroke={stroke} strokeOpacity=".3" strokeWidth="1" />
      {/* шторы: собраны к краям, при animate закрываются к центру или к дальнему краю */}
      <g key={oneSide ? "side" : "center"}>
        {panel(x0, x0)}
        {!oneSide && panel(x0 + w, x0 + w / 2)}
      </g>
      {/* мотор */}
      <rect x={x0 + w - 22} y={34} width={18} height={12} fill={accent} />
    </svg>
  );
}
