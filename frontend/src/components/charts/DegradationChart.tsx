// BatteryX AI – Degradation Chart
import React from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Area, AreaChart
} from 'recharts';

interface DegradationChartProps {
  currentSOH: number;
  projections?: Record<string, number>;
  annualRate?: number;
  small?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#FFFFFF', border: '1px solid var(--color-border)',
        borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.8125rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: '#66CC99', fontWeight: 600 }}>
            SOH: {p.value?.toFixed(1)}%
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DegradationChart({ currentSOH, projections, annualRate, small }: DegradationChartProps) {
  const data = [
    { month: 'Now', soh: currentSOH, type: 'actual' },
    ...(projections ? [
      { month: '6 months', soh: projections['6'] ?? currentSOH - (annualRate ?? 2.5) * 0.5, type: 'projected' },
      { month: '12 months', soh: projections['12'] ?? currentSOH - (annualRate ?? 2.5), type: 'projected' },
      { month: '24 months', soh: projections['24'] ?? currentSOH - (annualRate ?? 2.5) * 2, type: 'projected' },
      { month: '36 months', soh: projections['36'] ?? currentSOH - (annualRate ?? 2.5) * 3, type: 'projected' },
    ] : [
      { month: '6 months', soh: Math.max(currentSOH - (annualRate ?? 2.5) * 0.5, 50), type: 'projected' },
      { month: '12 months', soh: Math.max(currentSOH - (annualRate ?? 2.5), 50), type: 'projected' },
      { month: '24 months', soh: Math.max(currentSOH - (annualRate ?? 2.5) * 2, 50), type: 'projected' },
      { month: '36 months', soh: Math.max(currentSOH - (annualRate ?? 2.5) * 3, 50), type: 'projected' },
    ]),
  ];

  return (
    <div>
      <div className="demo-banner" style={{ marginBottom: '0.75rem', fontSize: '0.6875rem' }}>
        ⚠ DEMO DATA — Degradation projections are prototype estimates based on linear extrapolation. Not scientifically validated.
      </div>
      <ResponsiveContainer width="100%" height={small ? 160 : 240}>
        <AreaChart data={data} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="sohGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#66CC99" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#66CC99" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEB" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[50, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke="#FF633D" strokeDasharray="4 4" label={{ value: 'EOL (70%)', fill: '#FF633D', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={80} stroke="#FBC000" strokeDasharray="3 3" strokeOpacity={0.6} />
          <Area
            type="monotone" dataKey="soh" stroke="#66CC99" strokeWidth={2.5}
            fill="url(#sohGrad)" dot={(props: any) => {
              const { cx, cy, index } = props;
              return (
                <circle key={`dot-${index}`} cx={cx} cy={cy} r={index === 0 ? 5 : 4}
                  fill={index === 0 ? '#66CC99' : '#9ADDBB'}
                  stroke="#FFFFFF" strokeWidth={2}
                />
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
