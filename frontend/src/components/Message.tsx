import React from 'react'
import { motion } from 'framer-motion'
import { CheckCheck } from 'lucide-react'
import { Message as MessageType } from '../stores/useAppStore'

interface MessageProps {
  message: MessageType
  isLast?: boolean
}


export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user'
  
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()
    } catch {
      return '4:56 pm'
    }
  }

  return (
    <motion.div
      className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-in`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, cubicBezier: [0.16, 1, 0.3, 1] }}
    >
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Bubble */}
        <div
          className={`
            relative px-5 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm font-medium
            ${
              isUser
                ? 'bg-slate-900 text-white border border-slate-900 rounded-tr-sm'
                : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-sm'
            }
          `}
        >
          <span className="whitespace-pre-wrap select-text">{message.content}</span>
          
          {/* Timestamp inside or below bubble */}
          <div className={`flex items-center gap-1 mt-1 justify-end text-[10px] ${isUser ? 'text-white/70' : 'text-slate-400'}`}>
            <span>{formatTime(message.timestamp)}</span>
            {isUser && <CheckCheck className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

