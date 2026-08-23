// BatteryX AI – AlertBanner component
// Dismissible top-level banner for real-time critical warnings.
import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { BatteryAlert } from '../../types';

interface Props {
  alert: BatteryAlert;
  onDismiss?: () => void;
}

export function AlertBanner({ alert, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isCritical = alert.severity === 'CRITICAL';
  const isHigh = alert.severity === 'HIGH';

  const bg = isCritical ? 'rgba(255,99,61,0.12)' : isHigh ? 'rgba(251,192,0,0.12)' : 'rgba(0,155,255,0.10)';
  const border = isCritical ? '#FF633D' : isHigh ? '#FBC000' : '#0088CC';
  const color = isCritical ? '#FF4D22' : isHigh ? '#C89800' : '#0088CC';

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color,
        marginBottom: '1rem',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isCritical ? (
          <AlertCircle size={20} />
        ) : isHigh ? (
          <AlertTriangle size={20} />
        ) : (
          <Info size={20} />
        )}
        <div>
          <span style={{ fontWeight: 700, marginRight: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>
            [{alert.severity}] {alert.alert_type}:
          </span>
          <span style={{ fontSize: '0.875rem', color: '#3F4A56' }}>{alert.message}</span>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#8B949C',
          display: 'flex',
          alignItems: 'center',
          padding: '0.25rem',
        }}
        title="Dismiss banner"
      >
        <X size={16} />
      </button>
    </div>
  );
}
