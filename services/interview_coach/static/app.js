// Aspire AI Interview Coach - Standalone Client Script

let activeQuestion = null;
let isRecording = false;
let recognition = null;
let recordingStartTime = 0;
let timerInterval = null;
let durationSeconds = 25.0;

const roleSelect = document.getElementById("roleSelect");
const difficultySelect = document.getElementById("difficultySelect");
const btnGenerate = document.getElementById("btnGenerateQuestion");
const questionBox = document.getElementById("questionBox");
const questionText = document.getElementById("questionText");
const hintsContainer = document.getElementById("hintsContainer");
const btnSpeak = document.getElementById("btnSpeakQuestion");

const btnRecord = document.getElementById("btnRecordToggle");
const recordingStatus = document.getElementById("recordingStatus");
const timerDisplay = document.getElementById("timerDisplay");
const transcriptInput = document.getElementById("transcriptInput");
const btnFollowUp = document.getElementById("btnTriggerFollowUp");
const btnEvaluate = document.getElementById("btnEvaluateAnswer");
const followUpBox = document.getElementById("followUpBox");
const followUpText = document.getElementById("followUpText");

const webcamPreview = document.getElementById("webcamPreview");
const metricWpm = document.getElementById("metricWpm");
const metricFillers = document.getElementById("metricFillers");
const metricFillerTics = document.getElementById("metricFillerTics");
const evaluationSection = document.getElementById("evaluationSection");

// 1. Initialize Webcam
async function initWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    webcamPreview.srcObject = stream;
  } catch (err) {
    console.warn("Webcam access denied or unavailable, operating in telemetry simulation mode:", err);
  }
}
initWebcam();

// 2. Initialize Speech Recognition (Web Speech API)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      interim += event.results[i][0].transcript;
    }
    transcriptInput.value = interim;
    updateLiveTelemetry(interim);
  };

  recognition.onerror = (e) => {
    console.warn("Speech recognition error:", e);
    recordingStatus.innerText = "Mic error / Fallback to typing";
  };
}

// 3. Generate Question
btnGenerate.addEventListener("click", async () => {
  btnGenerate.disabled = true;
  btnGenerate.innerText = "Formulating...";
  evaluationSection.classList.add("hidden");
  followUpBox.classList.add("hidden");

  try {
    const res = await fetch("/api/v1/interview/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: roleSelect.value,
        topic: "Systems Architecture & Resiliency",
        difficulty: difficultySelect.value
      })
    });
    if (!res.ok) throw new Error("API call failed");
    activeQuestion = await res.json();

    questionText.innerText = activeQuestion.question_scenario;
    hintsContainer.innerHTML = `<strong>Hints:</strong> ${activeQuestion.hints.join(" • ")}<br><strong>Expected Keywords:</strong> ${activeQuestion.expected_keywords.map(k => `<code>${k}</code>`).join(", ")}`;
    questionBox.classList.remove("hidden");

    btnRecord.disabled = false;
    btnEvaluate.disabled = false;
    btnFollowUp.disabled = false;
  } catch (err) {
    alert("Error generating question: " + err.message);
  } finally {
    btnGenerate.disabled = false;
    btnGenerate.innerText = "Generate Question";
  }
});

// 4. TTS Speak Question
btnSpeak.addEventListener("click", () => {
  if (!activeQuestion || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(activeQuestion.question_scenario);
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
});

// 5. Speech Recording Toggle
btnRecord.addEventListener("click", () => {
  if (!isRecording) {
    isRecording = true;
    btnRecord.innerText = "⏹️ Stop Recording";
    btnRecord.classList.add("recording");
    recordingStatus.innerText = "Listening...";
    recordingStartTime = Date.now();
    transcriptInput.value = "";

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      timerDisplay.innerText = `${mins}:${secs}`;
      durationSeconds = Math.max(1, elapsed);
      updateLiveTelemetry(transcriptInput.value);
    }, 1000);

    if (recognition) recognition.start();
  } else {
    isRecording = false;
    btnRecord.innerText = "🎙️ Start Answering";
    btnRecord.classList.remove("recording");
    recordingStatus.innerText = "Answer Captured";
    clearInterval(timerInterval);
    if (recognition) recognition.stop();
  }
});

// Update live telemetry
function updateLiveTelemetry(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const wpm = Math.round((wordCount / Math.max(1, durationSeconds)) * 60);
  metricWpm.innerText = `${wpm} WPM`;

  const fillers = ["um", "uh", "like", "actually", "basically", "you know", "literally", "right"];
  let fillerCount = 0;
  let detected = [];
  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, "");
    if (fillers.includes(clean)) {
      fillerCount++;
      if (!detected.includes(clean)) detected.push(clean);
    }
  });

  metricFillers.innerText = fillerCount;
  metricFillerTics.innerText = detected.length > 0 ? detected.join(", ") : "None detected";
}

// 6. Trigger Follow-up Grill
btnFollowUp.addEventListener("click", async () => {
  btnFollowUp.disabled = true;
  btnFollowUp.innerText = "Analyzing...";
  try {
    const res = await fetch("/api/v1/interview/follow-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_text: activeQuestion.question_scenario,
        candidate_answer: transcriptInput.value || "We used a distributed cache and message queue.",
        role: roleSelect.value
      })
    });
    const probe = await res.json();
    followUpText.innerText = probe.probe_question;
    followUpBox.classList.remove("hidden");
  } catch (err) {
    alert("Error fetching follow-up: " + err.message);
  } finally {
    btnFollowUp.disabled = false;
    btnFollowUp.innerText = "⚡ Trigger Follow-Up Grill";
  }
});

// 7. Submit & Evaluate
btnEvaluate.addEventListener("click", async () => {
  btnEvaluate.disabled = true;
  btnEvaluate.innerText = "Scoring Session...";
  try {
    const res = await fetch("/api/v1/interview/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: activeQuestion.question_id,
        role: roleSelect.value,
        question_text: activeQuestion.question_scenario,
        candidate_transcript: transcriptInput.value || "Sample response using partitioned queues and idempotent consumers.",
        audio_duration_seconds: durationSeconds,
        eye_contact_ratio: 0.85,
        head_stability_score: 88.0,
        is_follow_up: false
      })
    });
    const rep = await res.json();

    document.getElementById("chiScore").innerText = rep.overall_hireability_score;
    document.getElementById("verdictBadge").innerText = rep.verdict;
    document.getElementById("techScore").innerText = `${rep.technical_score}/100`;
    document.getElementById("vocalScore").innerText = `${rep.vocal_score}/100`;
    document.getElementById("nonverbalScore").innerText = `${rep.nonverbal_score}/100`;

    const whatWentWellList = document.getElementById("whatWentWellList");
    whatWentWellList.innerHTML = rep.what_went_well.map(w => `<li>${w}</li>`).join("");

    const whatToImproveList = document.getElementById("whatToImproveList");
    whatToImproveList.innerHTML = rep.what_to_improve.map(i => `<li>${i}</li>`).join("");

    evaluationSection.classList.remove("hidden");
    evaluationSection.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    alert("Evaluation failed: " + err.message);
  } finally {
    btnEvaluate.disabled = false;
    btnEvaluate.innerText = "🏆 Submit & Evaluate";
  }
});
