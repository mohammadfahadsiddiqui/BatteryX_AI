// BatteryX AI – SOH Gauge component (animated circular gauge)
import React from 'react';
import { getSOHColor } from '../../utils/helpers';

interface SOHGaugeProps {
  soh: number;
  size?: number;
  label?: string;
  showLabel?: boolean;
}

export default function SOHGauge({ soh, size = 160, label, showLabel = true }: SOHGaugeProps) {
  const color = getSOHColor(soh);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  // Show 270 degree arc (from -135deg to 135deg)
  const arcLength = circumference * 0.75;
  const offset = circumference * (1 - (soh / 100) * 0.75);

  let healthLabel = 'Unknown';
  if (soh >= 90) healthLabel = 'Excellent';
  else if (soh >= 80) healthLabel = 'Good';
  else if (soh >= 70) healthLabel = 'Fair';
  else if (soh >= 60) healthLabel = 'Poor';
  else healthLabel = 'Critical';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--color-border)" strokeWidth={10}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 6px ${color}50)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: size > 120 ? '2rem' : '1.5rem',
            fontWeight: 800, color,
            letterSpacing: '-0.03em', lineHeight: 1,
          }}>
            {soh.toFixed(0)}%
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 2 }}>SOH</span>
        </div>
      </div>
      {showLabel && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, color, fontSize: '0.9375rem' }}>{healthLabel}</span>
          {label && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{label}</span>}
        </div>
      )}
    </div>
  );
}
