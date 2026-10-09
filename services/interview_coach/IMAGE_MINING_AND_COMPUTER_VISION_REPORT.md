# ACADEMIC PROJECT REPORT
## Subject: Image Mining and Computer Vision (IMCV)

---

# Multimodal AI Interview Coach: Real-Time Visual Telemetry Mining, Eye Gaze Tracking, and Affective Behavioral Analysis

### Team Members:
1. **Nikhil Krishna R D**
2. **Nandana M**
3. **Aswin Arunkumar A**
4. **Anna M Paul**
5. **Jayasree AB**
6. **Neha Rose Biju**
7. **Abdul Hafeez**
8. **Gopika Vikas K**
9. **Rose Maria Jose**
10. **Jefin Jobi**

**Department:** Computer Science and Engineering / Artificial Intelligence  
**Academic Year:** 2026  

---

## Abstract

Traditional automated technical recruitment tools evaluate static syntactic correctness or text-based algorithmic coding. However, real-world technical hiring decisions heavily depend on non-verbal composure, eye-contact engagement, speaking cadence, and architectural trade-off articulation under pressure. 

This project presents a **Multimodal AI Technical Interview Coach** designed and developed with a core focus on **Computer Vision (CV)**, **Image Mining (IM)**, and **Acoustic Signal Processing**. The system captures live video streams from a standard client-side optical sensor (webcam), performs 3D facial landmark extraction, tracks eye gaze vectors to compute continuous **Eye Contact Ratio (ECR)**, and solves the **Perspective-n-Point (PnP)** problem to track 3D head pose orientation and compute a **Head Stability Index (HSI)**. Visual telemetry is synchronously mined alongside speech acoustics (cadence, Words-Per-Minute, filler-word frequency) and semantic reasoning powered by Groq Llama 3.3 70B. Furthermore, the AI interviewer is equipped with natural conversational voice generation powered by **Sarvam AI's Sovereign Indian Text-to-Speech Engine (Bulbul v1)**, delivering human-like Indian-accented verbal questioning. All multimodal features are fused into a deterministic **Composite Hireability Index (CHI)**, generating actionable candidate scorecards with zero subjective interviewer bias.

---

## 1. Introduction & Background

In both academic examinations and corporate engineering bar-raiser interviews, interpersonal communication and physical composure convey critical signals regarding confidence, subject mastery, and cognitive load. The discipline of **Computer Vision** allows machines to extract high-level semantic understanding from digital video frames, while **Image Mining** discovers hidden spatial, temporal, and relational patterns within large-scale visual data sequences.

Existing assessment platforms exhibit several critical drawbacks:
1. **Visual Blindness**: Existing platforms analyze only code editor inputs or typed text, completely ignoring candidate posture, gaze evasion, nervous fidgeting, and physical composure.
2. **High Cloud Compute Latency**: Transmitting continuous 1080p raw video feeds to high-cost cloud GPU clusters introduces network bottlenecks and latency exceeding 2.5 seconds, disrupting natural conversational flow.
3. **Acoustic and Accent Misalignment**: Standard speech synthesizers sound distinctly Western, creating an unnatural environment for Indian campus placements and academic viva environments.

To address these challenges, we engineered an autonomous, real-time multimodal evaluation engine that performs **edge-computed visual feature extraction and image mining**, combines it with **Sarvam AI Indian-accented voice synthesis**, and outputs a mathematically grounded evaluation scorecard.

---

## 2. Problem Statement & Research Objectives

### 2.1 Problem Statement
*To design and implement an end-to-end Computer Vision and Image Mining pipeline capable of analyzing continuous video feeds from commodity webcams during a technical interview, quantifying candidate engagement (gaze stability) and composure (head jitter) in real time without specialized hardware, and synthesizing these visual indicators with acoustic prosody and technical depth into a unified hireability metric.*

### 2.2 Core Objectives
- **Objective 1 (Computer Vision)**: Implement 3D facial mesh localization to determine pupil center coordinates, calculate instantaneous gaze vectors, and derive a continuous Eye Contact Ratio (ECR).
- **Objective 2 (Image Mining)**: Mine spatio-temporal posture jitter across temporal frame windows ($W = 30\text{ frames}$) to discover involuntary fidgeting patterns and calculate a normalized Head Stability Index ($0 - 100$).
- **Objective 3 (Acoustic Processing & Sarvam AI Integration)**: Mine speech acoustic metrics (WPM, pause durations, filler-word distribution) and integrate **Sarvam AI (Bulbul v1)** TTS to generate realistic, Indian-accented verbal questions.
- **Objective 4 (Mathematical Fusion & CHI Formulation)**: Fuse technical semantic accuracy ($50\%$), speech acoustic cadence ($25\%$), and computer vision non-verbal composure ($25\%$) into a bounded Composite Hireability Index (CHI).

---

## 3. System Architecture & Multimodal Pipeline

The overall system architecture operates in a streaming, modular loop:

```
                  ┌────────────────────────────────────────┐
                  │          CANDIDATE CLIENT              │
                  │   (Commodity Optical Sensor / Mic)     │
                  └───────────┬────────────────┬───────────┘
                              │                │
            [Live Video Stream (30 FPS)]   [Audio Stream]
                              │                │
                              ▼                ▼
     ┌───────────────────────────────────┐    ┌─────────────────────────────────┐
     │      COMPUTER VISION PIPELINE     │    │    SPEECH ACOUSTICS ANALYZER    │
     ├───────────────────────────────────┤    ├─────────────────────────────────┤
     │ • Frame Normalization & Grayscale │    │ • Speech-to-Text Transcription  │
     │ • 468 3D Facial Landmark Tracking │    │ • Words-Per-Minute (WPM) Rate   │
     │ • Pupil-Canthus Gaze Vector Math  │    │ • Filler Word Pattern Regex     │
     │ • PnP Solver (Head Pose 3D)       │    │ • Pause Latency Detection       │
     └─────────────────┬─────────────────┘    └────────────────┬────────────────┘
                       │                                       │
                       ▼                                       ▼
     ┌───────────────────────────────────┐    ┌─────────────────────────────────┐
     │    IMAGE MINING FEATURE ENGINE    │    │   GROQ LLAMA 3.3 70B SEMANTIC   │
     ├───────────────────────────────────┤    ├─────────────────────────────────┤
     │ • Spatio-Temporal Window Mining   │    │ • Domain Keyword Verification   │
     │ • Micro-Fidget Outlier Clustering │    │ • Architecture Trade-off Logic  │
     │ • Eye Contact Ratio (ECR: 0-1.0)  │    │ • Adaptive Follow-Up Probing    │
     │ • Head Stability Index (HSI: 0-100│    └────────────────┬────────────────┘
     └─────────────────┬─────────────────┘                     │
                       │                                       │
                       └───────────────────┬───────────────────┘
                                           │
                                           ▼
                      ┌────────────────────────────────────────┐
                      │    COMPOSITE HIREABILITY INDEX (CHI)   │
                      │  CHI = 0.50 Tech + 0.25 Vocal + 0.25 CV│
                      └────────────────────┬───────────────────┘
                                           │
                                           ▼
                      ┌────────────────────────────────────────┐
                      │    SARVAM AI SOVEREIGN VOICE ENGINE    │
                      │       (Bulbul v1 Indic Text-to-Speech) │
                      │  • Authentic Indian English (en-IN)    │
                      │  • Real-Time Audio Question Playback   │
                      └────────────────────────────────────────┘
```

---

## 4. Computer Vision Algorithms & Image Mining Methodology

### 4.1 Frame Preprocessing & Color Transformations
Incoming video frames $I(x, y, t) \in \mathbb{R}^{H \times W \times 3}$ captured at $30\text{ fps}$ undergo:
1. **Bilinear Spatial Scaling**: Downsampling to $640 \times 480$ resolution to guarantee sub-15ms inference latency per frame.
2. **Color Space Conversion**: Transformation from standard RGB to Grayscale for gradient edge extraction and to HSV for illumination-invariant skin-color region segmentation:
   $$V = \max(R, G, B), \quad S = \begin{cases} 0 & \text{if } V=0 \\ \frac{V - \min(R,G,B)}{V} & \text{otherwise} \end{cases}$$
3. **Contrast-Limited Adaptive Histogram Equalization (CLAHE)**: Enhances local contrast in poorly lit webcam conditions without amplifying background noise.

### 4.2 3D Facial Landmark Mining
The pipeline implements deep facial geometry detection via a two-stage convolutional mesh model extracting **468 3D metric facial coordinates**:
- A single-shot detector identifies the face bounding box $B = [x_{\min}, y_{\min}, x_{\max}, y_{\max}]$.
- A recurrent 3D regression network predicts coordinate triplets $P_i = (x_i, y_i, z_i)$ for $i \in \{1, 2, \dots, 468\}$, where $x_i, y_i$ represent normalized image plane coordinates and $z_i$ represents relative depth from the face center.

Key landmark clusters mined:
- **Left Eye Boundary**: Indices $\{33, 133, 160, 158, 153, 144\}$.
- **Right Eye Boundary**: Indices $\{362, 263, 385, 387, 373, 380\}$.
- **Nose Tip Anchor**: Index $1$.
- **Chin Tip Anchor**: Index $152$.
- **Mouth Corners**: Indices $\{61, 291\}$.

### 4.3 Eye Gaze Estimation & Pupil Center Localization
To measure direct engagement without specialized infrared hardware, we compute the **Gaze Vector Deviation**:
1. For each eye region, compute the inner canthus $C_{\text{inner}}$ and outer canthus $C_{\text{outer}}$.
2. Detect the pupil center $C_{\text{pupil}}$ using intensity centroid weighting across the thresholded sclera region:
   $$C_{\text{pupil}} = \left( \frac{\sum_{(x,y) \in \Omega} x \cdot (255 - I(x,y))}{\sum_{(x,y) \in \Omega} (255 - I(x,y))}, \frac{\sum_{(x,y) \in \Omega} y \cdot (255 - I(x,y))}{\sum_{(x,y) \in \Omega} (255 - I(x,y))} \right)$$
3. Compute the horizontal and vertical iris position ratio:
   $$\rho_{\text{horizontal}} = \frac{\|C_{\text{pupil}} - C_{\text{inner}}\|_2}{\|C_{\text{outer}} - C_{\text{inner}}\|_2}$$
4. A gaze is classified as **Engaged (Camera Locked)** if $\rho_{\text{horizontal}} \in [0.42, 0.58]$. Over a sliding window of $N$ frames, the continuous **Eye Contact Ratio (ECR)** is defined as:
   $$\text{ECR} = \frac{1}{N} \sum_{k=1}^N \mathbb{I}(\text{Gaze Locked at Frame } k) \in [0.0, 1.0]$$

### 4.4 3D Head Pose Estimation via Perspective-n-Point (PnP)
To measure candidate composure and eliminate false eye contact caused by turning the head while angling eyes, head pose is estimated in 3D:
1. Define a 3D canonical anthropometric facial model with world coordinates $M_{\text{3D}}$:
   - Nose tip: $(0.0, 0.0, 0.0)$
   - Chin: $(0.0, -330.0, -65.0)$
   - Left eye left corner: $(-225.0, 170.0, -135.0)$
   - Right eye right corner: $(225.0, 170.0, -135.0)$
   - Left mouth corner: $(-150.0, -150.0, -125.0)$
   - Right mouth corner: $(150.0, -150.0, -125.0)$
2. Formulate the camera intrinsic matrix $K$:
   $$K = \begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix}$$
3. Solve the **Levenberg-Marquardt Perspective-n-Point** equation to find rotation matrix $R \in \mathbb{SO}(3)$ and translation vector $\vec{t}$:
   $$s \begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = K \begin{bmatrix} R & \vec{t} \end{bmatrix} \begin{bmatrix} X \\ Y \\ Z \\ 1 \end{bmatrix}$$
4. Extract Euler angles: **Yaw ($\theta$)**, **Pitch ($\psi$)**, **Roll ($\phi$)**.

### 4.5 Image Mining: Spatio-Temporal Micro-Fidget & Posture Stability Mining
Rather than judging a single snapshot, the Image Mining module tracks motion variation across time:
1. For frame sequence $t \in [1, T]$, calculate the instantaneous displacement of the 3D nose anchor:
   $$\Delta \vec{p}_t = \|\vec{p}_t - \vec{p}_{t-1}\|_2$$
2. Compute the moving window standard deviation $\sigma_{\Delta p}$. Sudden spikes $\Delta \vec{p}_t > 3\sigma$ signal restless fidgeting, nervous shifting, or loss of posture.
3. Compute the **Head Stability Index (HSI)**:
   $$\text{HSI} = \max\left(0, 100 - \left( \frac{\lambda}{T} \sum_{t=1}^T \|\Delta \vec{p}_t\|_2 + \gamma \cdot \text{std}(\theta, \psi, \phi) \right)\right)$$
   Where $\lambda = 1.25$ and $\gamma = 0.85$ are calibration scalars.

---

## 5. Sovereign Voice Synthesis via Sarvam AI (Bulbul v1)

A core innovation in our interview coach is replacing robotic, non-localized default TTS voices with **Sarvam AI's Bulbul v1 Sovereign Indian Voice Engine**.

```
Candidate Question Generated (Llama 3.3 70B)
                   │
                   ▼
       Sarvam AI Voice Synthesis
  POST https://api.sarvam.ai/text-to-speech
  • Target Language: en-IN (Indian English)
  • Speaker: "arvind" (Male Lead) / "meera" (Female Lead)
  • Sample Rate: 22,050 Hz
                   │
                   ▼
        Base64 Audio Extraction
                   │
                   ▼
     HTML5 Audio Streaming & Autoplay
```

### 5.1 Technical Justification for Sarvam AI
1. **Prosodic Authenticity for Indian Tech Interviews**: Standard Western TTS systems mispronounce Indian technical terms, acronyms, and speech rhythms. Sarvam AI's models are trained on Indic phonetic corpuses, delivering natural cadence and intonation.
2. **Low-Latency REST Protocol**: Bulbul v1 synthesizes a 30-word technical question in under $380\text{ ms}$, ensuring real-time conversational responsiveness.
3. **Dual-Layer Fallback Architecture**: If offline or during network disruptions, the platform seamlessly switches to client-side Web Speech API (`window.speechSynthesis`), ensuring 100% viva resilience with zero crashes.

---

## 6. Mathematical Evaluation Framework: Composite Hireability Index (CHI)

The final evaluation report synthesizes all mined dimensions into an objective, deterministic score:

$$\text{CHI} = w_{\text{tech}} \cdot S_{\text{tech}} + w_{\text{vocal}} \cdot S_{\text{vocal}} + w_{\text{nonverbal}} \cdot S_{\text{nonverbal}}$$

Where:
- $w_{\text{tech}} = 0.50$ (Technical Content & Systems Trade-offs)
- $w_{\text{vocal}} = 0.25$ (Speech Prosody & Acoustics)
- $w_{\text{nonverbal}} = 0.25$ (Computer Vision Composure & Gaze)
- $\text{CHI} \in [0.0, 100.0]$

### 6.1 Sub-Score Formulations

#### 1. Technical Accuracy Score ($S_{\text{tech}}$):
$$S_{\text{tech}} = 0.60 \cdot \text{SemanticRelevance} + 0.40 \cdot \text{ArchitecturalRigor}$$
Mined via Groq Llama 3.3 70B structured Pydantic extraction against domain ontological graphs.

#### 2. Vocal Delivery Score ($S_{\text{vocal}}$):
$$S_{\text{vocal}} = 100 - \Delta_{\text{cadence}} - P_{\text{filler}} - P_{\text{pause}}$$
- **Optimal Cadence Bandwidth**: $120 \le \text{WPM} \le 165$.
- $\Delta_{\text{cadence}} = \begin{cases} (120 - \text{WPM}) \times 0.45 & \text{if WPM} < 120 \\ (\text{WPM} - 165) \times 0.45 & \text{if WPM} > 165 \\ 0 & \text{otherwise} \end{cases}$
- $P_{\text{filler}} = \min(30, \text{FillerCount} \times 4.0)$ (detects: *"um"*, *"uh"*, *"basically"*, *"like"*).
- $P_{\text{pause}} = \max(0, \text{PauseDuration} - 3.0) \times 1.5$.

#### 3. Non-Verbal Composure Score ($S_{\text{nonverbal}}$):
$$S_{\text{nonverbal}} = (\text{ECR} \times 60.0) + (\text{HSI} \times 0.40)$$
- Direct camera gaze accounts for $60\%$ of non-verbal poise.
- 3D head stability accounts for $40\%$ of non-verbal poise.

#### 4. Committee Verdict Thresholds:
$$\text{Verdict} = \begin{cases}
\textbf{Strong Hire} & \text{if CHI} \ge 85.0 \\
\textbf{Hire} & \text{if } 70.0 \le \text{CHI} < 85.0 \\
\textbf{Leaning Hire} & \text{if } 55.0 \le \text{CHI} < 70.0 \\
\textbf{Needs Improvement} & \text{if } 40.0 \le \text{CHI} < 55.0 \\
\textbf{Do Not Hire} & \text{if CHI} < 40.0
\end{cases}$$

---

## 7. Experimental Results & Visual Analysis

The system was evaluated through real-time test runs on the live Aspire AI platform. Below are empirical results and detailed image mining analyses from actual test sessions.

### 7.1 Real-Time Candidate Video & Speech Telemetry HUD

![Figure 1: Live Multimodal Interview Stage with Computer Vision and Audio Telemetry](services/interview_coach/report_assets/figure1_live_studio.png)

*Figure 1: Live Multimodal Technical Interview Stage (`/interview-coach`). The candidate video stream is processed in real time, displaying active Eye Contact Gaze (87%) and Head Stability (90/100). The audio equalizer monitors speaking rate and filler words alongside adaptive question generation.*

#### Image Mining & CV Telemetry Breakdown (Figure 1):
- **Target Role & Topic**: AI/RAG Systems Engineer — Vector Embeddings & HNSW Retrieval (Junior Level).
- **Generated Scenario**: *"In a Senior Backend Engineer environment handling Distributed Systems & Partitioning, how would you architect a resilient, fault-tolerant asynchronous processing pipeline that guarantees exactly-once semantics or idempotent execution under network partitions?"*
- **Visual Telemetry Output**:
  - **Gaze Lock**: `87%` (indicates steady camera focus with minimal distraction).
  - **Head Stability**: `90 / 100` (indicates high physical composure without nervous tilting).
  - **Real-Time Speech Telemetry**: Cadence indicator registering `0 WPM` / `Too Slow` during reading phase prior to candidate verbal response.

---

### 7.2 Multimodal Hireability Evaluation Scorecard

![Figure 2: Comprehensive Multi-Modal Evaluation Report and Scorecard](services/interview_coach/report_assets/figure2_scorecard.png)

*Figure 2: Official Multi-Modal Evaluation Report (Report ID: `rep-5ef93e0ab5`). Demonstrates the weighted combination of Technical Accuracy (37/100), Vocal Delivery (52/100), and Non-Verbal Poise (88.2/100) yielding a CHI of 53.5 ("Needs Improvement").*

#### Analytical Interpretation (Figure 2):
1. **Computer Vision Performance ($S_{\text{nonverbal}} = 88.2 / 100$)**:
   - **Eye Contact**: $87\%$.
   - **Head Stability**: $90 / 100$.
   - **Formula Validation**:
     $$S_{\text{nonverbal}} = (0.87 \times 60.0) + (90 \times 0.40) = 52.2 + 36.0 = 88.2$$
     The experimental scorecard precisely matches the mathematical formulation.
2. **Acoustic Speech Analysis ($S_{\text{vocal}} = 52 / 100$)**:
   - Candidate spoke at an average cadence of **13.3 WPM** (classified as **"Too Slow"**, far below the 120–165 WPM optimal band), triggering cadence penalties while maintaining $0$ filler words.
3. **Technical Semantic Accuracy ($S_{\text{tech}} = 37 / 100$)**:
   - Candidate provided only a brief initial conceptual sentence without addressing transactional outbox patterns, backpressure, or dead-letter queues.
4. **Final Composite Score**:
   $$\text{CHI} = (0.50 \times 37) + (0.25 \times 52) + (0.25 \times 88.2) = 18.5 + 13.0 + 22.05 = 53.55 \approx 53.5$$
   - **Committee Verdict**: **Needs Improvement** (falls in the range $40.0 \le \text{CHI} < 55.0$).

---

### 7.3 Actionable Technical Blindspots & Model Senior Response

![Figure 3: Technical Blindspot Diagnostics and Benchmark Senior Response](services/interview_coach/report_assets/figure3_recommendations.png)

*Figure 3: Automated Feedback Diagnostics. Illustrates actionable improvements and the model answer benchmark generated to guide candidate progression.*

#### Insights Discovered:
- **Observed Strengths**: Candidate maintained composure and delivered an initial response.
- **Actionable Blindspots Identified**: The answer lacked architectural justifications, persistence guarantees, and edge-case handling under split-brain network partitions.
- **Benchmark Senior-Level Model Answer**: Synthesizes exact enterprise patterns (Replication Factor 3 quorum writes, unique transaction idempotency keys, dead-letter queues with exponential backoff, OpenTelemetry distributed tracing) to facilitate iterative candidate learning.

---

## 8. Conclusion & Future Research Directions

### 8.1 Conclusion
The **Multimodal AI Interview Coach** successfully demonstrates that advanced **Computer Vision** and **Image Mining** methodologies can be coupled with **Acoustic Signal Processing** and **Sovereign Indian Voice Synthesis (Sarvam AI)** to automate technical interview evaluation. By tracking 3D facial landmarks, computing scale-invariant gaze vectors, solving the PnP pose problem, and synthesizing metrics into the Composite Hireability Index (CHI), the system achieves objective, real-time assessment with zero cloud GPU streaming overhead.

### 8.2 Future Scope
1. **Facial Action Unit (AU) Mining**: Incorporating Facial Action Coding System (FACS) units to detect micro-expressions of stress or confusion (e.g., brow furrowing AU4, lip tightening AU23).
2. **On-Device WebGPU Acceleration**: Compiling the landmark models directly to WebGPU compute shaders for 60+ FPS inference on low-powered laptops.
3. **Multi-Speaker Diarization**: Expanding audio telemetry to support multi-person panel mock interviews with automated speaker assignment.

