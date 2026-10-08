import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from services.interview_coach.core.config import settings
from services.interview_coach.api.routes import router as interview_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Multimodal AI Interview Coach with Video & Audio Telemetry (Autonomous Module)",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(interview_router, prefix="/api/v1/interview", tags=["Interview Coach"])

# Mount static frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    print(f"🚀 Starting {settings.APP_NAME} on http://localhost:{settings.PORT}")
    uvicorn.run("services.interview_coach.standalone_app:app", host=settings.HOST, port=settings.PORT, reload=True)
