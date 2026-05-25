import { useCallback, useState, useEffect, useRef } from 'react'
import { useAppStore } from '../stores/useAppStore'

const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || ''

const getApiBase = () => {
  return typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : ''
}

export const useVoiceAssistant = () => {
  const [isConnecting, setIsConnecting] = useState(false)
  const error = useAppStore((state) => state.error)
  const setError = useAppStore((state) => state.setError)
  
  const setVoiceActive = useAppStore((state) => state.setVoiceActive)
  const startCall = useAppStore((state) => state.startCall)
  const endCall = useAppStore((state) => state.endCall)
  const setAgentState = useAppStore((state) => state.setAgentState)
  const addMessage = useAppStore((state) => state.addMessage)
  const setInputText = useAppStore((state) => state.setInputText)

  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isListeningRef = useRef(false)
  const messagesRef = useRef<any[]>([])
  const finalTranscriptRef = useRef('')

  // Load conversation history from store into ref for LLM
  useEffect(() => {
    const unsub = useAppStore.subscribe(
      (state) => {
        messagesRef.current = state.messages
      }
    )
    return () => unsub()
  }, [])

  // Instantly synthesize and stream speech via ElevenLabs
  const speakText = async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        setAgentState('speaking')
        console.log('[Voice] Streaming speech from server:', text)
        
        try {
          if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
          }
          
          // Stream directly using GET endpoint to allow instant native buffering & playback
          const streamUrl = `${getApiBase()}/api/tts?text=${encodeURIComponent(text)}`
          const audio = new Audio(streamUrl)
          audio.crossOrigin = "anonymous" // Allow cross-origin audio analysis
          audioRef.current = audio
          
          audio.onplay = () => {
            console.log('[Voice] Streaming audio started successfully')
            
            try {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
              const audioCtx = new AudioContextClass()
              const analyser = audioCtx.createAnalyser()
              analyser.fftSize = 256
              const source = audioCtx.createMediaElementSource(audio)
              source.connect(analyser)
              analyser.connect(audioCtx.destination)
              
              const dataArray = new Uint8Array(analyser.frequencyBinCount)
              let animationFrameId: number
              
              const updateAmp = () => {
                if (audio.paused || audio.ended) {
                  useAppStore.getState().setAudioAmplitude(0)
                  cancelAnimationFrame(animationFrameId)
                  return
                }
                analyser.getByteTimeDomainData(dataArray)
                let sum = 0
                for (let i = 0; i < dataArray.length; i++) {
                  const v = (dataArray[i] - 128) / 128
                  sum += v * v
                }
                const rms = Math.sqrt(sum / dataArray.length)
                // Boost and limit amplitude to 0..1
                useAppStore.getState().setAudioAmplitude(Math.min(1, rms * 4.5))
                animationFrameId = requestAnimationFrame(updateAmp)
              }
              
              audioCtx.resume()
              updateAmp()
            } catch (analyserErr) {
              console.warn('[Voice] Could not setup real-time audio analyzer:', analyserErr)
            }
          }
          
          audio.onended = () => {
            console.log('[ElevenLabs] Audio completed')
            useAppStore.getState().setAudioAmplitude(0)
            resolve()
          }
          
          audio.onerror = () => {
            console.warn('[Voice] Direct streaming failed, falling back to browser Speech Synthesis')
            speakBrowserFallback(text).then(resolve)
          }
          
          await audio.play()
        } catch (serverErr) {
          console.warn('[Voice] Server TTS stream failed on play, falling back to browser Speech Synthesis:', serverErr)
          await speakBrowserFallback(text)
          resolve()
        }
      } catch (err) {
        console.error('[Voice] Playback error:', err)
        resolve()
      }
    })
  }

  // Local Web Speech Synthesis fallback
  const speakBrowserFallback = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      console.log('[TTS Fallback] Using Web Speech Synthesis...')
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      const voices = window.speechSynthesis.getVoices()
      // Prioritize high-quality English male voices to fit founder persona
      const preferred = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male')) || 
                        voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('david')) ||
                        voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google')) || 
                        voices.find(v => v.lang.startsWith('en')) || 
                        voices[0]
      if (preferred) {
        utterance.voice = preferred
      }
      
      utterance.onend = () => {
        resolve()
      }
      utterance.onerror = () => {
        resolve()
      }
      
      window.speechSynthesis.speak(utterance)
    })
  }

  // ── Lead Extraction ──────────────────────────────────────────────────────────
  // Uses a dedicated backend endpoint (/api/extract-lead) which runs
  // llama-4-scout-17b via a separate Groq API key — completely isolated
  // from the main conversation model. Called silently after every AI turn.
  const extractLeadData = async () => {
    const messages = messagesRef.current
    if (messages.length < 2) return // not enough conversation yet

    // ⚠️  Only send USER messages to the extraction model.
    // Agent messages contain Husain's name/company (the founder) — if we
    // include them the LLM will mistakenly capture "Husain" / "Maneuver" as
    // the lead's name/company. We only care about what the PROSPECT said.
    const userMessages = messages.filter((m: any) => m.role === 'user')
    if (userMessages.length === 0) return

    const conversationText = userMessages
      .map((m: any) => m.content)
      .join('\n')

    try {
      const response = await fetch(`${getApiBase()}/api/extract-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: conversationText }),
      })

      if (!response.ok) {
        console.warn(`[Lead] /api/extract-lead returned ${response.status}`)
        return
      }

      const data = await response.json()
      const extracted = data.lead

      if (!extracted || typeof extracted !== 'object' || Array.isArray(extracted)) return

      // Merge into store — only overwrite with non-empty string values
      const store = useAppStore.getState()
      const fields = [
        'name','company','industry','location','team_size','role',
        'pain_point','current_tools','ai_experience','timeline','budget','email','phone'
      ] as const
      let changed = false
      for (const field of fields) {
        const val = extracted[field]
        if (typeof val === 'string' && val.trim()) {
          store.updateLeadField(field, val.trim())
          changed = true
        }
      }
      if (changed) {
        console.log('[Lead] llama-4-scout extracted from user messages ✓', extracted)
      }
    } catch (e) {
      // Silently ignore — lead extraction is best-effort, never blocks UX
      console.warn('[Lead] Extraction error (non-blocking):', e)
    }
  }

  // Call Groq LLaMA LLM to process conversational turn
  const callLLM = async (userSpeech: string) => {
    // Stop recording speech immediately to prevent any interim/final transcript updates during thinking/speaking
    if (recognitionRef.current) {
      try {
        isListeningRef.current = false
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onresult = null
        recognitionRef.current.stop()
        recognitionRef.current = null
      } catch (e) {
        console.warn('[Voice] Error stopping recognition on LLM call:', e)
      }
    }

    // Clear speech recognition transcript memory so it starts fresh for the next turn!
    finalTranscriptRef.current = ''
    setInputText('')

    // Ensure call is marked active (shows End Session header) even for text-only users
    if (!useAppStore.getState().isCallActive) {
      startCall()
    }

    try {
      setAgentState('thinking')
      console.log('[Groq] Sending query:', userSpeech)
      
      let replyText = ""
      
      try {
        const history = messagesRef.current.slice(-10).map((m) => ({
          role: m.role === 'agent' ? 'assistant' : 'user',
          content: m.content,
        }))

        const response = await fetch(`${getApiBase()}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              ...history,
              { role: 'user', content: userSpeech }
            ]
          }),
        })

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`)
        }

        const data = await response.json()
        replyText = data.reply
      } catch (serverErr) {
        console.warn('[Groq] Server proxy chat failed, falling back to direct browser Groq completions:', serverErr)

        if (!GROQ_API_KEY) {
          throw new Error('Server proxy chat failed and no GROQ_API_KEY is configured for direct browser fallback.')
        }

        const history = messagesRef.current.slice(-10).map((m) => ({
          role: m.role === 'agent' ? 'assistant' : 'user',
          content: m.content,
        }))

        const directEndpoints = [
          'https://api.groq.com/openai/v1/chat/completions',
        ]

        let directResponse: Response | null = null
        let lastError: Error | null = null
        for (const url of directEndpoints) {
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                  { role: 'system', content: 'You are Husain, founder of Maneuver. Reply in 1-3 direct conversational sentences. Speak naturally as a founder, not a bot.' },
                  ...history,
                  { role: 'user', content: userSpeech }
                ],
                temperature: 0.7,
              }),
            })

            if (response.ok) {
              directResponse = response
              break
            }

            lastError = new Error(`Endpoint ${url} returned ${response.status}`)
          } catch (fetchErr) {
            lastError = fetchErr as Error
          }
        }

        if (!directResponse) {
          throw new Error(`All direct Groq endpoints failed: ${lastError?.message ?? 'unknown error'}`)
        }

        const data = await directResponse.json()
        replyText = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? ''
        if (!replyText) {
          throw new Error('Direct Groq response did not contain a valid message.')
        }
      }
      
      // Post agent response to chat transcript
      addMessage('agent', replyText)

      // Extract lead data from conversation in background (non-blocking)
      extractLeadData().catch((e) => console.warn('[Lead] Extraction failed silently:', e))

      // Speak back
      await speakText(replyText)
      
      // Stop STT and go idle after response completes
      setAgentState('idle')

      // Automatically restart a fresh listening session for the next turn if voice is still active!
      if (useAppStore.getState().isVoiceActive) {
        console.log('[Voice] Restarting speech recognition for next turn...')
        startVoiceAssistant()
      }
    } catch (err) {
      console.error('[Voice] LLM/TTS loop failed:', err)
      addMessage('agent', "I'm having a bit of trouble connecting right now. Can you try again?")
      setAgentState('idle')

      if (useAppStore.getState().isVoiceActive) {
        startVoiceAssistant()
      }
    }
  }

  // Start browser speech recognition
  const startListening = () => {
    const active = useAppStore.getState().isVoiceActive
    if (recognitionRef.current && !isListeningRef.current && active) {
      try {
        console.log('[STT] Starting speech recognition...')
        isListeningRef.current = true
        
        const currentState = useAppStore.getState().agentState
        if (currentState !== 'speaking' && currentState !== 'thinking') {
          setAgentState('listening')
        }
        
        recognitionRef.current.start()
      } catch (e) {
        console.warn('[STT] Failed to start recognition:', e)
      }
    }
  }

  // Stop browser speech recognition
  const stopListening = () => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        console.log('[STT] Stopping speech recognition...')
        isListeningRef.current = false
        recognitionRef.current.stop()
      } catch (e) {
        console.warn('[STT] Failed to stop recognition:', e)
      }
    }
  }

  // Start entire voice assistant experience (ChatGPT Dictation Mode)
  const startVoiceAssistant = useCallback(async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      // Immediately stop any active audio (Husain speaking) to prioritize user speaking first!
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      window.speechSynthesis.cancel()
      
      // Reset transcription states
      finalTranscriptRef.current = ''
      setInputText('')
      
      console.log('[Voice] Initializing Web Speech STT for dictation...')

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        throw new Error('Speech Recognition is not supported by your browser. Please use Google Chrome or Microsoft Edge.')
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true // Continuous so the user controls when to finish speaking by clicking submit
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        console.log('[STT] Dictation recording active...')
      }

      recognition.onresult = (event: any) => {
        let interimText = ''
        let finalText = ''
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript
          } else {
            interimText += event.results[i][0].transcript
          }
        }
        
        if (finalText) {
          finalTranscriptRef.current += finalText
        }
        
        const fullTranscript = finalTranscriptRef.current + interimText
        setInputText(fullTranscript)
      }

      recognition.onend = () => {
        console.log('[STT] Dictation recording session ended')
        isListeningRef.current = false
        
        // Restart automatically if they are still dictating and voice is active
        if (useAppStore.getState().isDictating && useAppStore.getState().isVoiceActive) {
          startListening()
        }
      }

      recognition.onerror = (e: any) => {
        console.error('[STT] Dictation error event:', e.error)
        if (e.error === 'no-speech') {
          console.log('[STT] Silence timeout, keeping active...')
        } else if (e.error !== 'aborted') {
          setError(`Speech recognition error: ${e.error}`)
          useAppStore.getState().setDictating(false)
          setVoiceActive(false)
          endCall()
        }
      }

      recognitionRef.current = recognition
      setVoiceActive(true)
      useAppStore.getState().setDictating(true)
      startCall()
      
      // Start listening immediately
      startListening()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed'
      console.error('[Voice] Setup failed:', message)
      setError(message)
      useAppStore.getState().setDictating(false)
      setVoiceActive(false)
      endCall()
    } finally {
      setIsConnecting(false)
    }
  }, [setInputText, setVoiceActive, startCall, endCall, setError])

  // Submit recorded dictation transcript (Tick ✓ clicked)
  const submitDictation = useCallback(() => {
    const text = useAppStore.getState().inputText.trim()
    console.log('[Dictation] Submitting transcript:', text)
    
    // Stop recording STT
    stopListening()
    
    // Discard references
    finalTranscriptRef.current = ''
    
    if (text) {
      // Add user message to transcript history
      addMessage('user', text)
      
      // Trigger AI query
      callLLM(text)
    }
    
    // Reset dictation flag
    useAppStore.getState().setDictating(false)
  }, [addMessage, callLLM])

  // Cancel recorded dictation transcript (Cancel X clicked)
  const cancelDictation = useCallback(() => {
    console.log('[Dictation] Cancelling dictation...')
    
    // Stop recording STT
    stopListening()
    
    // Clear text
    setInputText('')
    finalTranscriptRef.current = ''
    
    // Reset state flags
    useAppStore.getState().setDictating(false)
    useAppStore.getState().setVoiceActive(false)
    useAppStore.getState().setAgentState('idle')
    endCall()
  }, [setInputText, endCall])

  // Stop entire voice assistant experience
  const stopVoiceAssistant = useCallback(async () => {
    try {
      console.log('[Voice] Stopping voice assistant...')
      
      setVoiceActive(false)
      useAppStore.getState().setDictating(false)
      setAgentState('idle')
      endCall()

      // Stop recognition
      if (recognitionRef.current) {
        isListeningRef.current = false
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.stop()
        recognitionRef.current = null
      }

      // Stop audio playback
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      useAppStore.getState().setAudioAmplitude(0)
      
      console.log('[Voice] Disconnected successfully ✓')
    } catch (err) {
      console.error('[Voice] Stop error:', err)
    }
  }, [setVoiceActive, setAgentState, endCall])

  // Toggle voice on/off (from header button or mic click)
  const toggleVoice = useCallback(async () => {
    if (isConnecting) return
    
    const active = useAppStore.getState().isVoiceActive
    const dictating = useAppStore.getState().isDictating
    
    if (active || dictating) {
      await stopVoiceAssistant()
    } else {
      await startVoiceAssistant()
    }
  }, [isConnecting, startVoiceAssistant, stopVoiceAssistant])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const active = useAppStore.getState().isVoiceActive
      if (active) {
        stopVoiceAssistant()
      }
    }
  }, [stopVoiceAssistant])

  return {
    isConnecting,
    error,
    toggleVoice,
    sendMessage: callLLM,
    startVoiceAssistant,
    stopVoiceAssistant,
    submitDictation,
    cancelDictation,
  }
}
