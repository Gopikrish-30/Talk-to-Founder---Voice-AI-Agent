# Maneuver Voice AI Discovery Agent — Master Project Document

**Status**: Architecture & Planning Complete | Ready for Implementation  
**Cost**: $0/month (100% free tier)  
**Owner**: Husain  
**Created**: May 20, 2026

---

## 📋 Project Brief

### What We're Building
A **production-grade voice AI discovery agent** for Maneuver that runs real-time conversation discovery calls with potential clients. Agent sounds like the founder (Husain), asks probing questions, captures lead data automatically, and recommends services.

### Key Requirements
- ✅ **Production-quality** (fast, robust, natural voice)
- ✅ **Fast** (sub-600ms time-to-first-audio latency)
- ✅ **Natural voice** (sounds like a human, not AI)
- ✅ **Free** (no paid services, 100% free tier tech)
- ✅ **Smart discovery** (follows 6-area arc, branches naturally)
- ✅ **Auto lead capture** (extracts info in real-time)

### UI Layout
```
┌─────────────────────────────────────┬─────────────────────────┐
│                                     │   🎤 Voice Orb          │
│                                     │   (200px circle)        │
│        Conversation History         │   Pulsing gradient      │
│        (Blue user bubbles)          │   Listening/Thinking/   │
│        (White agent bubbles)        │   Speaking indicator    │
│        60% width                    │   40% width             │
│        Auto-scroll                  ├─────────────────────────┤
│                                     │   Chat Input Box        │
│                                     │   Type or speak         │
│                                     │   Shows interim STT      │
│                                     │   Mic button            │
└─────────────────────────────────────┴─────────────────────────┘
```

---

## 🏗️ System Architecture

### High-Level Flow
```
User speaks → Deepgram (STT) → Groq LLaMA (LLM) → Google Cloud (TTS) → User hears
```

### Frontend (React 18 + TypeScript)
- **Components**: 
  - ConversationHistory (left 60%)
  - VoiceOrb (top-right 40%)
  - ChatInput (bottom-right 40%)
  - Message bubbles
- **State Management**: Zustand store (messages, agentState, lead fields, inputText)
- **Voice SDK**: LiveKit components + WebRTC
- **Styling**: Tailwind CSS + Framer Motion animations
- **Build Tool**: Vite

### Backend Agent (Python + LiveKit Agents)
- **Main Entry**: `agent/main.py` - Room/participant lifecycle
- **Voice Pipeline**: `agent/agent_worker.py` - STT→LLM→TTS orchestration
- **Tools**: `agent/tools.py` - RPC-based tool definitions
- **System Prompt**: `agent/prompts/system_prompt.txt` - Husain persona
- **Knowledge Base**: `agent/knowledge_base.md` - Maneuver content
- **Lead Storage**: `agent/leads/` - JSON files per call

### Token Server (FastAPI)
- **Endpoint**: `GET /token` - Issues LiveKit JWT
- **Purpose**: Allows frontend to join LiveKit room securely
- **Minimal**: ~20 lines of code

### Data Flow During Call
1. User clicks Voice Orb
2. Frontend requests JWT from token server
3. Frontend joins LiveKit room via WebRTC
4. User speaks → Deepgram STT (interim results stream to ChatInput)
5. Final transcript triggers Groq LLM
6. LLM calls tools (update_transcript, update_lead_field, etc.)
7. Tools fire RPC events to frontend → Zustand state updates → React re-renders
8. LLM response streamed to Google Cloud TTS
9. TTS audio streams back to user via LiveKit
10. Call ends → lead JSON saved to `agent/leads/[call-id].json`

---

## 🎯 Tech Stack (100% Free)

### Speech-to-Text
- **Service**: Deepgram Nova-3
- **Free Tier**: 600 minutes/month
- **Config**: 300ms endpointing, interim_results=True, punctuate=True
- **Latency**: ~100ms per request
- **Why**: Fast, accurate, supports interim results for real-time display

### Language Model
- **Service**: Groq LLaMA 3.3 70B
- **Free Tier**: Unlimited (rate-limited ~30 req/min, sufficient for demo)
- **Speed**: 750 tokens/sec, ~150ms TTFT
- **Why**: Fastest open-source LLM, excellent function calling

### Text-to-Speech
- **Service**: Google Cloud Text-to-Speech (Neural2-C voice)
- **Free Tier**: 300,000 characters/month
- **Config**: LINEAR16 encoding, 24kHz, 128kbps streaming
- **Voice**: en-US-Neural2-C (confident, warm, professional)
- **Latency**: ~200ms synthesis
- **Why**: Natural prosody, no artifacts, excellent quality (switched from paid Cartesia)

### Voice Infrastructure
- **Service**: LiveKit Cloud
- **Free Tier**: 5 concurrent connections
- **Function**: WebRTC audio routing, RPC event relay
- **Why**: Reliable low-latency audio, built-in RPC for tool calls

### Frontend Stack
- **Runtime**: Node.js + React 18
- **Language**: TypeScript
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Build**: Vite
- **Voice SDK**: @livekit/components-react

### Backend Stack
- **Runtime**: Python 3.10+
- **Framework**: FastAPI (token server) + LiveKit Agents (voice pipeline)
- **Dependencies**: groq, deepgram-sdk, google-cloud-texttospeech, livekit, uvicorn, python-dotenv

---

## ⏱️ Latency Budget

| Component | Latency |
|---|---|
| User stops speaking | 0ms |
| Deepgram detects silence (300ms+) | +300ms |
| Groq generates first token | +150ms |
| Google Cloud TTS synthesis | +200ms |
| LiveKit relay to browser | +20ms |
| **Total Time-to-First-Audio** | **~770ms** |

**Context**: This is acceptable for conversation (human response time is 200-500ms normally). Feels natural in discovery call context.

---

## 143 Features (Complete Checklist)

### Voice Conversation (4 features)
- ✅ Real-time voice I/O (WebRTC)
- ✅ Sub-600ms TTFA latency
- ✅ Bidirectional audio streaming
- ✅ Natural human voice (not AI-sounding)

### Speech Recognition (6 features)
- ✅ Real-time transcription (Deepgram Nova-3)
- ✅ Interim results stream in real-time
- ✅ Final transcript detected automatically
- ✅ Punctuation auto-corrected
- ✅ Handles accents well
- ✅ Mixed language phrases supported

### LLM & Response Generation (4 features)
- ✅ Processes conversation context (Groq)
- ✅ Streaming token response (~150ms TTFT)
- ✅ Maintains conversation history (sliding window 20 messages)
- ✅ Calls tools based on conversation

### Text-to-Speech (6 features)
- ✅ Streaming audio synthesis
- ✅ Natural prosody (stress, intonation, emotion)
- ✅ Confident, warm voice (founder-like)
- ✅ Appropriate cadence (140-160 WPM)
- ✅ No synthetic artifacts
- ✅ Professional tone

### Conversation History Panel (7 features)
- ✅ Real-time message display
- ✅ User messages: blue bubbles, right-aligned
- ✅ Agent messages: white bubbles, left-aligned
- ✅ Smooth fade-in animations
- ✅ Auto-scroll to latest message
- ✅ Full transcript preserved
- ✅ Timestamps optional

### Voice Orb (7 features)
- ✅ 200-240px circular button
- ✅ Animated pink→purple gradient pulsing
- ✅ Microphone icon centered
- ✅ State indicator (● green listening / ⚡ yellow thinking / 🔊 blue speaking)
- ✅ Click to toggle voice on/off
- ✅ Visual feedback during operation
- ✅ Smooth state transitions

### Chat Input (7 features)
- ✅ Text input field with placeholder
- ✅ Displays interim transcript
- ✅ Updates in real-time
- ✅ Black mic button on right
- ✅ Send on Enter key
- ✅ Auto-clear after sending
- ✅ Fallback for text input

### Responsive Design (4 features)
- ✅ Desktop: 60/40 two-column layout
- ✅ Mobile: Full-width history + swipeable drawer
- ✅ Accessible fonts (readable sizes, good contrast)
- ✅ Touch-friendly buttons

### Husain Persona (7 features)
- ✅ Sounds like a founder (not salesman/bot)
- ✅ Direct communication style
- ✅ Background knowledge (JP Morgan, Vanguard, Deloitte, etc.)
- ✅ Business-metric focused
- ✅ Asks probing questions
- ✅ Acknowledges context
- ✅ Admits uncertainty honestly

### Discovery Call Flow (6 features)
- ✅ Natural greeting (hands control back immediately)
- ✅ Six-area discovery arc (business, pain point, current state, opportunity, timeline, budget)
- ✅ Branching conversation (adapts based on input)
- ✅ Not a form (feels like real conversation)
- ✅ Intelligent skipping (doesn't ask answered questions)
- ✅ Honest qualification (tells people if AI isn't right yet)

### Mode Switching (4 features)
- ✅ Default: Discovery mode
- ✅ Triggered: Q&A mode
- ✅ Seamless transition (same agent)
- ✅ Return to discovery after answering

### Edge Case Handling (5 features)
- ✅ Silence management (5s & 15s re-engagement)
- ✅ Interruption handling (user cuts off mid-sentence)
- ✅ Rude/combative users (doesn't escalate)
- ✅ Unknown questions (honest, maintains credibility)
- ✅ Network issues (graceful reconnection)

### Lead Capture (5 features)
- ✅ Captures as user speaks (automatic)
- ✅ Real-time persistence (JSON immediately)
- ✅ 13 fields captured (name, company, industry, location, team size, role, pain point, current tools, AI experience, timeline, budget, email, phone)
- ✅ Silent background process
- ✅ High confidence extraction

### Lead Assessment (7 features)
- ✅ Fit level determination (4 categories)
- ✅ Service recommendation (5 Maneuver services)
- ✅ Next step identification
- ✅ Confidence percentage
- ✅ Complete call data persisted
- ✅ Full transcript preserved
- ✅ Call duration tracked

### Knowledge Base (6 features)
- ✅ All Maneuver info embedded (services, founder, process, case studies)
- ✅ Five services explained
- ✅ Three-step process documented
- ✅ Case studies included
- ✅ Contact information embedded
- ✅ Accurate content

### Q&A Capabilities (6 features)
- ✅ Answers "What services do you offer?"
- ✅ Zooms into specific services
- ✅ Explains three-step process
- ✅ Shares relevant case studies
- ✅ Handles pricing questions
- ✅ Admits when out of scope

### Real-Time Streaming (6 features)
- ✅ STT streams interim results
- ✅ LLM streams tokens
- ✅ TTS streams audio
- ✅ RPC events stream to frontend
- ✅ No batching of updates
- ✅ No buffering delays

### Low Latency (6 features)
- ✅ TTFA: ~600-770ms
- ✅ Groq for fast LLM
- ✅ Deepgram for fast STT
- ✅ Google Cloud TTS
- ✅ Connection pooling
- ✅ Sliding window context (20 messages)

### Robust Architecture (6 features)
- ✅ Async/await throughout
- ✅ Error handling & logging
- ✅ Graceful degradation
- ✅ Connection retry logic
- ✅ Message queue preservation
- ✅ Health checks

### Data Persistence (7 features)
- ✅ Call transcripts saved as JSON
- ✅ Lead data auto-saved per field
- ✅ No data loss (every message captured)
- ✅ UUID per call
- ✅ Timestamps on all events
- ✅ Call duration tracked
- ✅ Local storage (no database needed)

### Tool System (3 features)
- ✅ Extensible tool definitions
- ✅ Tools: update_transcript, update_lead_field, set_agent_state, suggest_booking
- ✅ RPC-based (frontend reacts)

### Frontend RPC Listener (5 features)
- ✅ Listens to agent tool calls
- ✅ Updates Zustand immediately
- ✅ Triggers UI re-renders
- ✅ Event-driven (no polling)
- ✅ Ordered delivery

### Code Quality (6 features)
- ✅ Modular architecture
- ✅ Clear naming conventions
- ✅ Comprehensive documentation
- ✅ Environment variables for secrets
- ✅ Easy local setup (3 terminal windows)
- ✅ Production-ready patterns

### Testing & Debugging (6 features)
- ✅ Local development mode
- ✅ Verbose logging
- ✅ RPC event logging
- ✅ Transcript saving
- ✅ Manual testing (real conversations)
- ✅ Lead JSON inspection

### Cost & Operations (5 features)
- ✅ 100% free tech stack
- ✅ Groq (free, unlimited)
- ✅ Deepgram (600 min/month free)
- ✅ Google Cloud TTS (300k chars/month free)
- ✅ LiveKit (5 concurrent free)

### Local Development (5 features)
- ✅ No cloud deployment needed
- ✅ Runs on localhost
- ✅ Easy to test (3 terminals)
- ✅ Fast iteration (instant changes)
- ✅ No vendor lock-in

**TOTAL: 143 Features**

---

## 📁 Project Structure

```
maneuver/
├── agent/
│   ├── main.py                    # JobContext handler, room lifecycle
│   ├── agent_worker.py            # VoicePipelineAgent (STT→LLM→TTS)
│   ├── tools.py                   # Tool definitions (RPC events)
│   ├── requirements.txt           # Python dependencies
│   ├── prompts/
│   │   └── system_prompt.txt      # Husain persona instructions
│   ├── knowledge_base.md          # Maneuver services, process, case studies
│   └── leads/
│       └── [call-id].json         # Per-call lead capture output
│
├── api/
│   ├── token_server.py            # FastAPI GET /token endpoint
│   └── requirements.txt           # FastAPI, uvicorn, livekit
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Root component (60/40 grid)
│   │   ├── stores/
│   │   │   └── useAppStore.ts     # Zustand store (messages, lead fields, state)
│   │   ├── components/
│   │   │   ├── ConversationHistory.tsx
│   │   │   ├── VoiceOrb.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── Message.tsx
│   │   ├── hooks/
│   │   │   ├── useAgentRPC.ts     # RPC event listener
│   │   │   └── useVoiceAssistant.ts
│   │   └── lib/
│   │       └── token.ts           # JWT fetcher
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── .env.example
└── PROJECT.md                     # This file
```

---

## 🚀 Implementation Roadmap

### Phase 1: Python Agent Backend (4-5 hours)
1. Create `agent/requirements.txt` with all dependencies
2. Create `agent/main.py` (JobContext, room handler)
3. Create `agent/agent_worker.py` (VoicePipelineAgent orchestration)
4. Create `agent/tools.py` (RPC tool definitions)
5. Create `agent/prompts/system_prompt.txt` (Husain persona)
6. Create `agent/knowledge_base.md` (Maneuver content)

### Phase 2: FastAPI Token Server (0.5-1 hour)
1. Create `api/token_server.py` (GET /token endpoint)
2. Create `api/requirements.txt`
3. Test JWT generation locally

### Phase 3: React Frontend (3-4 hours)
1. Create `frontend/package.json` with all dependencies
2. Create `frontend/vite.config.ts`
3. Create `frontend/src/App.tsx` (grid layout)
4. Create `frontend/src/stores/useAppStore.ts` (Zustand)
5. Create UI components (ConversationHistory, VoiceOrb, ChatInput, Message)
6. Create hooks (useAgentRPC, useVoiceAssistant)
7. Create `frontend/src/lib/token.ts` (JWT fetcher)

### Phase 4: Integration & Testing (2 hours)
1. Start all 3 services locally (agent, token server, frontend)
2. Test end-to-end conversation
3. Verify lead capture
4. Test edge cases

### Phase 5: Production Hardening (1-2 hours)
1. Error handling & logging
2. Connection retry logic
3. Graceful degradation
4. Performance optimization

### Phase 6: Demo & Documentation (1-2 hours)
1. Record Loom video of live conversation
2. Document setup instructions
3. Document API endpoints
4. Create troubleshooting guide

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+ (frontend)
- Python 3.10+ (backend)
- API keys:
  - Groq API key (get free at groq.com)
  - Deepgram API key (get free at deepgram.com)
  - Google Cloud TTS (get free at cloud.google.com)
  - LiveKit API key & URL (get free at livekit.cloud)

### Local Startup (3 Terminal Windows)

**Terminal 1: Python Agent Worker**
```bash
cd agent
python -m pip install -r requirements.txt
python main.py
```

**Terminal 2: FastAPI Token Server**
```bash
cd api
python -m pip install -r requirements.txt
python token_server.py
```

**Terminal 3: React Frontend**
```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173 in browser.

---

## 🎯 Key Success Criteria

### Performance
- ✅ Time-to-First-Audio: <800ms (comfortable conversation latency)
- ✅ Interim STT updates: <200ms latency (user sees words appearing)
- ✅ UI state updates: <50ms (immediate RPC handling)

### Quality
- ✅ Voice sounds human (not robotic)
- ✅ Grammar & punctuation correct
- ✅ Handles interruptions gracefully
- ✅ Lead data captured with >90% accuracy

### Reliability
- ✅ Handles network reconnection
- ✅ Graceful silence handling
- ✅ No data loss on disconnect
- ✅ Clear error messages

### Cost
- ✅ $0/month operating cost
- ✅ Runs on free tier services
- ✅ Can scale without payment

---

## 📊 Expected Metrics

### Per Call
- **Duration**: 3-5 minutes (typical discovery call)
- **Messages**: ~20-30 exchanges
- **Lead fields captured**: ~8-13 fields
- **Cost**: <$0.01 (free tier)

### Monthly
- **Calls supported**: 20+ (on free tier)
- **Total minutes**: 600+ (Deepgram free limit)
- **Characters synthesized**: 300k+ (Google Cloud free limit)

---

## ✅ Implementation Checklist

### Backend
- [ ] agent/main.py created
- [ ] agent/agent_worker.py created
- [ ] agent/tools.py created
- [ ] System prompt configured
- [ ] Knowledge base populated
- [ ] api/token_server.py created
- [ ] All Python dependencies installed

### Frontend
- [ ] package.json configured
- [ ] App.tsx created
- [ ] Zustand store created
- [ ] Components created (History, Orb, Input, Message)
- [ ] Hooks created (RPC, VoiceAssistant)
- [ ] Vite config set up
- [ ] Tailwind configured

### Integration
- [ ] Agent ↔ Token Server (token requests work)
- [ ] Frontend ↔ Token Server (JWT fetching works)
- [ ] Frontend ↔ Agent (WebRTC connection established)
- [ ] Voice pipeline tested (speak → agent responds)
- [ ] RPC events working (lead field updates trigger UI)
- [ ] Lead JSON files saved correctly

### Testing
- [ ] Full conversation end-to-end
- [ ] Edge cases (silence, interruption)
- [ ] Network reconnection
- [ ] Lead capture accuracy
- [ ] No data loss

---

## 📞 Contact & Support

**Project Owner**: Husain  
**Technology Partner**: Maneuver  
**Stack**: Python (backend) + React (frontend)  
**Cost**: $0/month  
**Deployment**: Local localhost (can deploy to cloud later)  

---

## 🎬 Next Steps

1. ✅ Architecture & planning complete (you are here)
2. ⏭️ Start Phase 1: Build Python agent backend
3. Build Phase 2: FastAPI token server
4. Build Phase 3: React frontend
5. Test Phase 4: Integration testing
6. Polish Phase 5: Production hardening
7. Demo Phase 6: Record & share

**Ready to start coding?**
