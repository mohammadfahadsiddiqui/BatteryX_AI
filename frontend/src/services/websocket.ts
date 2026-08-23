// BatteryX AI – WebSocket Client Service
// Provides automatic reconnection, heartbeat, and typed event callbacks.

import type { WSMessage, WSEventType, LiveTelemetry, BatteryAlert } from '../types';

type TelemetryCallback = (data: LiveTelemetry) => void;
type AlertCallback = (data: BatteryAlert) => void;
type ConnectionCallback = (batteryId: string) => void;
type GenericCallback = (msg: WSMessage) => void;

const WS_BASE = window.location.protocol === 'https:'
  ? `wss://${window.location.host}`
  : `ws://${window.location.host}`;

export class BatteryWebSocket {
  private batteryId: string;
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = 1000;
  private maxDelay = 30000;
  private _connected = false;
  private _destroyed = false;

  // Callbacks
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
    try {
      const url = `${WS_BASE}/ws/${this.batteryId}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this._connected = true;
        this.reconnectDelay = 1000;   // reset backoff
        this._startHeartbeat();
        this.onConnected?.(this.batteryId);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          this.onMessage?.(msg);
          this._dispatch(msg);
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        this._connected = false;
        this._stopHeartbeat();
        this.onDisconnected?.(this.batteryId);
        if (!this._destroyed) {
          this._scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      if (!this._destroyed) {
        this._scheduleReconnect();
      }
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
        if (msg.data) this.onAlert?.(msg.data as BatteryAlert);
        break;
      case 'pong':
        break; // Heartbeat acknowledged
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
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  disconnect(): void {
    this._destroyed = true;
    this._stopHeartbeat();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.ws?.close();
    this.ws = null;
  }

  get isConnected(): boolean {
    return this._connected && this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * REST polling fallback — used when WebSocket connection is unavailable.
 * Polls /api/v1/telemetry/{battery_id}/latest on interval.
 */
export function createTelemetryPoller(
  batteryId: string,
  onData: TelemetryCallback,
  intervalMs = 5000,
): () => void {
  const token = localStorage.getItem('bx_token');
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const res = await fetch(`/api/v1/telemetry/${batteryId}/latest`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data) onData(data);
      }
    } catch {
      // Silent failure — polling is best-effort
    }
  };

  poll();
  const id = setInterval(poll, intervalMs);
  return () => { active = false; clearInterval(id); };
}
