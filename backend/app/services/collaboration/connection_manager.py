import asyncio
import datetime
import logging
from typing import Dict, Any, List, Optional
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class HiringCollaborationManager:
    """
    Manages tenant-isolated WebSocket connections for collaborative hiring pipelines.
    Enables live Kanban synchronization, real-time scorecard updates, notes, and recruiter presence.
    """

    def __init__(self):
        # org_id -> {WebSocket: user_info_dict}
        self.active_rooms: Dict[str, Dict[WebSocket, Dict[str, Any]]] = {}
        self._lock = asyncio.Lock()

    async def connect(
        self,
        websocket: WebSocket,
        org_id: str,
        user_info: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Accepts the WebSocket connection, registers it to the tenant room,
        and broadcasts presence updates to peers.
        """
        await websocket.accept()

        user_metadata = user_info or {
            "user_id": "anonymous",
            "full_name": "Collaborating Recruiter",
            "role": "employer",
            "connected_at": datetime.datetime.utcnow().isoformat(),
        }

        async with self._lock:
            if org_id not in self.active_rooms:
                self.active_rooms[org_id] = {}
            self.active_rooms[org_id][websocket] = user_metadata

        # Notify peers of new presence
        peers = self.get_active_collaborators(org_id)
        await self.broadcast(
            org_id=org_id,
            event_type="RECRUITER_JOINED",
            data={
                "joined_user": user_metadata,
                "active_collaborators": peers,
                "peer_count": len(peers),
            },
        )
        logger.info(
            f"WebSocket connected for user {user_metadata.get('user_id')} to org '{org_id}'. Total peers: {len(peers)}"
        )

    async def disconnect(self, websocket: WebSocket, org_id: str) -> None:
        """
        Removes the WebSocket from the tenant room and alerts peers.
        """
        departing_user = None
        async with self._lock:
            if org_id in self.active_rooms:
                if websocket in self.active_rooms[org_id]:
                    departing_user = self.active_rooms[org_id].pop(websocket)
                if not self.active_rooms[org_id]:
                    del self.active_rooms[org_id]

        if departing_user:
            peers = self.get_active_collaborators(org_id)
            await self.broadcast(
                org_id=org_id,
                event_type="RECRUITER_LEFT",
                data={
                    "departing_user": departing_user,
                    "active_collaborators": peers,
                    "peer_count": len(peers),
                },
            )
            logger.info(
                f"WebSocket disconnected for user {departing_user.get('user_id')} from org '{org_id}'."
            )

    async def broadcast(
        self,
        org_id: str,
        event_type: str,
        data: Dict[str, Any],
        exclude_socket: Optional[WebSocket] = None,
    ) -> None:
        """
        Broadcasts a structured JSON event to all active sockets connected to org_id.
        """
        sockets_to_send: List[WebSocket] = []
        async with self._lock:
            if org_id in self.active_rooms:
                sockets_to_send = [
                    ws for ws in self.active_rooms[org_id].keys() if ws != exclude_socket
                ]

        if not sockets_to_send:
            return

        payload = {
            "event": event_type,
            "org_id": org_id,
            "data": data,
            "timestamp": datetime.datetime.utcnow().isoformat(),
        }

        dead_sockets: List[WebSocket] = []
        for ws in sockets_to_send:
            try:
                await ws.send_json(payload)
            except Exception as e:
                logger.warning(f"Error broadcasting to socket in org {org_id}: {e}")
                dead_sockets.append(ws)

        if dead_sockets:
            async with self._lock:
                if org_id in self.active_rooms:
                    for ws in dead_sockets:
                        self.active_rooms[org_id].pop(ws, None)
                    if not self.active_rooms[org_id]:
                        del self.active_rooms[org_id]

    def get_active_collaborators(self, org_id: str) -> List[Dict[str, Any]]:
        """
        Returns a list of distinct active collaborator metadata dictionaries in this tenant.
        """
        if org_id not in self.active_rooms:
            return []
        # Return distinct users
        seen_user_ids = set()
        unique_users: List[Dict[str, Any]] = []
        for user_meta in self.active_rooms[org_id].values():
            uid = user_meta.get("user_id")
            if uid and uid not in seen_user_ids:
                seen_user_ids.add(uid)
                unique_users.append(user_meta)
        return unique_users

    def get_peer_count(self, org_id: str) -> int:
        """
        Returns number of active connections in org_id.
        """
        if org_id not in self.active_rooms:
            return 0
        return len(self.active_rooms[org_id])


# Global singleton instance
collaboration_manager = HiringCollaborationManager()
