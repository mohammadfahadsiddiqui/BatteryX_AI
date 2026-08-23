// BatteryX AI – CellVoltageGrid component
// Renders an interactive cell-level heatmap grid with voltage balance stats.

interface Props {
  cellVoltages?: number[];
  nominalVoltage?: number;
}

export function CellVoltageGrid({ cellVoltages, nominalVoltage = 3.7 }: Props) {
  if (!cellVoltages || cellVoltages.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: '#F7F9F8',
        borderRadius: '12px',
        border: '1px dashed #E2E8E5',
        color: '#8B949C',
        fontSize: '0.875rem'
      }}>
        No cell-level telemetry available for this pack. Connect a compatible BMS or ESP32 cell monitor.
      </div>
    );
  }

  const min = Math.min(...cellVoltages);
  const max = Math.max(...cellVoltages);
  const avg = cellVoltages.reduce((a, b) => a + b, 0) / cellVoltages.length;
  const deltaMv = Math.round((max - min) * 1000);

  // Determine delta health status
  const deltaColor = deltaMv > 150 ? '#FF633D' : deltaMv > 50 ? '#FBC000' : '#4DBF88';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        <div style={{ background: '#F7F9F8', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8E5' }}>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', textTransform: 'uppercase', fontWeight: 600 }}>Cell Count</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3F4A56', marginTop: '0.25rem' }}>{cellVoltages.length}S</div>
        </div>
        <div style={{ background: '#F7F9F8', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8E5' }}>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', textTransform: 'uppercase', fontWeight: 600 }}>Avg Voltage</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3F4A56', marginTop: '0.25rem' }}>{avg.toFixed(3)} V</div>
        </div>
        <div style={{ background: '#F7F9F8', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8E5' }}>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', textTransform: 'uppercase', fontWeight: 600 }}>Min / Max</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3F4A56', marginTop: '0.25rem' }}>
            {min.toFixed(2)} / {max.toFixed(2)} V
          </div>
        </div>
        <div style={{ background: '#F7F9F8', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8E5' }}>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', textTransform: 'uppercase', fontWeight: 600 }}>Delta (ΔV)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: deltaColor, marginTop: '0.25rem' }}>
            {deltaMv} mV
          </div>
        </div>
      </div>

      {/* Grid of cells */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '0.5rem',
      }}>
        {cellVoltages.map((v, i) => {
          const diffFromAvg = (v - avg) * 1000;
          let cellBg = '#FFFFFF';
          let border = '#E2E8E5';
          let textColor = '#3F4A56';

          if (v === min && deltaMv > 50) {
            cellBg = 'rgba(255,99,61,0.08)';
            border = '#FF633D';
          } else if (v === max && deltaMv > 50) {
            cellBg = 'rgba(251,192,0,0.08)';
            border = '#FBC000';
          } else {
            cellBg = 'rgba(102,204,153,0.06)';
            border = 'rgba(102,204,153,0.3)';
          }

          return (
            <div
              key={i}
              style={{
                padding: '0.625rem 0.5rem',
                background: cellBg,
                border: `1px solid ${border}`,
                borderRadius: '8px',
                textAlign: 'center',
                transition: 'transform 0.15s',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#8B949C', fontWeight: 600 }}>C{i + 1}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: textColor, marginTop: '0.15rem' }}>
                {v.toFixed(3)}V
              </div>
              <div style={{ fontSize: '0.65rem', color: diffFromAvg >= 0 ? '#4DBF88' : '#FF633D', marginTop: '0.1rem' }}>
                {diffFromAvg >= 0 ? `+${diffFromAvg.toFixed(0)}mV` : `${diffFromAvg.toFixed(0)}mV`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
