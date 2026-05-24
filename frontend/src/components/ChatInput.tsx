import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Mic, MicOff, AudioLines, Send } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

interface ChatInputProps {
  onSendMessage?: (text: string) => void
  onToggleVoice?: () => void
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onToggleVoice }) => {
  const interimTranscript = useAppStore((state) => state.interimTranscript)
  const inputText = useAppStore((state) => state.inputText)
  const setInputText = useAppStore((state) => state.setInputText)
  const addMessage = useAppStore((state) => state.addMessage)
  const isVoiceActive = useAppStore((state) => state.isVoiceActive)

  const handleSend = () => {
    if (inputText.trim()) {
      addMessage('user', inputText)
      onSendMessage?.(inputText)
      setInputText('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative w-full z-20 max-w-[640px] mx-auto">
      
      {/* Floating Interim Transcript */}
      <AnimatePresence>
        {interimTranscript && (
          <motion.div
            className="absolute left-4 right-4 -top-16 bg-white border-2 border-slate-900 px-4 py-2.5 rounded-2xl shadow-md z-30 flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping flex-shrink-0" />
            <p className="text-xs text-slate-800 font-semibold truncate">
              "{interimTranscript}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double Pill Layout - Styled for High Usability and High Visibility */}
      <div className="input-premium-pill flex items-center w-full">
        <div className="bg-white rounded-full px-4 py-2.5 flex items-center justify-between w-full gap-2 border border-slate-200/50 shadow-sm">
          {/* Plus icon on the left */}
          <button 
            type="button"
            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex-shrink-0"
            onClick={() => alert("File attachment coming soon!")}
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isVoiceActive ? 'Listening...' : 'Ask anything'}
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent font-medium"
          />

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={onToggleVoice}
              className={`p-1 transition-colors cursor-pointer ${isVoiceActive ? 'text-red-650' : 'text-slate-400 hover:text-slate-700'}`}
            >
              {isVoiceActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Solid black circle sound/send button */}
            <button
              type="button"
              onClick={inputText.trim() ? handleSend : onToggleVoice}
              className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center text-white cursor-pointer"
            >
              {inputText.trim() ? (
                <Send className="w-4 h-4" />
              ) : (
                <AudioLines className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
