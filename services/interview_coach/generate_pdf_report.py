import base64
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

def img_to_base64(path_str):
    p = Path(path_str)
    if not p.exists():
        print(f"Warning: image {path_str} not found")
        return ""
    with open(p, "rb") as f:
        data = f.read()
    return f"data:image/png;base64,{base64.b64encode(data).decode('utf-8')}"

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>IMCV Academic Project Report — Multimodal AI Interview Coach</title>
<style>
  @page {
    size: A4;
    margin: 16mm 16mm 20mm 16mm;
    @top-center {
      content: "Subject: Image Mining & Computer Vision (IMCV) — Academic Project Report";
      font-size: 8pt;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 8.5pt;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #64748b;
    }
    @bottom-left {
      content: "Multimodal AI Interview Coach — Department of CSE / AI";
      font-size: 8pt;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #64748b;
    }
  }

  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.55;
    font-size: 9.8pt;
    margin: 0;
    padding: 0;
  }

  .header-card {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    color: #ffffff;
    padding: 22px 26px;
    border-radius: 8px;
    margin-bottom: 22px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
  }

  .sub-tag {
    display: inline-block;
    background: #38bdf8;
    color: #0f172a;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 3px 10px;
    border-radius: 12px;
    margin-bottom: 10px;
  }

  .report-title {
    font-size: 16.5pt;
    font-weight: 800;
    line-height: 1.25;
    margin: 0 0 8px 0;
    color: #f8fafc;
  }

  .report-subtitle {
    font-size: 10.5pt;
    color: #94a3b8;
    margin: 0 0 14px 0;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    background: rgba(255, 255, 255, 0.08);
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 8.5pt;
    border-left: 3px solid #38bdf8;
  }

  .team-section {
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }

  .team-title {
    font-size: 8.5pt;
    font-weight: 700;
    color: #38bdf8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px 16px;
    font-size: 8.5pt;
    color: #e2e8f0;
  }

  h2 {
    font-size: 12.5pt;
    font-weight: 700;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 4px;
    margin-top: 20px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 10.5pt;
    font-weight: 600;
    color: #1e293b;
    margin-top: 12px;
    margin-bottom: 5px;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 8px 0;
    text-align: justify;
  }

  ul, ol {
    margin: 0 0 9px 0;
    padding-left: 18px;
  }

  li {
    margin-bottom: 3px;
  }

  .formula-box {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-left: 4px solid #2563eb;
    padding: 8px 12px;
    margin: 10px 0;
    border-radius: 4px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 8.8pt;
    color: #0f172a;
    page-break-inside: avoid;
  }

  .formula-title {
    font-weight: 700;
    color: #1e40af;
    margin-bottom: 3px;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 8.2pt;
    page-break-inside: avoid;
  }

  th, td {
    border: 1px solid #cbd5e1;
    padding: 6px 9px;
    text-align: left;
  }

  th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
  }

  tr:nth-child(even) {
    background-color: #f8fafc;
  }

  .figure-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px;
    margin: 12px 0;
    text-align: center;
    page-break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .figure-card img {
    max-width: 96%;
    max-height: 270px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  .figure-caption {
    font-size: 8pt;
    color: #475569;
    margin-top: 5px;
    font-style: italic;
    text-align: center;
  }

  .callout-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-left: 4px solid #3b82f6;
    padding: 8px 12px;
    margin: 9px 0;
    border-radius: 4px;
    font-size: 8.8pt;
    page-break-inside: avoid;
  }

  .callout-title {
    font-weight: 700;
    color: #1d4ed8;
    margin-bottom: 2px;
  }

  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 7pt;
    font-weight: 700;
  }

  .badge-success { background: #dcfce7; color: #166534; }
  .badge-warning { background: #fef9c3; color: #854d0e; }
  .badge-info { background: #e0f2fe; color: #075985; }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

<!-- COVER / HEADER CARD -->
<div class="header-card">
  <div class="sub-tag">Academic Course Project Report</div>
  <h1 class="report-title">Multimodal AI Interview Coach: Real-Time Visual Telemetry Mining, Eye Gaze Tracking, and Affective Behavioral Analysis</h1>
  <div class="report-subtitle">Edge Computer Vision, Spatio-Temporal Posture Mining, and Sovereign Indic Voice Synthesis</div>
  
  <div class="meta-grid">
    <div><strong>Subject:</strong> Image Mining and Computer Vision (IMCV)</div>
    <div><strong>Department:</strong> Computer Science & Engineering / AI</div>
    <div><strong>Academic Year:</strong> 2026</div>
    <div><strong>Deployment Medium:</strong> Streamlit (Port 8501) & Next.js 15 (Port 3000)</div>
  </div>

  <div class="team-section">
    <div class="team-title">Project Team Members:</div>
    <div class="team-grid">
      <div>1. <strong>Nikhil Krishna R D</strong></div>
      <div>6. <strong>Neha Rose Biju</strong></div>
      <div>2. <strong>Nandana M</strong></div>
      <div>7. <strong>Abdul Hafeez</strong></div>
      <div>3. <strong>Aswin Arunkumar A</strong></div>
      <div>8. <strong>Gopika Vikas K</strong></div>
      <div>4. <strong>Anna M Paul</strong></div>
      <div>9. <strong>Rose Maria Jose</strong></div>
      <div>5. <strong>Jayasree AB</strong></div>
      <div>10. <strong>Jefin Jobi</strong></div>
    </div>
  </div>
</div>

<!-- SECTION 1 -->
<h2>1. Abstract</h2>
<p>
Traditional automated technical recruitment and assessment platforms focus exclusively on written syntax or static algorithmic puzzle solving (e.g., LeetCode, HackerRank). However, in high-stakes engineering interviews, candidates are primarily evaluated on their <strong>verbal articulation, trade-off reasoning under stress, and physical composure</strong>.
</p>
<p>
This project presents a <strong>Multimodal AI Technical Interview Coach</strong> engineered specifically for the domains of <strong>Computer Vision (CV)</strong>, <strong>Image Mining (IM)</strong>, and <strong>Acoustic Signal Processing</strong>. The system ingests continuous video streams from a standard client-side optical sensor (webcam), performs 3D facial landmark extraction, determines scale-invariant pupil vectors to compute an <strong>Eye Contact Ratio (ECR)</strong>, and solves the <strong>Perspective-n-Point (PnP)</strong> problem to track 3D head rotation and compute a <strong>Head Stability Index (HSI)</strong>. Visual telemetry is synchronously mined alongside speech acoustics (cadence in Words-Per-Minute, filler-word frequency) and semantic reasoning powered by Groq Llama 3.3 70B. Furthermore, the AI interviewer is equipped with natural conversational voice generation powered by <strong>Sarvam AI's Sovereign Indian Text-to-Speech Engine (Bulbul v1)</strong>, delivering human-like Indian-accented verbal questioning. All multimodal features are fused into a deterministic <strong>Composite Hireability Index (CHI)</strong>, generating actionable candidate scorecards with zero subjective interviewer bias.
</p>

<!-- SECTION 2 -->
<h2>2. Introduction & Background</h2>
<p>
In both university academic vivas and corporate engineering recruitment bar-raiser interviews, non-verbal indicators convey essential signals regarding candidate mastery, cognitive load, and honesty. <strong>Computer Vision</strong> enables automated extraction of spatial geometric features from video frames, while <strong>Image Mining</strong> focuses on extracting temporal trends, motion patterns, and behavioral anomalies over continuous visual streams.
</p>
<p>
Existing assessment platforms suffer from three severe technological limitations:
</p>
<ul>
  <li><strong>Visual Telemetry Blindness:</strong> Automated code testing tools evaluate static code submissions, ignoring candidate eye contact, nervous shifting, and physical composure.</li>
  <li><strong>Prohibitive Cloud Streaming Latency & GPU Cost:</strong> Transmitting continuous 1080p raw video feeds to high-cost cloud GPU servers introduces significant bandwidth bottlenecks (&gt;3.5 Mbps upstream per candidate) and network latency exceeding 2.5 seconds, disrupting real-time conversational rapport.</li>
  <li><strong>Acoustic & Cultural Disconnect:</strong> Commercial Western TTS engines sound unnatural in Indian campus hiring environments and college viva panels, lacking native phonetic inflection.</li>
</ul>
<p>
To resolve these bottlenecks, our team engineered an edge-computed visual telemetry architecture running directly on the client browser/WASM layer, synthesized with <strong>Sarvam AI's Indic Bulbul v1 TTS</strong>, to produce a robust, objective interview intelligence platform.
</p>

<!-- SECTION 3 -->
<h2>3. Problem Statement & Research Objectives</h2>
<p><strong>Problem Statement:</strong> <em>To design and implement an end-to-end Computer Vision and Image Mining pipeline capable of analyzing continuous video feeds from commodity webcams during a technical interview, quantifying candidate engagement (gaze stability) and composure (head jitter) in real time without specialized hardware, and synthesizing these visual indicators with acoustic prosody and technical depth into a unified hireability metric.</em></p>

<h3>Core Research Objectives:</h3>
<ul>
  <li><strong>Objective 1 (3D Computer Vision Geometry):</strong> Localize 468 metric facial landmarks, isolate iris boundaries and canthi, and compute a scale-invariant horizontal gaze ratio &rho; to derive a continuous Eye Contact Ratio (ECR &isin; [0.0, 1.0]).</li>
  <li><strong>Objective 2 (Temporal Image Mining):</strong> Mine spatio-temporal posture jitter across a sliding temporal frame window (W = 30 frames) to discover fidgeting patterns and compute an objective Head Stability Index (HSI &isin; [0, 100]).</li>
  <li><strong>Objective 3 (Acoustic Processing & Sarvam AI Integration):</strong> Extract speech prosody metrics (cadence WPM, pause durations, filler words) and integrate <strong>Sarvam AI (Bulbul v1)</strong> to synthesize authentic Indian-accented spoken questions.</li>
  <li><strong>Objective 4 (Mathematical Multi-Criteria Fusion):</strong> Integrate Technical Content (50%), Speech Cadence (25%), and Visual Non-Verbal Composure (25%) into a bounded Composite Hireability Index (CHI).</li>
</ul>

<div class="page-break"></div>

<!-- SECTION 4 -->
<h2>4. System Architecture & Multimodal Pipeline</h2>
<p>
The system executes a real-time multimodal loop bridging client-side optical capture, lightweight geometric vision analysis, acoustic analysis, and sovereign voice generation:
</p>

<table>
  <thead>
    <tr>
      <th>Pipeline Stage</th>
      <th>Primary Sensor / Input</th>
      <th>Processing Engine</th>
      <th>Mined Output Telemetry</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. Optical Frame Grabber</strong></td>
      <td>Webcam Video (30 FPS, RGB)</td>
      <td>HTML5 Canvas & CLAHE Preprocessing</td>
      <td>Normalized Grayscale & Contrast-Enhanced Frames</td>
    </tr>
    <tr>
      <td><strong>2. 3D Facial Mesh</strong></td>
      <td>Processed Frame (640&times;480)</td>
      <td>Deep CNN 3D Regression Mesh</td>
      <td>468 3D Spatial Landmarks (X, Y, Z)</td>
    </tr>
    <tr>
      <td><strong>3. Gaze & Iris Mining</strong></td>
      <td>Eye Landmark Subsets</td>
      <td>Intensity Centroid & Canthus Ratio Geometry</td>
      <td>Gaze Lock Status & Eye Contact Ratio (ECR)</td>
    </tr>
    <tr>
      <td><strong>4. Head Pose Tracking</strong></td>
      <td>Canonical Face Points</td>
      <td>Perspective-n-Point (PnP) Solver</td>
      <td>Euler Angles (Yaw, Pitch, Roll)</td>
    </tr>
    <tr>
      <td><strong>5. Temporal Posture Mining</strong></td>
      <td>Frame Sequence (W=30)</td>
      <td>Spatio-Temporal Variance & Peak Classifier</td>
      <td>Head Stability Index (HSI: 0-100)</td>
    </tr>
    <tr>
      <td><strong>6. Speech Acoustics</strong></td>
      <td>Microphone Audio Feed</td>
      <td>Whisper STT & Tokenizer Regex</td>
      <td>Cadence (WPM), Filler Count, Silence Latency</td>
    </tr>
    <tr>
      <td><strong>7. Indic Voice Engine</strong></td>
      <td>Generated Question Text</td>
      <td>Sarvam AI Bulbul v1 TTS API</td>
      <td>Indian English (en-IN) Audio Stream</td>
    </tr>
    <tr>
      <td><strong>8. Multi-Criteria Fusion</strong></td>
      <td>All Modality Tensors</td>
      <td>Deterministic CHI Scoring Engine</td>
      <td>Composite Score (0-100) & Committee Verdict</td>
    </tr>
  </tbody>
</table>

<!-- SECTION 5 -->
<h2>5. Computer Vision Algorithms & Image Mining Methodology</h2>

<h3>5.1 Optical Enhancement & Preprocessing</h3>
<p>
Raw video frames captured from commodity webcams exhibit sensor noise and lighting variations. Each incoming frame I(x, y, t) undergoes spatial bilinear downsampling to 640&times;480 resolution followed by <strong>Contrast-Limited Adaptive Histogram Equalization (CLAHE)</strong> applied on the luminance channel. This enhances iris-sclera gradient contrast without blowing out highlight regions.
</p>

<h3>5.2 3D Facial Landmark Localization</h3>
<p>
The system deploys a two-stage deep regression model:
</p>
<ol>
  <li>A single-shot detector identifies the candidate's facial bounding box.</li>
  <li>A dense 3D mesh network estimates <strong>468 metric facial landmark vertices</strong> (P<sub>i</sub> = (x<sub>i</sub>, y<sub>i</sub>, z<sub>i</sub>)). Coordinates x<sub>i</sub>, y<sub>i</sub> are normalized to image space while z<sub>i</sub> represents relative anthropometric depth.</li>
</ol>
<p>
Key landmark indices mined: Left Eye ({33, 133, 160, 158, 153, 144}), Right Eye ({362, 263, 385, 387, 373, 380}), Nose Tip ({1}), Chin ({152}), and Mouth Corners ({61, 291}).
</p>

<h3>5.3 Eye Gaze Estimation & Pupil Center Localization</h3>
<p>
To assess engagement without infrared eye-tracking hardware, we compute the <strong>Scale-Invariant Gaze Displacement Ratio</strong>:
</p>
<div class="formula-box">
  <div class="formula-title">Pupil Intensity Centroid & Horizontal Ratio Formulation</div>
  C_pupil = ( &sum; x &middot; (255 - I(x,y)) / &sum; (255 - I(x,y)),  &sum; y &middot; (255 - I(x,y)) / &sum; (255 - I(x,y)) )<br>
  &rho;_horizontal = || C_pupil - C_inner ||_2 / || C_outer - C_inner ||_2
</div>
<p>
A gaze vector is classified as <strong>"Camera-Locked"</strong> when &rho;_horizontal &isin; [0.42, 0.58]. Over a session of N total frames, the continuous <strong>Eye Contact Ratio (ECR)</strong> is calculated as:
</p>
<div class="formula-box">
  <div class="formula-title">Eye Contact Ratio (ECR)</div>
  ECR = (1 / N) &middot; &sum;_{k=1}^N  &Iopf;( Gaze_Locked(k) )  &isin; [0.0, 1.0]
</div>

<h3>5.4 3D Head Pose Estimation via Perspective-n-Point (PnP)</h3>
<p>
Relying solely on 2D bounding boxes introduces severe error when a candidate turns their head while looking sideways. To determine true 3D orientation, we formulate the <strong>Perspective-n-Point (PnP)</strong> problem using a canonical anthropometric facial model M<sub>3D</sub> and the pinhole camera intrinsic matrix K:
</p>
<div class="formula-box">
  <div class="formula-title">PnP Projection Equation</div>
  s &middot; [ u, v, 1 ]^T = K &middot; [ R | t ] &middot; [ X, Y, Z, 1 ]^T
</div>
<p>
Solving via the Levenberg-Marquardt algorithm decomposes rotation matrix R &isin; SO(3) into Euler angles: <strong>Yaw (&theta;)</strong>, <strong>Pitch (&psi;)</strong>, and <strong>Roll (&phi;)</strong>.
</p>

<h3>5.5 Spatio-Temporal Micro-Fidget & Posture Drift Mining</h3>
<p>
Rather than analyzing isolated frames, our Image Mining module evaluates movement variance across time:
</p>
<ol>
  <li>Tracks displacement deltas &Delta;p<sub>t</sub> = || p<sub>t</sub> - p<sub>t-1</sub> ||<sub>2</sub> of the 3D nose anchor.</li>
  <li>Applies an Exponential Moving Average (EMA) with smoothing coefficient &alpha; = 0.70 to suppress optical sensor jitter:
    <div class="formula-box">
      p_smoothed(t) = &alpha; &middot; p(t) + (1 - &alpha;) &middot; p_smoothed(t-1)
    </div>
  </li>
  <li>Derives the normalized <strong>Head Stability Index (HSI)</strong> penalizing frantic movement and posture drift:
    <div class="formula-box">
      <div class="formula-title">Head Stability Index (HSI) Formulation</div>
      HSI = max( 0, 100 - ( (&lambda; / T) &middot; &sum; || &Delta;p_t ||_2  +  &gamma; &middot; std(&theta;, &psi;, &phi;) ) )
    </div>
    where calibration scalars &lambda; = 1.25 and &gamma; = 0.85 normalize the score between 0 and 100.
  </li>
</ol>

<div class="page-break"></div>

<!-- SECTION 6 -->
<h2>6. Sovereign Voice Synthesis via Sarvam AI (Bulbul v1)</h2>
<p>
A key innovation in the interview coach module is the replacement of robotic default speech synthesizers with <strong>Sarvam AI's Bulbul v1 Sovereign Indic Voice Engine</strong>.
</p>
<div class="callout-box">
  <div class="callout-title">Why Sarvam AI is Essential for Indian Technical Interviews:</div>
  Traditional Western TTS platforms (ElevenLabs, OpenAI TTS) struggle with Indian phonetic inflections and English terminology pronounced in Indian engineering contexts. Sarvam AI's models are trained on native Indic conversational corpuses, providing authentic, human-like Indian-accented English (<code>en-IN</code>) with natural pause rhythms and intonation.
</div>

<h3>Integration Architecture & Voice Delivery:</h3>
<ul>
  <li><strong>API Endpoint:</strong> <code>https://api.sarvam.ai/text-to-speech</code> (REST JSON protocol).</li>
  <li><strong>Target Language Code:</strong> <code>en-IN</code> (Indian-accented English).</li>
  <li><strong>Voice Personas:</strong> <code>"arvind"</code> (Male Technical Lead) and <code>"meera"</code> (Female Senior Engineering Manager).</li>
  <li><strong>Audio Output:</strong> 22,050 Hz high-fidelity WAV streamed as base64 and played automatically via HTML5 Web Audio.</li>
  <li><strong>Resilient Fallback Design:</strong> If network connectivity drops or API quotas expire, the platform seamlessly switches to browser-native Web Speech API (<code>window.speechSynthesis</code>), guaranteeing that the viva demonstration never fails or crashes.</li>
</ul>

<!-- SECTION 7 -->
<h2>7. Mathematical Evaluation Framework: Composite Hireability Index (CHI)</h2>
<p>
The final evaluation report fuses all mined dimensions into an objective, deterministic score:
</p>
<div class="formula-box">
  <div class="formula-title">Composite Hireability Index (CHI)</div>
  CHI = 0.50 &middot; S_tech + 0.25 &middot; S_vocal + 0.25 &middot; S_nonverbal
</div>

<h3>7.1 Mathematical Sub-Score Breakdown</h3>
<ul>
  <li><strong>Technical Content Score (S<sub>tech</sub> &isin; [0, 100]):</strong>
    <p>S<sub>tech</sub> = 0.60 &middot; SemanticAccuracy + 0.40 &middot; ArchitecturalDepth</p>
    Computed via Groq Llama 3.3 70B structured entity extraction against domain ontology rubrics.
  </li>
  <li><strong>Vocal Delivery Score (S<sub>vocal</sub> &isin; [0, 100]):</strong>
    <div class="formula-box">
      S_vocal = 100 - &Delta;_cadence - P_filler - P_pause
    </div>
    Optimal cadence bandwidth is <strong>120 &le; WPM &le; 165</strong>. Cadence outside this band is penalized by 0.45 pts/WPM. Filler words (<em>"um"</em>, <em>"uh"</em>, <em>"like"</em>, <em>"basically"</em>) trigger a 4.0 pt penalty each.
  </li>
  <li><strong>Non-Verbal Composure Score (S<sub>nonverbal</sub> &isin; [0, 100]):</strong>
    <div class="formula-box">
      S_nonverbal = ( ECR &middot; 60.0 ) + ( HSI &middot; 0.40 )
    </div>
    Eye Contact Ratio contributes 60%, while 3D Head Stability contributes 40%.
  </li>
</ul>

<h3>7.2 Committee Verdict Tiers</h3>
<table>
  <thead>
    <tr>
      <th>CHI Score Range</th>
      <th>Committee Verdict</th>
      <th>Industrial Interpretation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>&ge; 85.0</td>
      <td><span class="badge badge-success">Strong Hire</span></td>
      <td>Exemplary technical depth, crisp vocal cadence, confident eye contact.</td>
    </tr>
    <tr>
      <td>70.0 &ndash; 84.9</td>
      <td><span class="badge badge-success">Hire</span></td>
      <td>Solid domain competency and professional non-verbal composure.</td>
    </tr>
    <tr>
      <td>55.0 &ndash; 69.9</td>
      <td><span class="badge badge-info">Leaning Hire</span></td>
      <td>Acceptable baseline with minor cadence or edge-case gaps.</td>
    </tr>
    <tr>
      <td>40.0 &ndash; 54.9</td>
      <td><span class="badge badge-warning">Needs Improvement</span></td>
      <td>Noticeable technical omissions, vocal hesitations, or posture drift.</td>
    </tr>
    <tr>
      <td>&lt; 40.0</td>
      <td><span class="badge" style="background:#fee2e2;color:#991b1b;">Do Not Hire</span></td>
      <td>Critical failures in architecture, extreme nervous evasion, or silence.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<!-- SECTION 8 -->
<h2>8. Experimental Results & Visual Analysis</h2>
<p>
The system was tested through live mock interview sessions on the Aspire AI platform. Below are empirical visual findings from actual candidate evaluation runs.
</p>

<h3>8.1 Real-Time Candidate Video & Speech Telemetry HUD</h3>
<div class="figure-card">
  <img src="__FIG1_B64__" alt="Figure 1: Live Multimodal Interview Stage">
  <div class="figure-caption">Figure 1: Live Multimodal Technical Interview Stage (/interview-coach) displaying candidate video feed, active Eye Contact Gaze (87%), Head Stability (90/100), and real-time audio telemetry.</div>
</div>

<p><strong>Analysis of Live Stage Telemetry (Figure 1):</strong></p>
<ul>
  <li><strong>Target Role & Topic:</strong> AI/RAG Systems Engineer — Vector Embeddings & HNSW Retrieval (Junior Level).</li>
  <li><strong>Real-Time Dynamic Scenario:</strong> <em>"In a Senior Backend Engineer environment handling Distributed Systems & Partitioning, how would you architect a resilient, fault-tolerant asynchronous processing pipeline that guarantees exactly-once semantics or idempotent execution under network partitions?"</em></li>
  <li><strong>Computer Vision Tracking:</strong>
    <ul>
      <li><strong>Eye Contact Gaze:</strong> <code>87%</code> (active gaze locked onto the camera lens).</li>
      <li><strong>Head Stability:</strong> <code>90 / 100</code> (high composure, minimal fidgeting or erratic motion).</li>
    </ul>
  </li>
  <li><strong>Speech Telemetry:</strong> 0 WPM registered during the initial reading phase prior to candidate articulation.</li>
</ul>

<h3>8.2 Multi-Modal Evaluation Scorecard & Mathematical Verification</h3>
<div class="figure-card">
  <img src="__FIG2_B64__" alt="Figure 2: Official Multi-Modal Evaluation Report">
  <div class="figure-caption">Figure 2: Official Multi-Modal Evaluation Report (ID: rep-5ef93e0ab5) showing CHI of 53.5 ("Needs Improvement"), combining Technical (37), Vocal (52), and Non-Verbal Poise (88.2).</div>
</div>

<div class="page-break"></div>

<p><strong>Mathematical Verification of Experimental Output (Figure 2):</strong></p>
<ul>
  <li><strong>Computer Vision Sub-Score:</strong> ECR = 0.87, HSI = 90.
    <div class="formula-box">
      S_nonverbal = (0.87 &times; 60.0) + (90 &times; 0.40) = 52.2 + 36.0 = 88.2 / 100
    </div>
    The scorecard displays exactly <strong>88.2 / 100</strong>, empirically validating the formula.
  </li>
  <li><strong>Vocal Delivery Sub-Score:</strong> Candidate spoke at an average cadence of <strong>13.3 WPM</strong> (classified as <em>"Too Slow"</em> against the 120-165 WPM benchmark), incurring cadence penalties yielding <strong>52 / 100</strong>.</li>
  <li><strong>Technical Accuracy:</strong> Brief conceptual response with missing distributed systems edge cases scored <strong>37 / 100</strong>.</li>
  <li><strong>Final Composite Hireability Index (CHI):</strong>
    <div class="formula-box">
      CHI = (0.50 &times; 37) + (0.25 &times; 52) + (0.25 &times; 88.2) = 18.5 + 13.0 + 22.05 = 53.55 &approx; 53.5 / 100
    </div>
    Mapped to committee verdict: <span class="badge badge-warning">Needs Improvement</span>.
  </li>
</ul>

<h3>8.3 Actionable Technical Blindspots & Model Senior Response</h3>
<div class="figure-card">
  <img src="__FIG3_B64__" alt="Figure 3: Technical Blindspot Diagnostics and Model Answer">
  <div class="figure-caption">Figure 3: Automated Technical Strengths, Actionable Blindspots, and Model Senior-Level Response generated by the adaptive coaching engine.</div>
</div>

<p><strong>Diagnostic Insights (Figure 3):</strong></p>
<ul>
  <li><strong>Observed Strengths:</strong> Candidate maintained good visual engagement and physical composure throughout the questioning phase.</li>
  <li><strong>Actionable Improvements Identified:</strong> The candidate omitted concrete persistence guarantees (e.g., replication factor quorum writes), unique idempotency keys, and dead-letter queues.</li>
  <li><strong>Model Senior-Level Response:</strong> Generates a full production-grade reference answer to accelerate candidate learning and technical vocabulary mastery.</li>
</ul>

<!-- SECTION 9 -->
<h2>9. Conclusion & Future Research Directions</h2>

<h3>9.1 Conclusion</h3>
<p>
This project demonstrates that <strong>Computer Vision</strong> and <strong>Image Mining</strong> techniques can be effectively harnessed to eliminate subjectivity in technical interviews. By mining 3D facial landmarks, computing scale-invariant gaze vectors, solving the Perspective-n-Point pose problem, and tracking temporal micro-fidgets, the system reliably evaluates non-verbal poise. Coupling this visual intelligence with <strong>Sarvam AI's Sovereign Indic Voice Synthesis</strong> and the mathematical Composite Hireability Index (CHI) creates an end-to-end, bias-free interview coach capable of running standalone via Streamlit for academic project defense or mounted into enterprise platforms.
</p>

<h3>9.2 Future Research Directions</h3>
<ol>
  <li><strong>Facial Action Coding System (FACS) Mining:</strong> Classify subtle emotional micro-expressions by mining Action Units (e.g., AU4 brow furrowing, AU12 zygomatic major smile activation) to track cognitive overload under difficult technical traps.</li>
  <li><strong>WebGPU Shader Acceleration:</strong> Compile landmark regression meshes directly to WebGPU compute pipelines, enabling 60+ FPS edge inference on ultra-low-power consumer hardware.</li>
  <li><strong>Multi-Speaker Diarization:</strong> Expand acoustic and visual tracking to support multi-person panel interviews with automatic speaker visual focus switching.</li>
</ol>

</body>
</html>
"""

def generate_pdf():
    base_dir = Path(r"d:\AI-Skill")
    assets_dir = base_dir / "services" / "interview_coach" / "report_assets"
    
    fig1_b64 = img_to_base64(assets_dir / "figure1_live_studio.png")
    fig2_b64 = img_to_base64(assets_dir / "figure2_scorecard.png")
    fig3_b64 = img_to_base64(assets_dir / "figure3_recommendations.png")

    html_content = (
        HTML_TEMPLATE
        .replace("__FIG1_B64__", fig1_b64)
        .replace("__FIG2_B64__", fig2_b64)
        .replace("__FIG3_B64__", fig3_b64)
    )

    temp_html_path = base_dir / "services" / "interview_coach" / "report_temp.html"
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    output_pdf_path = base_dir / "services" / "interview_coach" / "IMCV_AI_Interview_Coach_Project_Report.pdf"
    
    print("Launching Chromium via Playwright to generate PDF...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(temp_html_path.as_uri(), wait_until="networkidle")
        page.pdf(
            path=str(output_pdf_path),
            format="A4",
            print_background=True,
            margin={
                "top": "15mm",
                "bottom": "18mm",
                "left": "15mm",
                "right": "15mm"
            }
        )
        browser.close()
    
    print(f"PDF generated successfully at: {output_pdf_path}")
    print(f"File size: {output_pdf_path.stat().st_size} bytes")
    
    # Also copy to root for easy user download/access
    root_pdf_path = base_dir / "IMCV_AI_Interview_Coach_Project_Report.pdf"
    with open(output_pdf_path, "rb") as src, open(root_pdf_path, "wb") as dst:
        dst.write(src.read())
    print(f"Copied to root directory at: {root_pdf_path}")

    # Clean up temp html
    if temp_html_path.exists():
        temp_html_path.unlink()

if __name__ == "__main__":
    generate_pdf()
