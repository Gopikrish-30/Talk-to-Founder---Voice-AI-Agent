import React, { useEffect, useRef } from 'react'
import { MessageSquare } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import { Message } from './Message'

export const ConversationHistory: React.FC = () => {
  const messages = useAppStore((state) => state.messages)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  return (
    <div className="w-full h-full p-4 md:p-6 bg-transparent flex flex-col justify-between">
      <div
        ref={scrollRef}
        className="panel-premium-glass p-4 flex-1 h-full overflow-y-auto scroll-smooth flex flex-col"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-4">
            <MessageSquare className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
            <p className="text-sm font-semibold text-slate-600">No conversation yet</p>
            <p className="text-xs text-slate-450 mt-1">Start talking or typing to begin</p>
          </div>
        ) : (
          <>
            {/* Center Today Separator */}
            <div className="flex justify-center my-3">
              <span className="bg-white px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100 uppercase tracking-wider">
                Today
              </span>
            </div>
            
            <div className="flex-1 space-y-2">
              {messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  isLast={index === messages.length - 1}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

