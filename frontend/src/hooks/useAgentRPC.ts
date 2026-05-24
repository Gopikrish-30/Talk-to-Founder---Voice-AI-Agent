import { useEffect, useRef, useCallback } from 'react'
import { RoomEvent } from 'livekit-client'
import { useAppStore } from '../stores/useAppStore'

/**
 * Hook for listening to RPC events from the LiveKit agent
 * These events update the frontend state when the agent takes actions
 * 
 * TODO: Integrate with LiveKit room.onData or similar when RPC is fully setup
 */
export const useAgentRPC = () => {
  const room = useAppStore((state) => state.room)
  const addMessage = useAppStore((state) => state.addMessage)
  const updateLeadField = useAppStore((state) => state.updateLeadField)
  const setAgentState = useAppStore((state) => state.setAgentState)
  const setLeadAssessment = useAppStore((state) => state.setLeadAssessment)
  
  // Handler functions
  const handleAgentMessage = useCallback((data: { content: string }) => {
    console.log('[RPC] Agent message:', data.content)
    addMessage('agent', data.content)
    setAgentState('idle')
  }, [addMessage, setAgentState])
  
  const handleUpdateTranscript = useCallback((data: { text: string; final: boolean }) => {
    console.log('[RPC] Transcript update:', data.text)
    if (data.final) {
      addMessage('user', data.text)
    }
  }, [addMessage])
  
  const handleUpdateLeadField = useCallback((data: { field_name: string; value: string }) => {
    console.log('[RPC] Lead field captured:', data.field_name, '=', data.value)
    const fieldName = data.field_name as any
    updateLeadField(fieldName, data.value)
  }, [updateLeadField])
  
  const handleSetAgentState = useCallback((data: { state: 'idle' | 'listening' | 'thinking' | 'speaking' }) => {
    console.log('[RPC] Agent state changed:', data.state)
    setAgentState(data.state)
  }, [setAgentState])
  
  const handleSuggestBooking = useCallback((data: { message: string }) => {
    console.log('[RPC] Booking suggestion:', data.message)
    addMessage('agent', data.message)
  }, [addMessage])
  
  const handleAssessLeadFit = useCallback((data: any) => {
    console.log('[RPC] Lead assessment:', data)
    setLeadAssessment(data)
  }, [setLeadAssessment])
  
  // RPC handlers mapping
  const rpcHandlers = useRef({
    'agentMessage': handleAgentMessage,
    'updateTranscript': handleUpdateTranscript,
    'updateLeadField': handleUpdateLeadField,
    'setAgentState': handleSetAgentState,
    'suggestBooking': handleSuggestBooking,
    'assessLeadFit': handleAssessLeadFit,
  })
  
  const handleRPCEvent = useCallback((method: string, data: any) => {
    const handler = rpcHandlers.current[method as keyof typeof rpcHandlers.current]
    if (handler) {
      handler(data)
    } else {
      console.warn('[RPC] Unknown method:', method)
    }
  }, [])
  
  // Setup RPC listener via LiveKit data channel ✅
  useEffect(() => {
    if (!room) {
      console.log('[RPC] Waiting for LiveKit room connection...')
      return
    }
    
    console.log('[RPC] Setting up data packet listener')
    
    const handleData = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload))
        console.log('[RPC] Received:', data.method, data.params)
        
        // Route to appropriate handler
        handleRPCEvent(data.method, data.params)
      } catch (err) {
        console.error('[RPC] Parse error:', err)
      }
    }

    room.on(RoomEvent.DataReceived, handleData)
    
    return () => {
      console.log('[RPC] Cleaning up data listener')
      room.off(RoomEvent.DataReceived, handleData)
    }
  }, [room, handleRPCEvent])
  
  return { handleRPCEvent }
}
