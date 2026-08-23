// BatteryX AI – LiveIndicator component
// Pulsing badge indicating real-time connection state.

interface Props {
  isLive: boolean;
  isDemo?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export function LiveIndicator({ isLive, isDemo = false, label, size = 'md' }: Props) {
  let text = label;
  let bg = 'rgba(139,148,156,0.10)';
  let color = '#8B949C';
  let dotColor = '#8B949C';
  let pulsing = false;

  if (isDemo) {
    text = text || 'DEMO MODE';
    bg = 'rgba(251,192,0,0.12)';
    color = '#C89800';
    dotColor = '#FBC000';
  } else if (isLive) {
    text = text || 'LIVE';
    bg = 'rgba(102,204,153,0.15)';
    color = '#2E9F68';
    dotColor = '#66CC99';
    pulsing = true;
  } else {
    text = text || 'OFFLINE';
  }

  const padding = size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.65rem';
  const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding,
        borderRadius: '9999px',
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.05em',
        background: bg,
        color,
        border: `1px solid ${color}33`,
        textTransform: 'uppercase',
      }}
    >
      <span style={{ position: 'relative', display: 'inline-flex', width: '8px', height: '8px' }}>
        {pulsing && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: dotColor,
              opacity: 0.75,
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
        )}
        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            borderRadius: '50%',
            width: '8px',
            height: '8px',
            backgroundColor: dotColor,
          }}
        />
      </span>
      {text}
    </span>
  );
}
