import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export const palette = {
  green: '#246B45',
  lightGreen: '#7FB394',
  blue: '#3B82B8',
  amber: '#D99A32',
  red: '#D9534F',
  grey: '#A0AEC0',
}

export const seriesColors = [palette.green, palette.lightGreen, palette.blue, palette.amber, palette.grey, palette.red]

const GRID = '#E5EAE6'
const AXIS = { stroke: GRID, tickLine: false } as const

interface TooltipEntry {
  name?: string | number
  value?: number | string
  color?: string
  payload?: { color?: string }
}

interface TooltipProps {
  active?: boolean
  payload?: readonly TooltipEntry[]
  label?: string | number
  formatter?: (v: number, name: string) => string
}

function ChartTooltip({ active, payload, label, formatter }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs">
      {label !== undefined && label !== '' && <p className="mb-1 font-medium text-ink">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color ?? p.payload?.color }} />
          {p.name}:
          <span className="font-medium text-ink tnum">
            {formatter ? formatter(Number(p.value), String(p.name)) : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

export interface Series {
  key: string
  name: string
  color?: string
}

export function ChartLegend({ items }: { items: { name: string; color: string; value?: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: i.color }} />
          {i.name}
          {i.value && <span className="font-medium text-ink tnum">{i.value}</span>}
        </li>
      ))}
    </ul>
  )
}

interface CartesianProps {
  data: Record<string, string | number>[]
  xKey: string
  series: Series[]
  height?: number
  formatter?: (v: number, name: string) => string
  axisFormatter?: (v: number) => string
}

export function LineSeries({ data, xKey, series, height = 260, formatter, axisFormatter }: CartesianProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} {...AXIS} />
          <YAxis {...AXIS} axisLine={false} width={48} tickFormatter={axisFormatter} />
          <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ stroke: GRID }} />
          {series.map((s, i) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.name}
              type="monotone"
              stroke={s.color ?? seriesColors[i]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: s.color ?? seriesColors[i] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ColumnSeries({ data, xKey, series, height = 260, formatter, axisFormatter }: CartesianProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} {...AXIS} />
          <YAxis {...AXIS} axisLine={false} width={48} tickFormatter={axisFormatter} />
          <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ fill: '#F1F5F2' }} />
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color ?? seriesColors[i]} radius={[3, 3, 0, 0]} maxBarSize={36} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HorizontalBars({
  data,
  height,
  formatter,
  color = palette.green,
  valueName = 'Value',
}: {
  data: { name: string; value: number }[]
  height?: number
  formatter?: (v: number) => string
  color?: string
  valueName?: string
}) {
  const h = height ?? Math.max(160, data.length * 44 + 24)
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" {...AXIS} axisLine={false} tickFormatter={formatter} />
          <YAxis type="category" dataKey="name" {...AXIS} width={112} axisLine={false} />
          <Tooltip content={<ChartTooltip formatter={(v) => (formatter ? formatter(v) : String(v))} />} cursor={{ fill: '#F1F5F2' }} />
          <Bar dataKey="value" name={valueName} fill={color} radius={[0, 3, 3, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Donut({
  data,
  centerValue,
  centerLabel,
  height = 190,
  formatter,
}: {
  data: { name: string; value: number; color: string }[]
  centerValue?: string
  centerLabel?: string
  height?: number
  formatter?: (v: number) => string
}) {
  const shown = data.filter((d) => d.value > 0)
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip formatter={(v) => (formatter ? formatter(v) : String(v))} />} />
          <Pie data={shown} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={2} stroke="none">
            {shown.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tnum">{centerValue}</span>
          {centerLabel && <span className="text-xs text-muted">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}
