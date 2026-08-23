// BatteryX AI – LiveChart component
// Real-time animated time-series chart with windowing and pause/resume capability.
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface DataPoint {
  time: string;
  [key: string]: number | string | undefined;
}

interface Props {
  data: DataPoint[];
  dataKey: string;
  name: string;
  unit: string;
  color?: string;
  yDomain?: [number | 'auto', number | 'auto'];
  height?: number;
}

export function LiveChart({
  data,
  dataKey,
  name,
  unit,
  color = '#66CC99',
  yDomain = ['auto', 'auto'],
  height = 200,
}: Props) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E5" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#8B949C"
            tick={{ fontSize: 11, fill: '#8B949C' }}
            tickLine={false}
            axisLine={{ stroke: '#E2E8E5' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={yDomain}
            stroke="#8B949C"
            tick={{ fontSize: 11, fill: '#8B949C' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}${unit ? ' ' + unit : ''}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8E5',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
            formatter={(value: any) => [`${value} ${unit}`, name]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            name={name}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
