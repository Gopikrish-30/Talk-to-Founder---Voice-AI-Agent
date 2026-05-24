# 🎙️ Maneuver Voice AI Discovery Agent
### *A Production-Grade Real-Time Voice & Lead Capture Discovery System*

[![Vite Build](https://img.shields.io/badge/Vite-Passed-success?style=flat-square&logo=vite)](https://vitejs.dev/)
[![React 18](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-orange?style=flat-square)](https://livekit.io/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## 📋 Project Overview
This repository contains a **production-grade Voice AI Discovery Agent** built for **Maneuver** (an AI strategy and implementation firm based in Sharjah, UAE). The agent acts as the digital founder (Husain Topiwala), guiding prospective clients through an elegant 6-stage discovery conversation to understand their business, auto-capture lead parameters in real-time, and route verified inquiries directly into the founder's inbox.

Designed with **ultra-premium, white-themed editorial UI aesthetics**, the application features a fully interactive 3D WebGL breathing blob, zero-latency local speech recognition, and instant streaming voice feedback powered by ElevenLabs.

> **🎓 AI Internship Task Note**: This repository showcases advanced real-time pipeline orchestration, conversational AI state machines, and multi-channel transactional mail routing designed and implemented as part of the **AI Internship** project tasks.

---

## ✨ Key Architectural Features

### 1. Interactive 3D WebGL Calm Orb
- **Decorative & Responsive**: Implemented using **Three.js** and Simplex noise fields.
- **Micro-Interactions**: Supports smooth drag-to-spin and mouse-hover reactions without interrupting voice streaming or triggering accidental mic state toggles.

### 2. Double-Pill High-Contrast Chat Input & STT Reset
- **No Repeated Text (Solved)**: The speech recognition lifecycle resets completely between turns. On submit, the mic instantly shuts down, and a brand-new browser SpeechRecognition instance spins up when the agent returns to `idle`.
- **Contrast Polish**: Framed with solid `#cbd5e1` (Slate 300) boundaries and `#0f172a` focus rings to solve washed-out contrast issues on light displays.

### 3. Deep Male Voice Persona (Adam)
- Both the WebRTC LiveKit Voice Pipeline and the client-side native browser synthesizers are aligned to use **Adam**, a calm, composed, deep male founder voice, matching Husain's professional persona.

### 4. Dual Outbound Inquiry Routing (Resend API & SMTP)
- **Primary Courier (Resend)**: Fully integrated with the Resend API to deliver inquiries beautifully styled in rich, clean HTML templates directly to `husain@maneuver.ae`.
- **Secondary Courier (SMTP)**: Standard `smtplib` connection supporting Secure TLS on port `587`.
- **Graceful Fallbacks**: Persists inquiries to local disk (`api/contact_inquiries.json`) and warns developers in logs if keys are missing, ensuring **zero data loss**.

---

## 🛠️ Tech Stack & Services

### Frontend (React + TypeScript)
- **Framework**: React 18 (Vite + TypeScript)
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Styles**: Tailwind CSS
- **Interactive 3D**: Three.js

### Backend API (FastAPI)
- **Runtime**: Python 3.11+
- **API Routing**: FastAPI + CORS Middleware
- **Mail Relays**: Resend API REST Client + standard SMTP (smtplib)

### Voice Pipeline (LiveKit WebRTC)
- **Infrastructure**: LiveKit Cloud WebSocket Router
- **Speech-to-Text**: Deepgram Nova-3 (sub-100ms latency)
- **Language Model**: Groq LLaMA models (sub-150ms Time-to-First-Token)
- **Text-to-Speech**: ElevenLabs Turbo v2.5 (Adam male voice)

---

## 📁 Repository Directory Structure

```
├── api/
│   ├── token_server.py      # FastAPI Server (Issues JWT, Handles /contact route)
│   ├── .env                 # API Secrets & Outbound credentials
│   └── contact_inquiries.json # Disk persistence fallback database
├── agent/
│   ├── main.py              # LiveKit WebSocket Agent main entry
│   ├── agent_worker.py      # Voice Pipeline orchestrator (STT->LLM->TTS)
│   ├── prompts/
│   │   └── system_prompt.txt # Master founder persona instructions
│   └── retriever.py         # Knowledge-base dynamic lookup
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (VoiceOrb, ChatInput, ContactForm)
│   │   ├── hooks/           # useVoiceAssistant custom STT/TTS controller
│   │   ├── stores/          # Zustand global application state
│   │   └── index.css        # Premium White-themed design utility tokens
│   ├── package.json         # Node build and start scripts
│   └── vite.config.ts       # Vite compiler parameters
└── .gitignore               # Multi-layer credential protection template
```

---

## 🚀 Setup & Local Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- [LiveKit Cloud Account](https://cloud.livekit.io/) (Free tier)
- API Keys: Groq, Deepgram, ElevenLabs, Resend

### 1. Clone & Configure Secrets
Clone the repository:
```bash
git clone https://github.com/Gopikrish-30/Talk-to-Founder---Voice-AI-Agent.git
cd Talk-to-Founder---Voice-AI-Agent
```

Create a `.env` file in **both** the root and the `/api` folders:
```env
# Groq & Deepgram API
GROQ_API_KEY=gsk_your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key

# LiveKit Server Settings
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# ElevenLabs (Adam Male Voice)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB

# Outbound Email Configuration (Option A: Resend API - Recommended)
RESEND_API_KEY=re_bG4D4azG_CZW6yD8rfXADMH15yKwggJRL
RESEND_FROM=onboarding@resend.dev

# Outbound Email Configuration (Option B: SMTP Server - Fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_carrier_email@gmail.com
SMTP_PASSWORD=your_app_specific_password
SMTP_FROM=your_carrier_email@gmail.com
```

### Environment Variables (Full list)

Below is the full set of environment variables used across the project. Do NOT store secret values in your Git history — keep them in `.env` (local) or in your deployment platform's secret store.

- `GROQ_API_KEY`: Groq API key for chat and extraction models.
- `LEAD_EXTRACTION_KEY`: Dedicated Groq key used by the lead-extraction endpoint.
- `LEAD_EXTRACTION_MODEL`: Model name used for lead extraction (e.g. `meta-llama/llama-4-scout-17b-16e-instruct`).
- `DEEPGRAM_API_KEY`: Deepgram API key for Speech-to-Text.
- `ELEVENLABS_API_KEY`: ElevenLabs API key for TTS.
- `ELEVENLABS_VOICE_ID`: Voice ID to use with ElevenLabs (default: `pNInz6obpgDQGcFmaJgB`).
- `LIVEKIT_URL`: LiveKit WebSocket URL (wss://...)
- `LIVEKIT_API_KEY`: LiveKit API key for issuing room tokens.
- `LIVEKIT_API_SECRET`: LiveKit API secret for signing JWTs.
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to Google service account JSON (for Google TTS, optional).
- `GOOGLE_CLOUD_PROJECT`: Google Cloud project id (when using Google services).
- `TOKEN_SERVER_URL`: URL where the token server is hosted (frontend uses this).
- `RESEND_API_KEY`: Resend API key (preferred outbound mail provider).
- `RESEND_FROM`: Outbound from address when using Resend.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`: SMTP fallback credentials.
- `AGENT_PARTICIPANT_NAME`: Name/identity used by the agent participant.
- `AGENT_VOICE_SAMPLE_RATE`: Voice sample rate for the agent (default: 24000).
- `AGENT_LOG_LEVEL`: Logging level for the agent (e.g., `INFO`, `DEBUG`).
- `LEADS_OUTPUT_DIR`: Directory to persist captured leads (default: `./agent/leads`).
- `DEBUG`: Set to `true` for local debug behavior.

Security reminder: rotate any keys that were previously committed. After cleaning history, replace leaked keys in the provider dashboards and update your local `.env`.

### 2. Start the FastAPI Token & Contact Server
Create a python virtual environment and run the server:
```bash
# Set up venv
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies & run
pip install -r api/requirements.txt
python api/token_server.py
```
*Token server runs at: `http://localhost:8000`*

### 3. Start the LiveKit Voice Agent Worker
```bash
pip install -r agent/requirements.txt
python agent/main.py dev
```
*Agent registers connection to LiveKit Cloud node.*

### 4. Run the Vite Frontend React App
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
*Vite local preview runs at: `http://localhost:5173`*

---

## ☁️ Production Deployment Guide

For an optimal production deployment, follow this monorepo multi-cloud deployment blueprint:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Multi-Cloud Setup                     │
├───────────────────────────────┬─────────────────────────────────┤
│    React Frontend (Vercel)    │  FastAPI Token Server (Railway) │
│    - Host static assets       │  - Standard Python hosting      │
│    - Sub-second CD            │  - Serves REST endpoints        │
└───────────────────────────────┴─────────────────────────────────┘
                                │
                 LiveKit Agent Worker (Railway)
                 - Long-running persistent WebSockets
                 - MUST run continuously (no serverless hosting!)
```

### 1. Deploy the Frontend on Vercel
1. Sign in to your [Vercel Dashboard](https://vercel.com).
2. Connect your GitHub repository: `Talk-to-Founder---Voice-AI-Agent`.
3. Set the **Root Directory** to `frontend/`.
4. Select **Vite** as the framework template.
5. In **Environment Variables**, add:
   - `VITE_TOKEN_SERVER_URL` = URL of your deployed FastAPI server.
6. Click **Deploy**!

### 2. Deploy the FastAPI Token Server & Agent Worker (Railway / Render)
> ⚠️ **IMPORTANT ARCHITECTURAL RULE**: The LiveKit Agent Worker (`agent/main.py`) cannot run on serverless platforms (like Vercel or AWS Lambda) because it uses long-running WebSockets to stream conversational voice. It **must** be deployed to a persistent container service like **Railway** or **Render**.

#### Deploying on Railway:
1. Connect your repository to Railway.
2. Define two services:
   - **Service A (FastAPI)**: Set build command to `pip install -r api/requirements.txt` and start command to `uvicorn api.token_server:app --host 0.0.0.0 --port $PORT`. Add the environment variables from your `.env` file.
   - **Service B (Voice Agent)**: Set build command to `pip install -r agent/requirements.txt` and start command to `python agent/main.py start`. Add the environment variables from your `.env` file.
3. Link Service A's deployed URL to the frontend environment variable `VITE_TOKEN_SERVER_URL`.

---

## 📜 MIT License
This project is open-source software licensed under the [MIT License](LICENSE).
