import { create } from 'zustand'
import { Room } from 'livekit-client'

export interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
}

export interface LeadData {
  name?: string
  company?: string
  industry?: string
  location?: string
  team_size?: string
  role?: string
  pain_point?: string
  current_tools?: string
  ai_experience?: string
  timeline?: string
  budget?: string
  email?: string
  phone?: string
}

export interface AppState {
  // LiveKit room
  room?: Room
  
  // Messages
  messages: Message[]
  addMessage: (role: 'user' | 'agent', content: string) => void
  clearMessages: () => void
  
  // Agent state
  agentState: 'idle' | 'listening' | 'thinking' | 'speaking'
  setAgentState: (state: 'idle' | 'listening' | 'thinking' | 'speaking') => void
  
  // Voice activity
  isVoiceActive: boolean
  setVoiceActive: (active: boolean) => void
  
  // Interim transcript (what user is currently saying)
  interimTranscript: string
  setInterimTranscript: (text: string) => void
  
  // Chat input
  inputText: string
  setInputText: (text: string) => void
  
  // Lead data
  leadData: LeadData
  updateLeadField: (field: keyof LeadData, value: string) => void
  
  // Lead assessment
  leadAssessment?: {
    fit_level: string
    recommended_service?: string
    confidence: number
    notes?: string
  }
  setLeadAssessment: (assessment: any) => void
  
  // Call state
  callId: string
  isCallActive: boolean
  callStartTime: number | null
  startCall: () => void
  endCall: () => void
  
  // Error state
  error: string | null
  setError: (error: string | null) => void

  // Dictation state (ChatGPT-like dictation)
  isDictating: boolean
  setDictating: (dictating: boolean) => void

  // Voice amplitude
  audioAmplitude: number
  setAudioAmplitude: (amp: number) => void

  // UI state
  showSummary: boolean
  setShowSummary: (show: boolean) => void
  showEditModal: boolean
  setShowEditModal: (show: boolean) => void
  selectedEditField: keyof LeadData | null
  setSelectedEditField: (field: keyof LeadData | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  // LiveKit room
  room: undefined,
  
  // Messages
  messages: [],
  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now().toString(),
          role,
          content,
          timestamp: new Date().toISOString(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
  
  // Agent state
  agentState: 'idle',
  setAgentState: (state) => set({ agentState: state }),
  
  // Voice activity
  isVoiceActive: false,
  setVoiceActive: (active) => set({ isVoiceActive: active }),
  
  // Interim transcript
  interimTranscript: '',
  setInterimTranscript: (text) => set({ interimTranscript: text }),
  
  // Chat input
  inputText: '',
  setInputText: (text) => set({ inputText: text }),
  
  // Lead data
  leadData: {},
  updateLeadField: (field, value) =>
    set((state) => ({
      leadData: {
        ...state.leadData,
        [field]: value,
      },
    })),
  
  // Lead assessment
  leadAssessment: undefined,
  setLeadAssessment: (assessment) => set({ leadAssessment: assessment }),
  
  // Call state
  callId: '',
  isCallActive: false,
  callStartTime: null,
  startCall: () => set({ 
    callId: Date.now().toString(), 
    isCallActive: true,
    callStartTime: Date.now(),
  }),
  endCall: () => set({ isCallActive: false }),
  
  // Error state
  error: null,
  setError: (error) => set({ error }),

  // Dictation state
  isDictating: false,
  setDictating: (dictating) => set({ isDictating: dictating }),

  // Voice amplitude
  audioAmplitude: 0,
  setAudioAmplitude: (amp) => set({ audioAmplitude: amp }),

  // UI state
  showSummary: false,
  setShowSummary: (show) => set({ showSummary: show }),
  showEditModal: false,
  setShowEditModal: (show) => set({ showEditModal: show }),
  selectedEditField: null,
  setSelectedEditField: (field) => set({ selectedEditField: field }),
}))
