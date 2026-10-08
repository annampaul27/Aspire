#!/bin/bash
echo "=============================================================================="
echo "Aspire AI - Multimodal Interview Coach (Standalone Streamlit Academic Launcher)"
echo "=============================================================================="
echo "Starting Streamlit application on http://localhost:8501 ..."

export PYTHONPATH=.
streamlit run services/interview_coach/streamlit_app.py --server.port=8501 --server.headless=false
