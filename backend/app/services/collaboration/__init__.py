"""
Collaborative hiring and real-time WebSocket communication subsystem.
"""
from app.services.collaboration.connection_manager import (
    HiringCollaborationManager,
    collaboration_manager,
)

__all__ = ["HiringCollaborationManager", "collaboration_manager"]
