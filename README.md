# 🛡️ SentinelLog AI — Smart Log Analyzer & Anomaly Detector

> **Unsupervised Machine Learning Anomaly Detection (Isolation Forest) + Generative AI Root Cause & Remediation Engine (Google Gemini)**

---

## 📌 Executive Summary & Problem Statement

Modern enterprise systems generate massive volumes of server request logs. Manually spotting anomalies, security threats, or cascading microservice outages is slow, complex, and error-prone.

**SentinelLog AI** solves this with a strict architectural principle:
> **Algorithm Detects $\rightarrow$ AI Explains.**

1. **Unsupervised ML Engine (Isolation Forest)** isolates statistical outliers and multi-dimensional behavioral deviations without requiring labeled historical anomalies.
2. **Generative AI Engine (Google Gemini)** ingests the flagged log's telemetry, anomaly score, and behavioral reasons to provide a plain-English explanation, root-cause diagnosis, and actionable remediation playbook.

---

## 📊 Model Performance Benchmark & Scores

The model was evaluated against our 5,000-log sequence dataset containing ground-truth injected operational and cyber-attack patterns:

```text
===========================================================================
          ISOLATION FOREST PERFORMANCE BENCHMARK & EXPORT
===========================================================================
Metric                   | Baseline Model   | Enhanced Model   | Improvement 
---------------------------------------------------------------------------
F1-Score                 | 0.8602           | 0.9758           | +11.56%     
ROC-AUC Score            | 0.9927           | 0.9970           | +0.43%      
PR-AUC (Avg Precision)   | 0.9175           | 0.9900           | +7.26%      
Precision                | 0.8556           | 0.9706           | +11.50%     
Recall                   | 0.8649           | 0.9811           | +11.62%     
===========================================================================
```

### Key Detection Insights:
- **Precision (97.06%)**: Eliminates false positives so SRE teams are not overwhelmed by alert fatigue.
- **Recall (98.11%)**: Successfully isolates virtually all real attack bursts and system crashes.
- **PR-AUC (0.9900)**: Maintains near-perfect discrimination even with heavily imbalanced dataset distributions (~93% normal vs ~7% anomalous).

---

## 🌟 Advanced SRE & Platform Features

| Feature | Description |
| :--- | :--- |
| 🎛️ **Manual ML Model Selector** | Dynamically scans `backend/models/` and lets operators switch between **Isolation Forest (300 Trees)**, **One-Class SVM**, and custom models on-the-fly. |
| 🎚️ **Dynamic Sensitivity Slider** | Real-time threshold slider ($0.50 \leftrightarrow 0.95$) with *Permissive*, *Balanced*, and *Strict* modes for instant alert tuning. |
| 📑 **One-Click Executive SRE Report** | Generates instant compliance audit reports with **Print-to-PDF** and **Markdown (.md)** download options. |
| 🌓 **Dark & Light Mode Toggle** | Cyber-SRE Dark Mode and High-Contrast Enterprise Light Mode with persistent `localStorage` preference. |
| 📄 **Full 5,000-Log Pagination** | High-performance log stream navigation across all 5,000+ records with configurable rows per page (`50`, `100`, `250`, `500`, `All`). |
| 🤖 **AI Dual-Engine Strategy** | Google Gemini 1.5 Flash structured reasoning with automatic fallback to an offline heuristic SRE expert engine. |

---

## 🏗️ System Architecture & Pipeline

```
  ┌─────────────────────────────────────────────────────────────┐
  │                        LOG INGESTION                        │
  │     (CSV Upload, Live Streaming, or Synthetic Generator)    │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 BEHAVIORAL FEATURE PIPELINE                  │
  │  • Inter-arrival time delta & Burst Velocity (sub-second)   │
  │  • Rolling 2-minute IP error rates (401/403, 429, 5xx)      │
  │  • Session integrity: Location/IP/UA switches (Hijacking)   │
  │  • Global 5-minute cascading 5xx outage density             │
  │  • Status severity mapping & off-peak deletion flags        │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │              ISOLATION FOREST DETECTOR (300 Trees)          │
  │  • Scaled via RobustScaler (median/IQR outlier immunity)    │
  │  • Computes Anomaly Score (0.0 to 1.0)                      │
  │  • Generates Algorithmic Reason Tags                        │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
             [Normal Log Entry]      [Flagged Anomaly]
                     │                       │
                     │                       ▼
                     │       ┌───────────────────────────────┐
                     │       │      AI EXPLANATION ENGINE    │
                     │       │ (Google Gemini 1.5 / Fallback)│
                     │       │  • Plain-English Summary      │
                     │       │  • Probable Root Cause        │
                     │       │  • Remediation Playbook       │
                     │       └───────────────┬───────────────┘
                     │                       │
                     └───────────┬───────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 SRE COMMAND CENTER DASHBOARD                │
  │  • Real-time log stream table with risk badges              │
  │  • Interactive Slide-Over AI Diagnostic Drawer              │
  │  • Executive PDF / Markdown Audit Exporter                  │
  │  • Drag-and-drop CSV dataset ingestion                      │
  └─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Injected Anomaly Scenarios Handled

| Scenario | Pattern Signature | Algorithmic Features Flagged |
| :--- | :--- | :--- |
| **1. Impossible Travel / Session Hijack** | Legitimate US session used 30s later in Nigeria with unauthorized requests. | `session_loc_switch=1`, `session_ua_switch=1`, `session_ip_switch=1` |
| **2. High-Frequency DDoS / Scraper Burst** | 120 rapid `GET` requests in sub-second intervals triggering 429 & 503 codes. | `ip_burst_velocity > 2.0`, `ip_rate_limit_2m`, `status_severity` |
| **3. Credential Stuffing / Auth Brute Force** | Rapid `POST` attempts rotating fake sessions with continuous 401/403 codes. | `is_post_auth_fail=1`, `ip_auth_fail_2m`, `ip_session_churn` |
| **4. Cascading Microservice Outage** | Cluster of normal user sessions suddenly receiving 500/502/503 errors. | `global_5xx_density_5m`, `status_severity=1.0` |
| **5. Off-Peak Data Exfiltration / Deletion** | Barrage of `DELETE` requests from `curl` at 3:00 AM off-peak. | `is_delete_off_peak=1`, `is_bot_ua=1` |

---

## 🚀 Setup & Installation Guide

### Prerequisites
- **Python 3.9+** (Virtual environment `.it` recommended)
- **Node.js 18+** & **npm** (for React frontend)

### 1. Backend Setup

```bash
# 1. Activate your virtual environment (if using .it)
# Windows:
.it\Scripts\activate

# 2. Install Python dependencies
pip install -r requirements.txt
```

### 2. Configure AI API Key (`.env`)

Create or edit `backend/.env`:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```
> **Note on AI Fallback**: If you do not provide a Gemini API key or are running offline, SentinelLog AI automatically falls back to its built-in expert SRE heuristic engine. The app will never fail or return empty states.

---

### 3. Running the Application

#### A. Generate Dataset & Train ML Model
```bash
# Generate 5,000 synthetic log records with injected anomalies
python backend/dataset/generate_dataset.py

# Train Isolation Forest, evaluate benchmark, and save model bundle
python backend/src/detector.py
```
*Output: Saves `backend/models/isolation_forest.joblib` and `backend/models/detected_logs.csv`.*

#### B. Start the FastAPI Backend Server
```bash
# From backend directory
python src/main.py
```
*Backend API online at **http://127.0.0.1:8000** (Interactive Swagger docs: **http://127.0.0.1:8000/docs**)*

#### C. Start the React Frontend Dashboard
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend Command Center online at **http://localhost:3000***

---

## 🤖 AI Configuration & Prompting Strategy

The AI engine uses Google Gemini with the following structured system prompt:

- **Persona**: Senior Site Reliability Engineer (SRE) & Cyber Incident Responder.
- **Input Context**: Flagged log telemetry (IP, Method, Status, UA, Session, Location), calculated Isolation Forest anomaly score ($0.0 \to 1.0$), and extracted algorithmic reasons.
- **Output**: Strictly valid JSON schema containing:
  - `summary`: Plain-English 1-2 sentence description of what occurred.
  - `root_cause`: Technical hypothesis (e.g. token hijacking, DB thread pool exhaustion).
  - `remediation_steps`: 3-step prioritized mitigation playbook (Immediate $\to$ Verification $\to$ Permanent Fix).
  - `severity_assessment`: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`.

---

## 📁 Repository Structure

```
Digiplus/
├── .gitignore                     # Git ignore rules (protects API keys, venv, SQLite)
├── .env.example                   # Environment configuration template
├── requirements.txt               # Workspace dependencies
├── README.md                      # Project documentation & benchmark scores
├── backend/
│   ├── .env                       # Environment variables (GEMINI_API_KEY)
│   ├── requirements.txt           # Backend dependencies
│   ├── dataset/
│   │   ├── dataset.csv            # 5,000 synthesized sequence logs
│   │   └── generate_dataset.py    # Temporal sequence generator
│   ├── models/
│   │   ├── isolation_forest.joblib# Serialized Isolation Forest model bundle
│   │   └── detected_logs.csv      # Processed dataset with anomaly scores
│   ├── data/
│   │   └── logs.db                # SQLite database (stores all 5,000 logs)
│   └── src/
│       ├── detector.py            # Feature engineering & Isolation Forest
│       ├── explainer.py           # Gemini LLM & Heuristic AI Explainer
│       ├── database.py            # SQLite connection & session manager
│       ├── models.py              # SQLAlchemy database ORM models
│       ├── pipeline.py            # CLI batch runner
│       └── main.py                # FastAPI REST API endpoints
└── frontend/
    ├── index.html                 # Main HTML entry
    ├── package.json               # React 18, Vite, Lucide-React
    ├── vite.config.js             # Vite development server configuration
    ├── tailwind.config.js         # Cyber-SRE Tailwind theme tokens
    └── src/
        ├── main.jsx               # React DOM root
        ├── App.jsx                # SRE Command Center dashboard
        ├── index.css              # Custom styling & .cyber-card styles
        ├── services/
        │   └── api.js             # REST API integration with FastAPI
        └── components/
            ├── MetricCards.jsx    # Top KPI cards
            ├── LogTable.jsx       # Log stream table with anomaly badges & pagination
            ├── AIDrawer.jsx       # Slide-over AI root cause & playbook view
            ├── ReportModal.jsx    # Executive SRE report preview & PDF/MD export
            └── UploadModal.jsx    # Drag-and-drop CSV dataset upload
```

---

## ⚙️ Assumptions

1. **Chronological Stream**: Logs are received with ascending timestamps or can be sorted by timestamp during ingestion.
2. **Tabular Log Schema**: Standard HTTP access log attributes are present: `Timestamp`, `IP_Address`, `Request_Type`, `Status_Code`, `User_Agent`, `Session_ID`, and `Location`.
3. **Contamination Baseline**: Anomaly rate in normal web applications typically falls between $3\%$ and $8\%$. We configure Isolation Forest with `contamination=0.075`.
4. **Behavioral Continuity**: Legitimate user sessions originate from the same IP/location within short temporal windows (e.g. $<5$ minutes).

---

## ⚠️ Limitations & Future Work

1. **Rolling Window Memory**: Behavioral features rely on temporal rolling windows. In production, this can be scaled using Redis sliding-window counters or Apache Flink for real-time stream processing.
2. **Cold Start for New IPs**: First-time IPs have no historical rolling window; the model relies on static status code severity and user-agent features until subsequent requests arrive.
3. **Streaming Ingestion**: The current system supports batch CSV upload and simulated streaming; future enhancements could integrate directly with Kafka or AWS CloudWatch log streams.
