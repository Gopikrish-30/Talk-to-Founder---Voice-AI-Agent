"""
FastAPI Token Server

Simple endpoint that issues LiveKit JWT tokens.
Frontend requests a token before joining a room.

Endpoint:
  GET /token?room=<room_name>&username=<username>

Response:
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "url": "wss://your-livekit-domain.livekit.cloud"
  }
"""

import os
import logging
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import jwt
from datetime import datetime, timedelta
import uuid
from typing import Optional, List

# Contact Form Request & Response Models
class ContactRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    query: str

class ContactResponse(BaseModel):
    status: str
    message: str
    recipient: str
    details: ContactRequest


# Load environment variables (override system environment variables with .env values)
load_dotenv(override=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

# Validate required credentials at runtime rather than import-time.
# Avoid raising on import so serverless platforms (like Vercel) can deploy
# even when environment variables are not configured yet. Individual
# endpoints will return informative errors if credentials are missing.
if not all([LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET]):
    logger.warning(
        "LiveKit credentials not fully configured. "
        "Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in environment for production."
    )

# Create FastAPI app
app = FastAPI(
    title="Maneuver Token Server",
    description="Issues JWT tokens for LiveKit room access",
    version="1.0.0",
)

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Response models
class TokenResponse(BaseModel):
    """Token response model"""
    token: str
    url: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    livekit_connected: bool


# Utility functions
def create_jwt_token(
    room_name: str,
    user_name: str,
    duration_hours: int = 1,
) -> str:
    """
    Create a LiveKit JWT token.
    
    Args:
        room_name: Name of the LiveKit room
        user_name: Name/identity of the participant
        duration_hours: Token validity duration in hours
    
    Returns:
        JWT token string
    """
    import time
    now_ts = int(time.time())
    exp_ts = now_ts + (duration_hours * 3600)
    
    # Standard LiveKit token payload
    payload = {
        "iss": LIVEKIT_API_KEY,
        "sub": user_name,
        "aud": "livekit",
        "iat": now_ts,
        "exp": exp_ts,
        "video": {
            "room": room_name,
            "roomJoin": True,
            "canPublish": True,
            "canPublishData": True,
            "canSubscribe": True,
        },
    }
    
    # Sign with secret
    token = jwt.encode(payload, LIVEKIT_API_SECRET, algorithm="HS256")
    
    logger.info(f"Token created for room={room_name}, user={user_name}")
    return token


def verify_livekit_connection() -> bool:
    """
    Quick check that LiveKit credentials are valid.
    In production, you'd make an actual API call to verify.
    """
    return bool(LIVEKIT_API_KEY and LIVEKIT_API_SECRET)


# Routes
@app.get("/", tags=["root"])
async def root():
    """Root endpoint - info about the server"""
    return {
        "name": "Maneuver Token Server",
        "version": "1.0.0",
        "endpoints": {
            "token": "GET /token?room=<room_name>&username=<username>",
            "health": "GET /health",
        },
    }


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health():
    """Health check endpoint"""
    return HealthResponse(
        status="ok",
        livekit_connected=verify_livekit_connection(),
    )


@app.get("/token", response_model=TokenResponse, tags=["token"])
async def get_token(
    room: str = Query(..., description="LiveKit room name"),
    username: str = Query(..., description="Participant username/identity"),
):
    """
    Get a JWT token for joining a LiveKit room.
    
    Query Parameters:
        room: Name of the room to join
        username: Name/identity of the participant
    
    Returns:
        Token and LiveKit URL
    
    Example:
        GET /token?room=discovery-call-1&username=visitor-123
    """
    
    # Validate inputs
    if not room or len(room) < 3:
        raise HTTPException(
            status_code=400,
            detail="Room name must be at least 3 characters",
        )
    
    if not username or len(username) < 2:
        raise HTTPException(
            status_code=400,
            detail="Username must be at least 2 characters",
        )
    
    try:
        # Create JWT token
        token = create_jwt_token(
            room_name=room,
            user_name=username,
            duration_hours=1,  # Token valid for 1 hour
        )
        
        # Return token and LiveKit URL
        return TokenResponse(
            token=token,
            url=LIVEKIT_URL,
        )
    
    except Exception as e:
        logger.error(f"Failed to create token: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create token",
        )


@app.get("/validate", tags=["token"])
async def validate_token(token: str = Query(..., description="JWT token to validate")):
    """
    Validate a JWT token (for debugging).
    
    In production, token validation happens server-side in LiveKit.
    This endpoint is for development/testing only.
    """
    try:
        # Decode and verify
        payload = jwt.decode(
            token,
            LIVEKIT_API_SECRET,
            algorithms=["HS256"],
        )
        return {
            "valid": True,
            "payload": payload,
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.post("/contact", response_model=ContactResponse, tags=["contact"])
async def receive_contact(request: ContactRequest):
    """
    Receive contact form submission, store it locally, and send a real email to husain@maneuver.ae.
    """
    recipient_email = "husain@maneuver.ae"
    logger.info(f"=== NEW CONTACT INQUIRY FOR FOUNDER HUSAIN ({recipient_email}) ===")
    logger.info(f"From: {request.name} <{request.email}> (Phone: {request.phone or 'N/A'})")
    logger.info(f"Query: {request.query}")
    
    # 1. Save to local contact_inquiries.json on disk for persistence
    import json
    from pathlib import Path
    
    inquiries_path = Path(__file__).parent / "contact_inquiries.json"
    inquiry_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "name": request.name,
        "email": request.email,
        "phone": request.phone,
        "query": request.query
    }
    
    try:
        inquiries = []
        if inquiries_path.exists():
            with open(inquiries_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    inquiries = json.loads(content)
        inquiries.append(inquiry_entry)
        with open(inquiries_path, "w", encoding="utf-8") as f:
            json.dump(inquiries, f, indent=2)
        logger.info(f"Inquiry persisted to {inquiries_path.name} ✓")
    except Exception as e:
        logger.error(f"Failed to persist contact inquiry: {e}")
        
    # 2. Try sending a REAL email using Resend API first (if configured)
    resend_key = os.getenv("RESEND_API_KEY")
    mail_sent = False
    error_msg = ""
    
    if resend_key:
        try:
            import requests
            logger.info("Attempting to send email via Resend API...")
            
            resend_url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {resend_key}",
                "Content-Type": "application/json"
            }
            
            # Formulate a beautiful HTML email body
            html_body = f"""
            <div style="font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
              <h2 style="font-size: 20px; font-weight: 800; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-top: 0; color: #0f172a;">
                ★ New Lead Inquiry from Maneuver Discovery Agent
              </h2>
              <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 100px; color: #475569;">Name:</td>
                  <td style="padding: 6px 0; color: #0f172a;">{request.name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #475569;">Email:</td>
                  <td style="padding: 6px 0; color: #0f172a;"><a href="mailto:{request.email}" style="color: #0f172a; text-decoration: underline;">{request.email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #475569;">Phone:</td>
                  <td style="padding: 6px 0; color: #0f172a;">{request.phone or 'Not provided'}</td>
                </tr>
              </table>
              <div style="margin-top: 24px;">
                <h4 style="margin: 0 0 8px 0; color: #475569; font-size: 14px;">Message Context / Query:</h4>
                <div style="background-color: #f8fafc; border-left: 4px solid #0f172a; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">{request.query}</div>
              </div>
              <p style="font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center;">
                Sent at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} • Powered by Maneuver Voice AI
              </p>
            </div>
            """
            
            payload = {
                "from": os.getenv("RESEND_FROM", "onboarding@resend.dev"),
                "to": recipient_email,
                "subject": f"★ New Discovery Inquiry from {request.name}",
                "html": html_body
            }
            
            res_response = requests.post(resend_url, json=payload, headers=headers, timeout=15)
            if res_response.status_code in [200, 201]:
                logger.info("Email sent successfully via Resend API! ✓")
                mail_sent = True
            else:
                error_msg = f"Resend API error ({res_response.status_code}): {res_response.text}"
                logger.error(error_msg)
        except Exception as res_err:
            error_msg = f"Resend integration failed: {res_err}"
            logger.error(error_msg)
            
    # If Resend not configured or failed, fall back to SMTP
    if not mail_sent:
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        try:
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
        except:
            smtp_port = 587
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_from = os.getenv("SMTP_FROM", smtp_user or "noreply@maneuver.ae")
        
        if smtp_user and smtp_password:
            try:
                import smtplib
                from email.mime.text import MIMEText
                from email.mime.multipart import MIMEMultipart
                
                logger.info(f"Attempting to send email via SMTP ({smtp_host}:{smtp_port})...")
                
                msg = MIMEMultipart()
                msg["From"] = smtp_from
                msg["To"] = recipient_email
                msg["Subject"] = f"★ New Discovery Inquiry from {request.name}"
                
                body = f"""
New Lead Inquiry from Maneuver Discovery Agent

Name: {request.name}
Email: {request.email}
Phone: {request.phone or 'Not provided'}

Message:
------------------------------------------
{request.query}
------------------------------------------

Sent at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
"""
                msg.attach(MIMEText(body, "plain"))
                
                # Secure SMTP connection
                server = smtplib.SMTP(smtp_host, smtp_port)
                server.ehlo()
                if smtp_port == 587:
                    server.starttls()
                    server.ehlo()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_from, recipient_email, msg.as_string())
                server.quit()
                
                logger.info("Email sent successfully! ✓")
                mail_sent = True
            except Exception as smtp_err:
                error_msg = str(smtp_err)
                logger.error(f"SMTP email dispatch failed: {smtp_err}")
        else:
            logger.warning(
                "SMTP_USER and SMTP_PASSWORD not set in .env! "
                "To receive actual emails in your inbox, please add your SMTP configuration or RESEND_API_KEY to your .env file."
            )
            error_msg = error_msg or "Outbound credentials missing in .env configuration."

    return ContactResponse(
        status="success" if mail_sent else "saved_local_only",
        message="Your inquiry details have been forwarded to founder Husain." if mail_sent else f"Your inquiry has been captured locally. To receive it in your email inbox, please configure SMTP credentials in your .env. Status: {error_msg}",
        recipient=recipient_email,
        details=request
    )



@app.post("/end-call", tags=["lead"])
async def end_call(callId: str = Body(...), leadData: dict = Body(...)):
    """Receive end call event and persist lead data."""
    import json
    from pathlib import Path
    leads_dir = Path(__file__).parent / "leads"
    leads_dir.mkdir(exist_ok=True)
    lead_path = leads_dir / f"{callId}.json"
    try:
        with open(lead_path, "w", encoding="utf-8") as f:
            json.dump(leadData, f, indent=2)
        logger.info(f"Lead data saved to {lead_path}")
    except Exception as e:
        logger.error(f"Failed to save lead data: {e}")
        raise HTTPException(status_code=500, detail="Failed to save lead data")
    return {"status": "saved", "callId": callId}

def load_system_prompt() -> str:
    """Load system prompt from file"""
    from pathlib import Path
    prompt_path = Path(__file__).parent.parent / "agent" / "prompts" / "system_prompt.txt"
    if prompt_path.exists():
        try:
            with open(prompt_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error loading system prompt: {e}")
    logger.warning("System prompt file not found, using default")
    return "You are Husain, founder of Maneuver. You're running a discovery call with a potential client."

def load_knowledge_base() -> str:
    """Load knowledge base from parent folder's 'About Manuver .md' and clean it."""
    from pathlib import Path
    kb_path = Path(__file__).parent.parent / "About Manuver .md"
    if kb_path.exists():
        try:
            cleaned_lines = []
            with open(kb_path, "r", encoding="utf-8") as f:
                for line in f:
                    # Skip any lines that contain huge base64 blocks or image references
                    if "base64" in line or "[image" in line or "data:image" in line or len(line) > 500:
                        continue
                    cleaned_lines.append(line)
            logger.info(f"Successfully loaded and cleaned knowledge base ({len(cleaned_lines)} lines)")
            return "".join(cleaned_lines)
        except Exception as e:
            logger.error(f"Error loading knowledge base: {e}")
    logger.warning("Knowledge base file not found")
    return ""

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@app.post("/api/chat", tags=["ai"])
async def chat_with_groq(request: ChatRequest):
    """
    Proxy request to Groq completions API.
    Bypasses browser CORS policy.
    """
    import requests
    from typing import List
    
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        logger.error("Missing GROQ_API_KEY environment variable")
        raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY")
        
    system_prompt = load_system_prompt()
    knowledge_base = load_knowledge_base()
    
    full_system_prompt = f"""{system_prompt}

## Company Knowledge Base
{knowledge_base}

CRITICAL INSTRUCTIONS:
1. You MUST ONLY answer questions using the information provided in the "Company Knowledge Base" above.
2. DO NOT hallucinate, invent, or assume any information that is not explicitly stated in the knowledge base.
3. If a user asks a question that cannot be answered using the knowledge base, honestly say "I don't have that specific detail in front of me right now, but we can discuss it on a follow-up call."
4. You are based in Sharjah, UAE. Do NOT say you are in the US.
5. Keep replies extremely brief (1-3 short sentences max) suitable for a real-time voice call. 
6. Be direct, honest, and helpful. Speak naturally as the founder, not a bot.
"""

    groq_messages = [
        {"role": "system", "content": full_system_prompt}
    ]
    for msg in request.messages:
        groq_messages.append({"role": msg.role, "content": msg.content})
        
    try:
        endpoints = [
            "https://api.groq.com/openai/v1/chat/completions",
        ]
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {groq_key}"
        }
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": groq_messages,
            "temperature": 0.7,
            "max_tokens": 150,
        }
        
        last_error = None
        for url in endpoints:
            try:
                logger.info(f"Calling Groq API endpoint: {url}")
                response = requests.post(url, json=payload, headers=headers, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    reply = data.get("choices", [])[0].get("message", {}).get("content")
                    if reply:
                        logger.info(f"Groq response from {url}: {reply}")
                        return {"reply": reply}
                    logger.error(f"Groq response missing content from {url}: {data}")
                    last_error = Exception(f"Missing content in Groq response from {url}")
                    continue
                logger.error(f"Groq API error ({response.status_code}) at {url}: {response.text}")
                last_error = Exception(f"Groq API error {response.status_code}: {response.text}")
            except requests.exceptions.Timeout:
                last_error = Exception("Groq API request timeout")
            except requests.exceptions.ConnectionError as e:
                last_error = e
            except Exception as e:
                last_error = e
        
        if last_error:
            logger.error(f"Groq API failed after trying endpoints: {last_error}")
            raise HTTPException(status_code=500, detail=str(last_error))
        
        raise HTTPException(status_code=500, detail="Groq API request failed")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Groq error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ── Lead Extraction Endpoint ─────────────────────────────────────────────────
# Uses a dedicated Groq API key + llama-4-scout model.
# Completely separate from the main chat model — no persona, no knowledge base.

# Read lead-extraction credentials from environment (.env)
LEAD_EXTRACTION_KEY = os.getenv("LEAD_EXTRACTION_KEY")
LEAD_EXTRACTION_MODEL = os.getenv(
    "LEAD_EXTRACTION_MODEL",
    "meta-llama/llama-4-scout-17b-16e-instruct",
)

LEAD_EXTRACTION_SYSTEM = """You are a silent lead data extraction assistant for a B2B sales tool.

You will receive ONLY the prospect's/caller's own messages (not the sales agent's replies).
Your job is to extract structured information about the PROSPECT from what they wrote.

Rules:
- Return ONLY a raw JSON object — no markdown, no code fences, no explanation whatsoever.
- Only include a field if you are CERTAIN the prospect explicitly mentioned it.
- If a field was NOT mentioned, omit it entirely (do NOT include null or empty values).
- Never infer, guess, or hallucinate values.
- Fields to extract (all optional):
    name         → the prospect's own name
    company      → the prospect's company or organisation
    industry     → the prospect's industry or sector
    business_type → the prospect's business type (e.g., B2B, B2C, SaaS, e-commerce, agency, consultancy)
    location     → city, region or country the prospect mentioned
    team_size    → size of the prospect's team or company
    role         → the prospect's job title or role
    pain_point   → the primary problem or challenge the prospect described
    current_tools → tools, platforms or software the prospect currently uses
    ai_experience → any prior AI or automation experience the prospect mentioned
    timeline     → the prospect's project or decision timeline
    budget       → budget range or number the prospect mentioned
    email        → email address if the prospect shared it
    phone        → phone number if the prospect shared it"""

class ExtractLeadRequest(BaseModel):
    conversation: str   # plain-text conversation to analyse

@app.post("/api/extract-lead", tags=["lead"])
async def extract_lead(request: ExtractLeadRequest):
    """
    Extract structured lead data from a conversation using llama-4-scout.
    Uses a dedicated API key separate from the main chat model.
    """
    import requests

    if not request.conversation or not request.conversation.strip():
        raise HTTPException(status_code=400, detail="conversation cannot be empty")

    groq_messages = [
        {"role": "system", "content": LEAD_EXTRACTION_SYSTEM},
        {"role": "user", "content": f"Conversation to analyse:\n\n{request.conversation}"},
    ]

    if not LEAD_EXTRACTION_KEY:
        logger.error("Missing LEAD_EXTRACTION_KEY environment variable")
        raise HTTPException(status_code=500, detail="Lead extraction API key not configured")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LEAD_EXTRACTION_KEY}",
    }
    payload = {
        "model": LEAD_EXTRACTION_MODEL,
        "messages": groq_messages,
        "temperature": 0.1,     # low temperature → deterministic JSON
        "max_tokens": 400,
    }

    try:
        logger.info(f"[LeadExtract] Calling {LEAD_EXTRACTION_MODEL} for lead extraction")
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=20,
        )
        if response.status_code != 200:
            logger.error(f"[LeadExtract] Groq error {response.status_code}: {response.text}")
            raise HTTPException(status_code=502, detail=f"Lead extraction model error: {response.status_code}")

        data = response.json()
        raw = data.get("choices", [])[0].get("message", {}).get("content", "")

        # Strip accidental markdown fences
        raw = raw.replace("```json", "").replace("```", "").strip()

        import json as _json
        extracted = _json.loads(raw)
        logger.info(f"[LeadExtract] Extracted fields: {list(extracted.keys())}")
        return {"lead": extracted}

    except _json.JSONDecodeError as e:
        logger.error(f"[LeadExtract] JSON parse error: {e} | raw: {raw}")
        raise HTTPException(status_code=502, detail="Lead extraction returned invalid JSON")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Lead extraction model timeout")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[LeadExtract] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class TTSRequest(BaseModel):
    text: str

@app.post("/api/tts", tags=["ai"])
async def text_to_speech(request: TTSRequest):
    """
    Proxy request to ElevenLabs Text-to-Speech API (POST).
    Streams back binary audio to bypass CORS.
    """
    import requests
    from fastapi.responses import StreamingResponse
    
    eleven_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")
    
    if not eleven_key:
        logger.error("Missing ELEVENLABS_API_KEY environment variable")
        raise HTTPException(status_code=500, detail="Missing ELEVENLABS_API_KEY")
        
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
        headers = {
            "Content-Type": "application/json",
            "xi-api-key": eleven_key
        }
        payload = {
            "text": request.text,
            "model_id": "eleven_turbo_v2_5",
            "voice_settings": {
                "stability": 0.71,
                "similarity_boost": 0.5
            }
        }
        
        logger.info(f"Calling ElevenLabs stream TTS (POST) with {len(request.text)} chars")
        response = requests.post(url, json=payload, headers=headers, timeout=30, stream=True)
        
        if response.status_code != 200:
            error_text = response.text
            logger.error(f"ElevenLabs error ({response.status_code}): {error_text}")
            raise HTTPException(status_code=response.status_code, detail=f"ElevenLabs API error: {error_text}")
            
        logger.info("ElevenLabs TTS stream connection success")
        
        def chunk_generator():
            for chunk in response.iter_content(chunk_size=4096):
                yield chunk
                
        return StreamingResponse(chunk_generator(), media_type="audio/mpeg")
    except requests.exceptions.Timeout:
        logger.error("ElevenLabs API request timeout")
        raise HTTPException(status_code=504, detail="ElevenLabs API request timeout")
    except requests.exceptions.ConnectionError as e:
        logger.error(f"ElevenLabs connection error: {e}")
        raise HTTPException(status_code=503, detail="Cannot connect to ElevenLabs API")
    except Exception as e:
        logger.error(f"ElevenLabs error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/api/tts", tags=["ai"])
async def text_to_speech_get(text: str = Query(..., description="Text to synthesize")):
    """
    Proxy request to ElevenLabs Text-to-Speech API via GET.
    Streams back binary audio to allow native browser streaming.
    """
    import requests
    from fastapi.responses import StreamingResponse
    
    eleven_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")
    
    if not eleven_key:
        logger.error("Missing ELEVENLABS_API_KEY environment variable")
        raise HTTPException(status_code=500, detail="Missing ELEVENLABS_API_KEY")
        
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
        headers = {
            "Content-Type": "application/json",
            "xi-api-key": eleven_key
        }
        payload = {
            "text": text,
            "model_id": "eleven_turbo_v2_5",
            "voice_settings": {
                "stability": 0.71,
                "similarity_boost": 0.5
            }
        }
        
        logger.info(f"Calling ElevenLabs stream TTS (GET) with {len(text)} chars")
        response = requests.post(url, json=payload, headers=headers, timeout=30, stream=True)
        
        if response.status_code != 200:
            error_text = response.text
            logger.error(f"ElevenLabs error ({response.status_code}): {error_text}")
            raise HTTPException(status_code=response.status_code, detail=f"ElevenLabs API error: {error_text}")
            
        logger.info("ElevenLabs TTS stream connection success")
        
        def chunk_generator():
            for chunk in response.iter_content(chunk_size=4096):
                yield chunk
                
        return StreamingResponse(chunk_generator(), media_type="audio/mpeg")
    except requests.exceptions.Timeout:
        logger.error("ElevenLabs API request timeout")
        raise HTTPException(status_code=504, detail="ElevenLabs API request timeout")
    except requests.exceptions.ConnectionError as e:
        logger.error(f"ElevenLabs connection error: {e}")
        raise HTTPException(status_code=503, detail="Cannot connect to ElevenLabs API")
    except Exception as e:
        logger.error(f"ElevenLabs error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# Startup event
@app.on_event("startup")
async def startup():
    """Startup checks"""
    logger.info("=== Token Server Starting ===")
    logger.info(f"LiveKit URL: {LIVEKIT_URL}")
    logger.info(f"API Key configured: {bool(LIVEKIT_API_KEY)}")
    logger.info(f"API Secret configured: {bool(LIVEKIT_API_SECRET)}")
    
    if not verify_livekit_connection():
        logger.warning("LiveKit connection verification failed; continuing without LiveKit credentials configured.")
        # Do not raise — allow server to start so health checks and other
        # non-LiveKit endpoints can function. Individual routes that need
        # credentials will return 5xx/4xx with clear messages.
    
    logger.info("Token server ready ✓")


# Run with: uvicorn token_server:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "token_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
