// BatteryX AI – StatusBadge component
// Displays consistent, theme-tailored badges for devices, diagnostics, alerts, etc.

interface Props {
  status: string;
  type?: 'device' | 'diagnostic' | 'alert' | 'health' | 'risk' | 'generic';
  size?: 'sm' | 'md';
}

const BADGE_MAP: Record<string, { label: string; bg: string; color: string; border: string }> = {
  // Device & Connection
  CONNECTED:    { label: 'Connected',    bg: 'rgba(102,204,153,0.12)', color: '#4DBF88', border: 'rgba(102,204,153,0.30)' },
  MEASURING:    { label: 'Measuring',    bg: 'rgba(102,204,153,0.18)', color: '#2E9F68', border: 'rgba(102,204,153,0.40)' },
  TRANSMITTING: { label: 'Transmitting', bg: 'rgba(0,155,255,0.12)',  color: '#0088CC', border: 'rgba(0,155,255,0.30)' },
  BOOTING:      { label: 'Booting',      bg: 'rgba(251,192,0,0.12)',   color: '#C89800', border: 'rgba(251,192,0,0.30)' },
  INITIALIZING: { label: 'Initializing', bg: 'rgba(251,192,0,0.12)',   color: '#C89800', border: 'rgba(251,192,0,0.30)' },
  CONNECTING:   { label: 'Connecting',   bg: 'rgba(251,192,0,0.12)',   color: '#C89800', border: 'rgba(251,192,0,0.30)' },
  OFFLINE:      { label: 'Offline',      bg: 'rgba(139,148,156,0.10)', color: '#8B949C', border: 'rgba(139,148,156,0.22)' },
  ERROR:        { label: 'Error',        bg: 'rgba(255,99,61,0.12)',   color: '#FF633D', border: 'rgba(255,99,61,0.30)' },
  MAINTENANCE:  { label: 'Maintenance',  bg: 'rgba(139,148,156,0.15)', color: '#68737D', border: 'rgba(139,148,156,0.25)' },

  // Diagnostics
  CREATED:      { label: 'Created',      bg: 'rgba(139,148,156,0.10)', color: '#8B949C', border: 'rgba(139,148,156,0.22)' },
  READY:        { label: 'Ready',        bg: 'rgba(0,155,255,0.10)',   color: '#0088CC', border: 'rgba(0,155,255,0.25)' },
  RUNNING:      { label: 'Running',      bg: 'rgba(251,192,0,0.15)',   color: '#C89800', border: 'rgba(251,192,0,0.35)' },
  PAUSED:       { label: 'Paused',       bg: 'rgba(251,192,0,0.10)',   color: '#C89800', border: 'rgba(251,192,0,0.25)' },
  COMPLETED:    { label: 'Completed',    bg: 'rgba(102,204,153,0.12)', color: '#4DBF88', border: 'rgba(102,204,153,0.30)' },
  FAILED:       { label: 'Failed',       bg: 'rgba(255,99,61,0.12)',   color: '#FF633D', border: 'rgba(255,99,61,0.30)' },
  CANCELLED:    { label: 'Cancelled',    bg: 'rgba(139,148,156,0.10)', color: '#8B949C', border: 'rgba(139,148,156,0.22)' },

  // Alerts
  CRITICAL:     { label: 'Critical',     bg: 'rgba(255,99,61,0.15)',   color: '#FF4D22', border: 'rgba(255,99,61,0.40)' },
  HIGH:         { label: 'High',         bg: 'rgba(255,99,61,0.12)',   color: '#FF633D', border: 'rgba(255,99,61,0.30)' },
  WARNING:      { label: 'Warning',      bg: 'rgba(251,192,0,0.12)',   color: '#C89800', border: 'rgba(251,192,0,0.30)' },
  INFO:         { label: 'Info',         bg: 'rgba(0,155,255,0.10)',   color: '#0088CC', border: 'rgba(0,155,255,0.25)' },
  ACTIVE:       { label: 'Active',       bg: 'rgba(255,99,61,0.12)',   color: '#FF633D', border: 'rgba(255,99,61,0.30)' },
  ACKNOWLEDGED: { label: 'Acknowledged', bg: 'rgba(251,192,0,0.12)',   color: '#C89800', border: 'rgba(251,192,0,0.30)' },
  RESOLVED:     { label: 'Resolved',     bg: 'rgba(102,204,153,0.12)', color: '#4DBF88', border: 'rgba(102,204,153,0.30)' },

  // Risk & Health
  LOW:          { label: 'Low Risk',     bg: 'rgba(102,204,153,0.12)', color: '#4DBF88', border: 'rgba(102,204,153,0.30)' },
  MODERATE:     { label: 'Moderate Risk',bg: 'rgba(251,192,0,0.12)',   color: '#C89800', border: 'rgba(251,192,0,0.30)' },
  HEALTHY:      { label: 'Healthy',      bg: 'rgba(102,204,153,0.12)', color: '#4DBF88', border: 'rgba(102,204,153,0.30)' },
  DEGRADED:     { label: 'Degraded',     bg: 'rgba(251,192,0,0.12)',   color: '#C89800', border: 'rgba(251,192,0,0.30)' },
  RETIRED:      { label: 'Retired',      bg: 'rgba(139,148,156,0.12)', color: '#8B949C', border: 'rgba(139,148,156,0.25)' },
};

export function StatusBadge({ status, size = 'md' }: Props) {
  const upper = (status || 'UNKNOWN').toUpperCase();
  const cfg = BADGE_MAP[upper] ?? {
    label: status,
    bg: 'rgba(139,148,156,0.10)',
    color: '#8B949C',
    border: 'rgba(139,148,156,0.22)',
  };

  const padding = size === 'sm' ? '0.15rem 0.45rem' : '0.25rem 0.625rem';
  const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding,
        borderRadius: '9999px',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.03em',
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: cfg.color,
          display: 'inline-block',
        }}
      />
      {cfg.label}
    </span>
  );
}
