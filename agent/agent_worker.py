"""
Agent Worker - Voice Pipeline Orchestration

This module handles the complete voice conversation flow:
1. Speech-to-Text (Deepgram) - Real-time transcription with interim results
2. Language Model (Groq) - Processing and response generation with tool calling
3. Text-to-Speech (Google Cloud) - Converting agent response to audio

The pipeline also handles:
- RPC tool calls for lead capture
- Lead field tracking
- Call transcript preservation
- Lead assessment generation
"""

import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
import os
from pathlib import Path
import uuid

import asyncio
from livekit import agents
from livekit.agents import llm, JobContext
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins.silero import VAD as SileroVAD

from livekit.plugins.deepgram import STT as DeepgramSTT
from livekit.plugins.groq import LLM as GroqLLM
from livekit.plugins.elevenlabs import TTS as ElevenLabsTTS
from retriever import LocalRetriever

logger = logging.getLogger(__name__)


# Lead field tracking
@dataclass
class LeadData:
    """Container for captured lead information"""
    call_id: str
    timestamp: str
    
    # Lead fields
    name: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    team_size: Optional[str] = None
    role: Optional[str] = None
    
    # Opportunity fields
    pain_point: Optional[str] = None
    current_tools: Optional[str] = None
    ai_experience: Optional[str] = None
    timeline: Optional[str] = None
    budget: Optional[str] = None
    
    # Contact fields
    email: Optional[str] = None
    phone: Optional[str] = None
    
    # Assessment (populated at end of call)
    fit_level: Optional[str] = None  # strong_fit, potential, early_stage, no_fit
    recommended_service: Optional[str] = None
    confidence: float = 0.8
    assessment_notes: Optional[str] = None
    
    # Metadata
    transcript: List[Dict[str, str]] = None  # [{role, content, timestamp}]
    
    def __post_init__(self):
        if self.transcript is None:
            self.transcript = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['transcript'] = self.transcript
        return data
    
    def update_field(self, field_name: str, value: str):
        """Update a lead field"""
        if hasattr(self, field_name):
            setattr(self, field_name, value)
            logger.info(f"Lead field updated: {field_name} = {value}")
    
    def add_transcript_message(self, role: str, content: str):
        """Add message to transcript"""
        self.transcript.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        })


def load_system_prompt() -> str:
    """Load system prompt from file"""
    prompt_path = Path(__file__).parent / "prompts" / "system_prompt.txt"
    if prompt_path.exists():
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    logger.warning("System prompt file not found, using default")
    return "You are Husain, founder of Maneuver. Run a discovery call with the visitor."





class AssistantFunctionContext(llm.FunctionContext):
    """
    Function context for LLM tool calling.
    Maps LLM tool calls to AgentWorker RPC events.
    """
    def __init__(self, worker: 'AgentWorker'):
        super().__init__()
        self.worker = worker

    @llm.ai_callable(
        description="Update a captured lead field with information parsed from the conversation. "
                    "Call this tool immediately when you hear the user state a piece of information "
                    "corresponding to any of these fields: "
                    "name, company, industry, location, team_size, role, pain_point, current_tools, "
                    "ai_experience, timeline, budget, email, phone."
    )
    async def update_lead_field(
        self,
        field_name: str,
        value: str,
    ) -> str:
        """Update a captured lead field with a value."""
        logger.info(f"LLM tool call - update_lead_field: {field_name} = {value}")
        result = await self.worker._handle_update_lead_field(field_name, value)
        return json.dumps(result)

    @llm.ai_callable(
        description="Suggest a booking or demo next step to the user. Use this when the user "
                    "asks to schedule, show a demo, or when they represent a high fit. "
                    "Always steer them to Husain's Calendly: https://calendly.com/husain-maneuver/30min."
    )
    async def suggest_booking(
        self,
        text: str,
    ) -> str:
        """Suggest booking a meeting with Calendly link."""
        logger.info(f"LLM tool call - suggest_booking: {text}")
        result = await self.worker._handle_suggest_booking(text)
        return json.dumps(result)

    @llm.ai_callable(
        description="Add an internal note or context about the call for lead intelligence tracking."
    )
    async def add_call_note(
        self,
        text: str,
    ) -> str:
        """Add internal call note."""
        logger.info(f"LLM tool call - add_call_note: {text}")
        result = await self.worker._handle_add_call_note(text)
        return json.dumps(result)

    @llm.ai_callable(
        description="Final assessment of lead fit and recommended service. Call this when the "
                    "discovery call is wrapping up or complete. "
                    "Fit levels: strong_fit, potential, early_stage, no_fit."
    )
    async def assess_lead_fit(
        self,
        fit_level: str,
        recommended_service: Optional[str] = None,
        confidence: float = 0.8,
        notes: Optional[str] = None,
    ) -> str:
        """Final lead assessment."""
        logger.info(f"LLM tool call - assess_lead_fit: {fit_level}")
        result = await self.worker._handle_assess_lead_fit(
            fit_level=fit_level,
            recommended_service=recommended_service,
            confidence=confidence,
            notes=notes
        )
        return json.dumps(result)


class AgentWorker:
    """
    Main agent worker that orchestrates the voice pipeline.
    """
    
    def __init__(self, ctx: JobContext):
        self.ctx = ctx
        # Generate a unique call ID before using it
        self.call_id = str(uuid.uuid4())
        self.lead_data = LeadData(
            call_id=self.call_id,
            timestamp=datetime.utcnow().isoformat(),
        )
        # Initialize services
        self.system_prompt = load_system_prompt()
        # Load knowledge base dynamically via retriever; keep placeholder for system prompt
        self.knowledge_base = ""
        # Initialize retriever for knowledge base markdown
        kb_path = Path(__file__).parent.parent / "Manuver_Founder_Chatbot_Training.md"
        self.retriever = LocalRetriever(kb_path)
        logger.info(f"Retriever initialized with {len(self.retriever.chunks)} chunks")

    
    async def setup_pipeline(self) -> VoicePipelineAgent:
        """
        Set up the complete voice pipeline with STT, LLM, and TTS.
        """
        stt = DeepgramSTT(api_key=os.getenv("DEEPGRAM_API_KEY"))
        llm_instance = GroqLLM(api_key=os.getenv("GROQ_API_KEY"), model="meta-llama/llama-4-scout-17b-16e-instruct")
        tts_instance = ElevenLabsTTS(
            api_key=os.getenv("ELEVENLABS_API_KEY"),
            model="eleven_turbo_v2_5",
            voice=os.getenv("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")
        )
        
        chat_ctx = llm.ChatContext()
        chat_ctx.append(text=self.system_prompt, role="system")
        
        agent = VoicePipelineAgent(
            vad=SileroVAD(),
            stt=stt,
            llm=llm_instance,
            tts=tts_instance,
            chat_ctx=chat_ctx,
            fnc_ctx=AssistantFunctionContext(self),
        )
        
        agent.start(self.ctx.room)
        self.agent = agent
        
        logger.info("Voice pipeline initialized successfully with Groq LLaMA 4 Scout & ElevenLabs")
        return agent
    
    async def _handle_update_lead_field(self, field_name: str, value: str) -> dict:
        """Handle lead field capture from LLM"""
        logger.info(f"Capturing lead field: {field_name} = {value}")
        self.lead_data.update_field(field_name, value)
        
        # Send RPC event to frontend
        await self._send_rpc_event("updateLeadField", {
            "field_name": field_name,
            "value": value,
        })
        
        return {"status": "ok", "field": field_name, "value": value}
    
    async def _handle_suggest_booking(self, text: str) -> dict:
        """Handle booking suggestion from LLM"""
        logger.info(f"Booking suggestion: {text}")
        
        # Send RPC event to frontend
        await self._send_rpc_event("suggestBooking", {
            "message": text,
        })
        
        return {"status": "ok", "message": text}
    
    async def _handle_add_call_note(self, text: str) -> dict:
        """Handle internal call notes from LLM"""
        logger.info(f"Call note: {text}")
        self.lead_data.add_transcript_message("note", text)
        return {"status": "ok", "note": text}
    
    async def _handle_assess_lead_fit(
        self,
        fit_level: str,
        recommended_service: Optional[str] = None,
        confidence: float = 0.8,
        notes: Optional[str] = None,
    ) -> dict:
        """Handle final lead assessment from LLM"""
        logger.info(f"Lead assessment: {fit_level} (confidence: {confidence})")
        
        self.lead_data.fit_level = fit_level
        self.lead_data.recommended_service = recommended_service
        self.lead_data.confidence = confidence
        self.lead_data.assessment_notes = notes
        
        # Send RPC event to frontend
        await self._send_rpc_event("assessLeadFit", {
            "fit_level": fit_level,
            "recommended_service": recommended_service,
            "confidence": confidence,
            "notes": notes,
        })
        
        return {
            "status": "ok",
            "fit_level": fit_level,
            "recommended_service": recommended_service,
        }
    
    async def _send_rpc_event(self, method: str, data: Dict[str, Any]):
        """
        Send RPC event to frontend via LiveKit data channel.
        Uses ctx.room.local_participant.publish_data() for WebRTC data communication.
        """
        try:
            payload = json.dumps({
                "method": method,
                "params": data,
                "timestamp": datetime.utcnow().isoformat(),
            }).encode()
            
            # Send via LiveKit data channel to all participants
            await self.ctx.room.local_participant.publish_data(
                payload=payload,
                topic="agent_rpc",  # Optional: topic for filtering
            )
            
            logger.debug(f"[RPC] Sent {method}: {data}")
        except Exception as e:
            logger.error(f"[RPC] Failed to send {method}: {e}")
    
    def on_agent_message(self, chat_msg: llm.ChatMessage):
        """
        Called when agent sends a message (captured from TTS output).
        """
        self.lead_data.add_transcript_message("agent", chat_msg.content)
    
    def on_user_message(self, chat_msg: llm.ChatMessage):
        """
        Called when user sends a message (captured from STT output).
        """
        message = chat_msg.content
        # Add to transcript
        self.lead_data.add_transcript_message("user", message)
        # Retrieve relevant knowledge base chunks based on user input
        try:
            results = self.retriever.retrieve(message, top_k=2)
            # Format retrieved chunks for inclusion in system prompt
            formatted_chunks = []
            for chunk in results:
                # Include title and text
                formatted_chunks.append(f"### {chunk['title']}\n{chunk['text']}")
            # Combine chunks into knowledge base string
            self.knowledge_base = "\n\n".join(formatted_chunks)
            # Update LLM system context with retrieved knowledge if agent is available
            if hasattr(self, 'agent') and self.agent.chat_ctx and len(self.agent.chat_ctx.messages) > 0:
                # The first message in chat_ctx is the system prompt
                self.agent.chat_ctx.messages[0].content = f"{self.system_prompt}\n\nKnowledge:\n{self.knowledge_base}"
            
        except Exception as e:
            logger.error(f"Retriever error: {e}")
            self.knowledge_base = ""
        # No need to modify LLM context here; the next system prompt will include updated knowledge_base
    async def save_lead_data(self):
        """
        Save lead data to JSON file at end of call.
        """
        leads_dir = Path(os.getenv("LEADS_OUTPUT_DIR", "./leads"))
        leads_dir.mkdir(parents=True, exist_ok=True)
        
        lead_file = leads_dir / f"{self.call_id}.json"
        
        try:
            with open(lead_file, "w", encoding="utf-8") as f:
                json.dump(self.lead_data.to_dict(), f, indent=2)
            logger.info(f"Lead data saved to {lead_file}")
        except Exception as e:
            logger.error(f"Failed to save lead data: {e}")
    
    async def cleanup(self):
        """
        Clean up and save data at end of call.
        """
        logger.info(f"Cleaning up call: {self.call_id}")
        await self.save_lead_data()


async def setup_agent(ctx: JobContext) -> VoicePipelineAgent:
    """
    Main entry point for setting up the agent.
    Called by main.py when a participant joins.
    """
    worker = AgentWorker(ctx)
    agent = await worker.setup_pipeline()
    
    # Store worker in context for later access
    ctx.user_data = {"worker": worker}
    
    # Set up callbacks using standard event emitter syntax
    agent.on("agent_speech_committed", worker.on_agent_message)
    agent.on("user_speech_committed", worker.on_user_message)
    
    # Warm greeting spoken by Husain to start the call
    async def speak_greeting():
        await asyncio.sleep(1.0)
        greeting = "Hey, welcome! I'm Husain, founder of Manuver. What kind of business are you running, and what brought you to us today?"
        agent.chat_ctx.append(text=greeting, role="assistant")
        await agent.say(greeting, allow_interruptions=True)
        
    asyncio.create_task(speak_greeting())
    
    logger.info(f"Agent ready for call {worker.call_id}")
    return agent
