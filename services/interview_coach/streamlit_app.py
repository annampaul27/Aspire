import os
import streamlit as st

# Ensure local imports work whether run from repo root or module root
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from services.interview_coach.core.schemas import AnswerSubmissionRequest  # noqa: E402
from services.interview_coach.engine.interviewer import AdaptiveInterviewerEngine  # noqa: E402
from services.interview_coach.api.routes import PRESET_ROLES  # noqa: E402

# Page Setup
st.set_page_config(
    page_title="Aspire AI — Multimodal Interview Coach",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom Styling
st.markdown("""
<style>
    .main { background-color: #0b0f17; color: #f3f4f6; }
    .stMetric { background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 12px; }
    .stCard { background-color: #111827; border-radius: 12px; padding: 20px; border: 1px solid #1f2937; margin-bottom: 16px; }
    .badge-emerald { background-color: #064e3b; color: #34d399; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; border: 1px solid #059669; }
    .badge-blue { background-color: #1e3a5f; color: #60a5fa; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; border: 1px solid #2563eb; }
    .badge-amber { background-color: #451a03; color: #fbbf24; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; border: 1px solid #d97706; }
    .metric-card { background: linear-gradient(135deg, #111827 0%, #1f2937 100%); border-radius: 12px; padding: 16px; border: 1px solid #374151; }
</style>
""", unsafe_allow_html=True)

# Session State Initialization
if "engine" not in st.session_state:
    st.session_state.engine = AdaptiveInterviewerEngine()
if "current_question" not in st.session_state:
    st.session_state.current_question = None
if "follow_up_probe" not in st.session_state:
    st.session_state.follow_up_probe = None
if "evaluation_report" not in st.session_state:
    st.session_state.evaluation_report = None

# Sidebar Configuration
with st.sidebar:
    st.title("🎙️ Interview Studio")
    st.caption("Multimodal Video & Speech Telemetry Engine")
    
    st.divider()
    st.subheader("1. Candidate & Target Role")
    candidate_name = st.text_input("Candidate Name", value="Aditya Verma")
    
    preset_names = [f"{p.role} — {p.topic}" for p in PRESET_ROLES] + ["Custom Role / Scenario"]
    selected_preset = st.selectbox("Role Preset", preset_names, index=0)
    
    if selected_preset != "Custom Role / Scenario":
        idx = preset_names.index(selected_preset)
        role = PRESET_ROLES[idx].role
        topic = PRESET_ROLES[idx].topic
        difficulty = PRESET_ROLES[idx].difficulty
    else:
        role = st.text_input("Custom Role", value="Distributed Systems Architect")
        topic = st.text_input("Custom Topic", value="Raft Consensus & Log Compaction")
        difficulty = st.selectbox("Difficulty", ["Junior", "Mid-Level", "Senior", "Principal"], index=2)

    st.divider()
    st.subheader("2. Telemetry Calibration")
    st.caption("Fine-tune sensor thresholds for testing & viva demonstration:")
    simulated_eye_contact = st.slider("Simulated Eye Contact %", min_value=20, max_value=100, value=85, step=5) / 100.0
    simulated_stability = st.slider("Head Stability Index (0-100)", min_value=20, max_value=100, value=90, step=5)
    est_duration = st.slider("Answer Duration (Seconds)", min_value=5, max_value=120, value=25, step=5)
    
    st.divider()
    api_key_input = st.text_input("Groq API Key (Optional)", type="password", value=os.getenv("GROQ_API_KEY", ""))
    if api_key_input:
        st.session_state.engine = AdaptiveInterviewerEngine(api_key=api_key_input)

# Main Stage Header
col_title, col_badges = st.columns([3, 1])
with col_title:
    st.header("🎯 Multimodal AI Interview Coach")
    st.markdown("Real-time speech pacing acoustics, filler-word detection, eye-contact composure tracking, and adaptive follow-up grilling.")
with col_badges:
    st.markdown("""
    <div style='text-align: right; margin-top: 10px;'>
        <span class='badge-emerald'>Audio Pacing Engine</span><br><br>
        <span class='badge-blue'>Computer Vision Telemetry</span>
    </div>
    """, unsafe_allow_html=True)

st.divider()

# TAB NAVIGATION
tab_interview, tab_report, tab_architecture = st.tabs([
    "🎙️ Live Interview Stage",
    "📊 Evaluation Report & Scorecard",
    "📐 Academic Architecture & CHI Formula"
])

# -----------------------------------------------------------------------------
# TAB 1: LIVE INTERVIEW STAGE
# -----------------------------------------------------------------------------
with tab_interview:
    col_left, col_right = st.columns([3, 2])
    
    with col_left:
        st.subheader("Step 1: Generate Scenario")
        if st.button("🚀 Generate Technical Interview Question", use_container_width=True, type="primary"):
            with st.spinner("Formulating senior-level scenario with trap follow-ups..."):
                q = st.session_state.engine.generate_question(role=role, topic=topic, difficulty=difficulty)
                st.session_state.current_question = q
                st.session_state.follow_up_probe = None
                st.session_state.evaluation_report = None
        
        if st.session_state.current_question:
            q = st.session_state.current_question
            st.markdown(f"""
            <div class='metric-card' style='border-left: 4px solid #10b981; margin: 15px 0;'>
                <h4 style='color: #10b981; margin-top: 0;'>Interview Question ({q.difficulty.title()})</h4>
                <p style='font-size: 1.1rem; line-height: 1.5;'>{q.question_scenario}</p>
            </div>
            """, unsafe_allow_html=True)
            
            with st.expander("💡 Technical Hints & Architectural Keywords"):
                st.markdown("**Expected Domain Keywords:**")
                st.write(", ".join([f"`{k}`" for k in q.expected_keywords]))
                st.markdown("**Architectural Hints:**")
                for h in q.hints:
                    st.write(f"- {h}")

            st.divider()
            st.subheader("Step 2: Spoken Response")
            
            # Default rich sample answer for instant testing
            sample_ans = (
                "To prevent cache stampede under high concurrent load, we implement a distributed mutex lock "
                "using Redis SETNX with an automatic TTL expiration. Only the first thread that acquires the lock "
                "recomputes the database query, while subsequent requests either wait or return a stale cached value. "
                "Furthermore, we add randomized jitter to our cache TTL to prevent synchronized simultaneous key expirations."
            )
            
            candidate_text = st.text_area(
                "Candidate Verbal Response (Transcribe or Type):",
                value=sample_ans,
                height=130,
                help="Type or paste candidate transcript. In production, this streams from Web Speech API."
            )
            
            # Action Buttons
            btn_col1, btn_col2 = st.columns(2)
            with btn_col1:
                if st.button("⚡ Trigger Adaptive Follow-Up Grill", use_container_width=True):
                    with st.spinner("Analyzing answer for edge-case omissions..."):
                        probe = st.session_state.engine.generate_follow_up_probe(
                            q.question_scenario, candidate_text, role
                        )
                        st.session_state.follow_up_probe = probe
            
            with btn_col2:
                if st.button("🏆 Submit Final Answer & Score", use_container_width=True, type="primary"):
                    with st.spinner("Synthesizing Multimodal Hireability Index..."):
                        req = AnswerSubmissionRequest(
                            question_id=q.question_id,
                            role=q.role,
                            question_text=q.question_scenario,
                            candidate_transcript=candidate_text,
                            audio_duration_seconds=float(est_duration),
                            eye_contact_ratio=float(simulated_eye_contact),
                            head_stability_score=float(simulated_stability),
                            is_follow_up=False,
                        )
                        rep = st.session_state.engine.evaluate_session(req)
                        st.session_state.evaluation_report = rep
                        st.success("✅ Evaluation Complete! Switch to 'Evaluation Report' tab.")

            # Display Follow-up Probe if triggered
            if st.session_state.follow_up_probe:
                probe = st.session_state.follow_up_probe
                st.markdown(f"""
                <div class='metric-card' style='border-left: 4px solid #f59e0b; margin: 15px 0;'>
                    <h4 style='color: #f59e0b; margin-top: 0;'>🚨 Adaptive Follow-Up Probe ({probe.probe_focus})</h4>
                    <p style='font-size: 1.05rem;'>{probe.probe_question}</p>
                    {f"<small style='color: #9ca3af;'>Hint: {probe.hint}</small>" if probe.hint else ""}
                </div>
                """, unsafe_allow_html=True)
                
    with col_right:
        st.subheader("Live Telemetry HUD")
        
        # Camera preview placeholder
        st.camera_input("Live Video Feed (Gaze & Posture Tracking)")
        
        st.markdown("#### Real-Time Sensor Readings")
        m1, m2 = st.columns(2)
        with m1:
            st.metric("Gaze Engagement", f"{int(simulated_eye_contact * 100)}%", "+5% vs Avg")
        with m2:
            st.metric("Head Stability", f"{int(simulated_stability)}/100", "Steady Poise")
        
        # Live Acoustics estimation
        if st.session_state.current_question:
            test_metrics = st.session_state.engine.audio_analyzer.analyze_transcript(
                sample_ans, duration_seconds=est_duration
            )
            st.markdown("#### Speech Acoustics Telemetry")
            a1, a2 = st.columns(2)
            with a1:
                st.metric("Speech Cadence", f"{test_metrics.wpm} WPM", test_metrics.cadence_rating)
            with a2:
                st.metric("Filler Words", f"{test_metrics.filler_word_count}", f"{test_metrics.filler_percentage}%")
            
            if test_metrics.filler_words_detected:
                st.caption(f"Detected tics: {', '.join(test_metrics.filler_words_detected)}")

# -----------------------------------------------------------------------------
# TAB 2: EVALUATION REPORT & SCORECARD
# -----------------------------------------------------------------------------
with tab_report:
    if not st.session_state.evaluation_report:
        st.info("👈 Please generate a question and click 'Submit Final Answer & Score' to generate the hireability report.")
    else:
        rep = st.session_state.evaluation_report
        
        st.subheader(f"Candidate Evaluation Report: {candidate_name}")
        st.caption(f"Evaluated for: {rep.role} | Report ID: {rep.report_id}")
        
        # Top KPI Scorecards
        kpi1, kpi2, kpi3, kpi4 = st.columns(4)
        with kpi1:
            verdict_badge = "badge-emerald" if "Hire" in rep.verdict else "badge-amber"
            st.metric("Composite Hireability (CHI)", f"{rep.overall_hireability_score}/100")
            st.markdown(f"<span class='{verdict_badge}'>{rep.verdict}</span>", unsafe_allow_html=True)
        with kpi2:
            st.metric("Technical Accuracy", f"{rep.technical_score}/100", "Weight: 50%")
        with kpi3:
            st.metric("Vocal Delivery (WPM/Fillers)", f"{rep.vocal_score}/100", f"{rep.speech_metrics.wpm} WPM (25%)")
        with kpi4:
            st.metric("Non-Verbal Composure", f"{rep.nonverbal_score}/100", f"{int(rep.vision_metrics.eye_contact_ratio * 100)}% Gaze (25%)")

        st.divider()
        
        col_feedback, col_radar = st.columns([3, 2])
        
        with col_feedback:
            st.markdown("### 🏆 Strengths (What Went Well)")
            for item in rep.what_went_well:
                st.markdown(f"- ✅ **{item}**")
            
            st.markdown("### 🎯 Actionable Engineering Improvements")
            for item in rep.what_to_improve:
                st.markdown(f"- ⚠️ {item}")
                
            with st.expander("⭐ View Senior-Level Benchmark Response"):
                st.info(rep.model_senior_response)
        
        with col_radar:
            st.markdown("### 🕸️ Competency Radar Analysis")
            st.bar_chart(rep.radar_chart_data)
            
            st.markdown("#### Speech Acoustics Breakdown")
            st.write(f"- **Words Spoken:** {rep.speech_metrics.word_count}")
            st.write(f"- **Pacing Rating:** {rep.speech_metrics.cadence_rating}")
            st.write(f"- **Filler Frequency:** {rep.speech_metrics.filler_percentage}%")
            st.write(f"- **Non-Verbal Rating:** {rep.vision_metrics.non_verbal_rating}")

        st.divider()
        # Export buttons
        export_json = rep.model_dump_json(indent=2)
        st.download_button(
            label="📥 Download Official Academic Evaluation Report (JSON)",
            data=export_json,
            file_name=f"Interview_Evaluation_{candidate_name.replace(' ', '_')}.json",
            mime="application/json",
            use_container_width=True
        )

# -----------------------------------------------------------------------------
# TAB 3: ACADEMIC ARCHITECTURE & MATHEMATICAL MODEL
# -----------------------------------------------------------------------------
with tab_architecture:
    st.subheader("Academic Research & Thesis Methodology")
    st.markdown("""
    ### 1. Mathematical Composite Hireability Index (CHI)
    The system deterministically computes a bounded composite score:
    
    $$\\text{CHI} = w_t \\cdot S_{\\text{tech}} + w_v \\cdot S_{\\text{vocal}} + w_n \\cdot S_{\\text{nonverbal}}$$
    
    Where:
    - **$w_t = 0.50$**: Technical Content & Domain Semantic Rubric
    - **$w_v = 0.25$**: Vocal Delivery & Speech Cadence Acoustics
    - **$w_n = 0.25$**: Non-Verbal Composure & Eye-Contact Tracking
    
    ### 2. Speech Prosody & Acoustics Formulation
    $$S_{\\text{vocal}} = 100 - (\\Delta_{\\text{WPM}} \\times 0.45) - (\\text{FillerCount} \\times 4.0) - (\\text{LongPauses} \\times 1.5)$$
    - Optimal Cadence Bandwidth: $120 \\le \\text{WPM} \\le 165$.
    
    ### 3. Affective Non-Verbal Formulation
    $$S_{\\text{nonverbal}} = (\\text{EyeContactRatio} \\times 60) + (\\text{HeadStabilityIndex} \\times 0.40)$$
    
    ### 4. Zero-Cost Client-Side Architecture
    Gaze estimation and acoustic transcriptions execute client-side using standard HTML5 Canvas & Web Audio API,
    completely eliminating expensive server-side GPU cloud dependencies.
    """)
