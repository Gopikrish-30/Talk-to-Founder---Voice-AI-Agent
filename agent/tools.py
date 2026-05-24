"""
RPC Tool Definitions

These tools are called by the LLM to update the frontend and capture lead information.
Each tool fires an RPC event that the frontend listens to and updates its UI accordingly.
"""

import json
from typing import Optional
from livekit.agents import llm
from datetime import datetime


# Define tool handler functions
async def update_lead_field(field_name: str, value: str) -> dict:
    """Capture lead field information."""
    return {
        "status": "ok",
        "field": field_name,
        "value": value,
        "timestamp": datetime.utcnow().isoformat(),
    }


async def suggest_booking(text: str) -> dict:
    """Suggest booking a follow-up call or next step."""
    return {
        "status": "ok",
        "action": "booking_suggestion",
        "message": text,
        "timestamp": datetime.utcnow().isoformat(),
    }


async def add_call_note(text: str) -> dict:
    """Add an internal note about the call."""
    return {
        "status": "ok",
        "action": "call_note",
        "note": text,
        "timestamp": datetime.utcnow().isoformat(),
    }


async def assess_lead_fit(
    fit_level: str,
    recommended_service: Optional[str] = None,
    confidence: float = 0.8,
    notes: Optional[str] = None,
) -> dict:
    """Final assessment of lead fit at end of call."""
    return {
        "status": "ok",
        "action": "lead_assessment",
        "fit_level": fit_level,
        "recommended_service": recommended_service,
        "confidence": confidence,
        "notes": notes,
        "timestamp": datetime.utcnow().isoformat(),
    }


# Define proper llm.Tool objects with names ✅
TOOLS = [
    llm.Tool(
        name="update_lead_field",
        description="Update a lead field with captured information. Fields: name, company, industry, location, team_size, role, pain_point, current_tools, ai_experience, timeline, budget, email, phone",
        callable=update_lead_field,
        auto_execute=False,
    ),
    llm.Tool(
        name="suggest_booking",
        description="Suggest a booking/next step to the user. Example: 'Let me get you connected with our team for a deeper dive'",
        callable=suggest_booking,
        auto_execute=False,
    ),
    llm.Tool(
        name="add_call_note",
        description="Add interim note or context (internal tracking)",
        callable=add_call_note,
        auto_execute=False,
    ),
    llm.Tool(
        name="assess_lead_fit",
        description="Final assessment of lead fit and recommended service",
        callable=assess_lead_fit,
        auto_execute=False,
    ),
]


# Tool execution map (for backwards compatibility)
TOOL_HANDLERS = {
    "update_lead_field": update_lead_field,
    "suggest_booking": suggest_booking,
    "add_call_note": add_call_note,
    "assess_lead_fit": assess_lead_fit,
}


async def execute_tool(tool_name: str, **kwargs) -> dict:
    """Execute a tool by name with given arguments."""
    if tool_name not in TOOL_HANDLERS:
        return {"status": "error", "message": f"Unknown tool: {tool_name}"}
    
    handler = TOOL_HANDLERS[tool_name]
    try:
        result = await handler(**kwargs)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e), "tool": tool_name}
