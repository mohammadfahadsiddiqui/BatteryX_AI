"""BatteryX AI – WebSocket Connection Manager"""
import json
from typing import Dict, Set
from fastapi import WebSocket


class WebSocketManager:
    """
    Manages WebSocket connections per battery_id.
    Provides battery-specific broadcasting and global broadcasts.
    """

    def __init__(self):
        # battery_id -> set of connected WebSocket clients
        self._battery_connections: Dict[str, Set[WebSocket]] = {}
        # All connected clients (for global broadcasts)
        self._all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, battery_id: str):
        await websocket.accept()
        self._all_connections.add(websocket)
        if battery_id not in self._battery_connections:
            self._battery_connections[battery_id] = set()
        self._battery_connections[battery_id].add(websocket)

    def disconnect(self, websocket: WebSocket, battery_id: str):
        self._all_connections.discard(websocket)
        if battery_id in self._battery_connections:
            self._battery_connections[battery_id].discard(websocket)
            if not self._battery_connections[battery_id]:
                del self._battery_connections[battery_id]

    async def broadcast_battery(self, battery_id: str, data: dict):
        """Broadcast a message to all clients watching a specific battery."""
        if battery_id not in self._battery_connections:
            return
        dead = set()
        message = json.dumps(data, default=str)
        for ws in self._battery_connections[battery_id]:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect(ws, battery_id)

    async def broadcast_all(self, data: dict):
        """Broadcast a message to all connected clients."""
        dead = set()
        message = json.dumps(data, default=str)
        for ws in list(self._all_connections):
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        # Clean up dead connections (approximate — battery tracking is best-effort)
        for ws in dead:
            self._all_connections.discard(ws)

    def connection_count(self, battery_id: str = None) -> int:
        if battery_id:
            return len(self._battery_connections.get(battery_id, set()))
        return len(self._all_connections)


# Singleton instance used across the application
ws_manager = WebSocketManager()
