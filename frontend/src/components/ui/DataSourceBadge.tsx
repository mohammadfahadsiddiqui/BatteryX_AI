// BatteryX AI – DataSourceBadge component
// Displays a colour-coded badge for every data source type.
import type { DataSource } from '../../types';

interface Props {
  source: DataSource | string;
  size?: 'sm' | 'md';
}

const SOURCE_CONFIG: Record<string, { label: string; bg: string; color: string; border: string; icon: string }> = {
  manual:   { label: 'Manual',   bg: 'rgba(102,204,153,0.10)', color: '#4DBF88', border: 'rgba(102,204,153,0.25)', icon: '✏️' },
  csv:      { label: 'CSV',      bg: 'rgba(251,192,0,0.10)',   color: '#C89800', border: 'rgba(251,192,0,0.25)',   icon: '📄' },
  json:     { label: 'JSON',     bg: 'rgba(251,192,0,0.10)',   color: '#C89800', border: 'rgba(251,192,0,0.25)',   icon: '{ }' },
  esp32:    { label: 'ESP32',    bg: 'rgba(0,155,255,0.10)',   color: '#0088CC', border: 'rgba(0,155,255,0.25)',   icon: '⚡' },
  bms:      { label: 'BMS',      bg: 'rgba(120,80,255,0.10)',  color: '#7850FF', border: 'rgba(120,80,255,0.25)',  icon: '🔋' },
  can:      { label: 'CAN Bus',  bg: 'rgba(80,200,200,0.10)',  color: '#00A0A0', border: 'rgba(80,200,200,0.25)',  icon: '🔌' },
  demo:     { label: 'Demo',     bg: 'rgba(139,148,156,0.10)', color: '#8B949C', border: 'rgba(139,148,156,0.25)', icon: '🧪' },
  analysis: { label: 'Analysis', bg: 'rgba(102,204,153,0.10)', color: '#4DBF88', border: 'rgba(102,204,153,0.25)', icon: '🔬' },
};

export function DataSourceBadge({ source, size = 'md' }: Props) {
  const cfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.manual;
  const padding = size === 'sm' ? '0.15rem 0.45rem' : '0.25rem 0.625rem';
  const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding,
      borderRadius: '9999px',
      fontSize,
      fontWeight: 600,
      letterSpacing: '0.03em',
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: '0.65rem' }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
