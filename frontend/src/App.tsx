import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConversationHistory } from './components/ConversationHistory'
import { VoiceOrb } from './components/VoiceOrb'
import { ChatInput } from './components/ChatInput'
import { ContactForm } from './components/ContactForm'
import { CallHeader } from './components/CallHeader'
import { CallSummary } from './components/CallSummary'
import { useVoiceAssistant } from './hooks/useVoiceAssistant'
import { useAppStore } from './stores/useAppStore'
import { ChevronLeft, MessageSquare, PhoneCall, UserCheck } from 'lucide-react'

function App() {
  const { toggleVoice, sendMessage } = useVoiceAssistant()
  const isCallActive = useAppStore((state) => state.isCallActive)
  const error = useAppStore((state) => state.error)
  const setError = useAppStore((state) => state.setError)
  
  // Desktop Panel Toggle State
  const [isFormOpen, setIsFormOpen] = useState(true)
  
  // Mobile Tab Navigation State
  const [activeTab, setActiveTab] = useState<'chat' | 'orb' | 'contact'>('orb')

  // Dynamic Voice Orb Resizing for Mobile
  const [orbSize, setOrbSize] = useState(window.innerWidth < 768 ? 260 : 330)

  useEffect(() => {
    const handleResize = () => {
      setOrbSize(window.innerWidth < 768 ? 260 : 330)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#f8fafc] text-slate-800 selection:bg-slate-900/10 selection:text-slate-900 relative font-sans">

      {/* Live Call Header – shows End Session button when a call is active */}
      <CallHeader />

      {/* Post-call Summary Modal */}
      <CallSummary />

      {/* Header Bar */}
      <header className="px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0 z-20">
        <div className="bg-white rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border border-slate-200/80 shadow-sm">
          
          {/* Left: Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-200/60 shadow-sm flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="Maneuver Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tighter text-slate-900 ml-1 hidden xs:inline-block">
              maneuver
            </span>
          </div>

          {/* Center: Talk to Founder */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/50">
             <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isCallActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
             <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-slate-500 uppercase">
               TALK TO FOUNDER
             </span>
          </div>

          {/* Right: Book a Call */}
          <div className="flex items-center gap-4">
            <a 
              href="https://calendly.com/husain-maneuver/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex items-center justify-center text-center shadow-sm"
            >
              Book a Call
            </a>
          </div>
        </div>
      </header>

      {/* Premium Alert/Notification Bar */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="px-4 sm:px-6 pt-3 flex-shrink-0 z-30"
          >
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />
                <p className="text-[11px] sm:text-xs font-semibold">
                  ⚠️ Mic or Permission Issue: {error === 'not-allowed' ? 'Microphone permission blocked. Please click the camera/mic icon in the browser address bar and choose "Allow".' : error}
                </p>
              </div>
              <button 
                onClick={() => setError(null)} 
                className="text-[11px] sm:text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-100/50 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace (3-Column Layout on Desktop / Responsive Tabs on Mobile) */}
      <main className="flex-1 p-4 sm:p-6 min-h-0 overflow-hidden relative max-w-[1500px] mx-auto w-full flex flex-col justify-center mb-16 md:mb-0">
        <div className={`w-full h-full grid gap-6 transition-all duration-300 ${
          isFormOpen 
            ? 'grid-cols-1 md:grid-cols-[1.1fr_1.3fr_1.1fr]' 
            : 'grid-cols-1 md:grid-cols-[1.1fr_1.3fr]'
        }`}>
          
          {/* Column 1: Chat History Panel */}
          <div className={`${activeTab === 'chat' ? 'block' : 'hidden'} md:block h-full min-h-0`}>
            <ConversationHistory />
          </div>
          
          {/* Column 2: Voice Orb (Default main panel) */}
          <div className={`${activeTab === 'orb' ? 'flex' : 'hidden'} md:flex flex-col items-center justify-center p-2 sm:p-4 min-h-0 relative flex-1`}>
            {/* Title */}
            <h1 className="text-slate-900 font-serif text-3xl sm:text-4xl font-extrabold mb-4 sm:mb-8 tracking-tight flex items-center gap-2">
              Husain <span className="text-slate-400 font-serif font-extrabold">AI</span>
            </h1>

            {/* Premium Voice Orb - Responsive scaling */}
            <div className="flex-1 flex items-center justify-center min-h-[220px] sm:min-h-[280px]">
              <div className="z-10 scale-95 sm:scale-100 md:scale-105">
                <VoiceOrb size={orbSize} />
              </div>
            </div>
            
            {/* Floating ChatInput pill */}
            <div className="w-full mt-4 sm:mt-8">
              <ChatInput onToggleVoice={toggleVoice} onSendMessage={sendMessage} />
            </div>
          </div>
          
          {/* Column 3: Contact Form */}
          {isFormOpen ? (
            <div className={`${activeTab === 'contact' ? 'block' : 'hidden'} md:block h-full min-h-0 relative`}>
              <ContactForm onClose={() => setIsFormOpen(false)} />
            </div>
          ) : (
            /* Elegant glassy side tab arrow button positioned vertically in the center of the right edge */
            <button
              onClick={() => setIsFormOpen(true)}
              className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 bg-white hover:bg-slate-50 border-[1.5px] border-r-0 border-slate-300 rounded-l-xl p-3 shadow-md items-center justify-center cursor-pointer transition-all hover:scale-[1.08] active:scale-[0.92] z-30 group animate-fade-in"
              title="Open Contact Sidebar"
            >
              <ChevronLeft className="w-5 h-5 text-slate-750 group-hover:text-slate-900 transition-colors" />
            </button>
          )}

        </div>
      </main>

      {/* Floating Glassmorphic Bottom Navigation Dock - ONLY visible on Mobile */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-lg p-2 flex items-center justify-around gap-1">
        {/* Chat History Tab */}
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'chat' 
              ? 'bg-slate-900 text-white font-bold scale-[1.03] shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px]">History</span>
        </button>

        {/* Voice Assistant Main Tab */}
        <button
          onClick={() => setActiveTab('orb')}
          className={`flex-1 py-2 px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all relative ${
            activeTab === 'orb' 
              ? 'bg-slate-900 text-white font-bold scale-[1.03] shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isCallActive && (
            <span className="absolute top-2 right-[34%] w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
          <PhoneCall className="w-5 h-5" />
          <span className="text-[9px]">Assistant</span>
        </button>

        {/* Contact/Inquiry Tab */}
        <button
          onClick={() => setActiveTab('contact')}
          className={`flex-1 py-2 px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'contact' 
              ? 'bg-slate-900 text-white font-bold scale-[1.03] shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[9px]">Contact</span>
        </button>
      </nav>
    </div>
  )
}

export default App
