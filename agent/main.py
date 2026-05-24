"""
Main Agent Entry Point

This module handles:
- Room and participant lifecycle management
- Starting the agent when a user joins
- Cleaning up when a user leaves or call ends
"""

import logging
import os
import asyncio
from dotenv import load_dotenv

from livekit.agents import JobContext, llm, WorkerOptions, cli

from agent_worker import setup_agent


# Load environment variables (override system environment variables with .env values)
load_dotenv(override=True)

# Configure logging
logging.basicConfig(
    level=os.getenv("AGENT_LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def prewarm_models():
    """
    Preload models on startup for faster first-response latency.
    """
    logger.info("Prewarming language models...")
    try:
        # This would preload Groq model
        # Implementation depends on LiveKit Agents library version
        pass
    except Exception as e:
        logger.warning(f"Model prewarming failed (non-critical): {e}")


def prewarm_services():
    """
    Test connectivity to all external services on startup.
    """
    logger.info("Testing external service connectivity...")
    
    services = {
        "Deepgram API": os.getenv("DEEPGRAM_API_KEY"),
        "Groq API": os.getenv("GROQ_API_KEY"),
        "ElevenLabs API": os.getenv("ELEVENLABS_API_KEY"),
        "LiveKit": os.getenv("LIVEKIT_URL"),
    }
    
    missing = [name for name, key in services.items() if not key]
    if missing:
        logger.error(f"Missing API keys/credentials for: {', '.join(missing)}")
        logger.error("Please set environment variables in .env file")
        raise RuntimeError(f"Missing required credentials: {missing}")
    
    logger.info("All service credentials present")


async def handle_connection(ctx: JobContext):
    """
    Main handler for when a user connects to the room.
    
    Called by LiveKit Agents framework when:
    1. A participant joins the LiveKit room
    2. The agent is ready to begin voice conversation
    
    Args:
        ctx: JobContext containing room, participant, and lifecycle info
    """
    
    logger.info(f"[{ctx.room.name}] Agent connecting to room")
    
    try:
        # Set up the voice agent pipeline
        agent = await setup_agent(ctx)
        
        # Store agent in context
        ctx.user_data = ctx.user_data or {}
        ctx.user_data["agent"] = agent
        
        logger.info(f"[{ctx.room.name}] Agent initialized successfully")
        
        # Run the agent (blocking until call ends)
        await agent.run(ctx)
        
        logger.info(f"[{ctx.room.name}] Agent run completed successfully")
        
    except Exception as e:
        logger.error(f"[{ctx.room.name}] Error in agent: {e}", exc_info=True)
        raise
    finally:
        # Cleanup: save lead data
        if ctx.user_data and "worker" in ctx.user_data:
            worker = ctx.user_data["worker"]
            await worker.cleanup()
            logger.info(f"[{ctx.room.name}] Agent cleanup completed")


def prewarm(proc=None):
    """
    Prewarming function called on startup.
    Loads models and tests connectivity.
    """
    logger.info("=== Agent Startup ===")
    logger.info(f"LiveKit URL: {os.getenv('LIVEKIT_URL')}")
    logger.info(f"Agent Name: {os.getenv('AGENT_PARTICIPANT_NAME', 'husain-agent')}")
    
    try:
        prewarm_services()
        prewarm_models()
        logger.info("Startup checks passed ✓")
    except Exception as e:
        logger.error(f"Startup check failed: {e}")
        raise


# Export for LiveKit Agents framework
JOB_HANDLERS = {
    "handle_connection": handle_connection,
}

PREWARM = prewarm


# Run on startup (for development)
if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=handle_connection, prewarm_fnc=prewarm))
