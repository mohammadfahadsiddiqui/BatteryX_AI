// BatteryX AI – Risk Badge
import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface RiskBadgeProps {
  risk?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function RiskBadge({ risk, size = 'md', showIcon = true }: RiskBadgeProps) {
  const config: Record<string, { cls: string; Icon: any; label: string }> = {
    LOW: { cls: 'badge-success', Icon: ShieldCheck, label: 'LOW' },
    MODERATE: { cls: 'badge-warning', Icon: ShieldAlert, label: 'MODERATE' },
    HIGH: { cls: 'badge-danger', Icon: ShieldX, label: 'HIGH' },
  };
  const c = config[risk || ''] || { cls: 'badge-muted', Icon: ShieldAlert, label: risk || '—' };
  const iconSize = size === 'sm' ? 11 : size === 'lg' ? 16 : 13;

  return (
    <span className={`badge ${c.cls}`} style={size === 'lg' ? { fontSize: '0.8125rem', padding: '0.35rem 0.75rem' } : {}}>
      {showIcon && <c.Icon size={iconSize} />}
      {c.label}
    </span>
  );
}
