// BatteryX AI – WebSocket Client Service
import type { WSMessage, LiveTelemetry, BatteryAlert } from '../types';

type TelemetryCallback = (data: LiveTelemetry) => void;
type AlertCallback = (data: BatteryAlert) => void;
type ConnectionCallback = (batteryId: string) => void;
type GenericCallback = (msg: WSMessage) => void;
type FallbackCallback = () => Promise<void>;

const WS_BASE = window.location.protocol === 'https:'
  ? `wss://${window.location.host}`
  : `ws://${window.location.host}`;

// Vercel serverless functions do not provide a persistent WebSocket endpoint.
// Keep WebSocket opt-in so production does not repeatedly connect to /ws/*
// and receive the SPA's HTTP 200 response during the handshake.
const WEBSOCKET_ENABLED = import.meta.env.VITE_ENABLE_WEBSOCKET === 'true';

export class BatteryWebSocket {
  private batteryId: string;
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = 1000;
  private maxDelay = 30000;
  private _connected = false;
  private _destroyed = false;

  onTelemetry?: TelemetryCallback;
  onAlert?: AlertCallback;
  onConnected?: ConnectionCallback;
  onDisconnected?: ConnectionCallback;
  onMessage?: GenericCallback;

  constructor(batteryId: string) {
    this.batteryId = batteryId;
  }

  connect(): void {
    if (this._destroyed) return;

    if (!WEBSOCKET_ENABLED) {
      this._connected = false;
      this.onDisconnected?.(this.batteryId);
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;

    try {
      this.ws = new WebSocket(`${WS_BASE}/ws/${encodeURIComponent(this.batteryId)}`);

      this.ws.onopen = () => {
        this._connected = true;
        this.reconnectDelay = 1000;
        this._startHeartbeat();
        this.onConnected?.(this.batteryId);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          this.onMessage?.(msg);
          this._dispatch(msg);
        } catch {
          // Ignore malformed frames without terminating the stream.
        }
      };

      this.ws.onclose = () => {
        this._connected = false;
        this._stopHeartbeat();
        this.onDisconnected?.(this.batteryId);
        if (!this._destroyed) this._scheduleReconnect();
      };

      this.ws.onerror = () => {
        // onclose handles cleanup/reconnect.
      };
    } catch {
      if (!this._destroyed) this._scheduleReconnect();
    }
  }

  private _dispatch(msg: WSMessage): void {
    switch (msg.event) {
      case 'telemetry_update':
        if (msg.data) this.onTelemetry?.(msg.data as LiveTelemetry);
        break;
      case 'critical_alert':
      case 'temperature_warning':
      case 'voltage_warning':
      case 'current_warning':
      case 'cell_imbalance_warning':
      case 'bms_fault':
        if (msg.data) this.onAlert?.(msg.data as BatteryAlert);
        break;
      case 'pong':
        break;
      default:
        break;
    }
  }

  private _startHeartbeat(): void {
    this._stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 20000);
  }

  private _stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectTimeout || this._destroyed) return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(Math.round(this.reconnectDelay * 1.5), this.maxDelay);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  disconnect(): void {
    this._destroyed = true;
    this._stopHeartbeat();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = null;
    this.ws?.close();
    this.ws = null;
    this._connected = false;
  }

  get isConnected(): boolean {
    return this._connected && this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Poll live telemetry. If the API has no live packet yet, the optional
 * fallback callback is invoked so the UI can show the latest manually
 * recorded battery reading instead of an empty dashboard.
 */
export function createTelemetryPoller(
  batteryId: string,
  onData: TelemetryCallback,
  intervalMs = 2000,
  onNoLiveData?: FallbackCallback,
): () => void {
  let active = true;
  let fallbackInFlight = false;

  const poll = async () => {
    if (!active) return;
    try {
      const token = localStorage.getItem('bx_token');
      const res = await fetch(`/api/v1/telemetry/${encodeURIComponent(batteryId)}/latest`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          onData(data as LiveTelemetry);
          return;
        }
      }

      if (onNoLiveData && !fallbackInFlight) {
        fallbackInFlight = true;
        try {
          await onNoLiveData();
        } finally {
          fallbackInFlight = false;
        }
      }
    } catch {
      if (onNoLiveData && !fallbackInFlight) {
        fallbackInFlight = true;
        try {
          await onNoLiveData();
        } finally {
          fallbackInFlight = false;
        }
      }
    }
  };

  void poll();
  const id = setInterval(() => { void poll(); }, intervalMs);
  return () => { active = false; clearInterval(id); };
}
