import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Sparkles, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

export const CallHeader: React.FC = () => {
  const isCallActive = useAppStore((state) => state.isCallActive)
  const callStartTime = useAppStore((state) => state.callStartTime)
  const leadAssessment = useAppStore((state) => state.leadAssessment)
  const setShowSummary = useAppStore((state) => state.setShowSummary)
  const endCall = useAppStore((state) => state.endCall)
  const [callDuration, setCallDuration] = useState('00:00')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Update call timer
  useEffect(() => {
    if (!isCallActive || !callStartTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      setCallDuration(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [isCallActive, callStartTime])

  const confirmEndCall = async () => {
    setIsSaving(true)

    // Compute end timestamp and duration
    const endTimestamp = new Date().toISOString()
    const start = useAppStore.getState().callStartTime
    const durationSeconds = start ? Math.floor((Date.now() - start) / 1000) : 0

    // Stamp the lead data with session metadata
    const store = useAppStore.getState()
    store.updateLeadField('ended_at', endTimestamp)
    store.updateLeadField('duration_seconds', String(durationSeconds))

    // End the call in the store
    endCall()
    setShowConfirm(false)

    // Send enriched lead data to backend
    const callId = store.callId
    const leadData = { ...store.leadData, ended_at: endTimestamp, duration_seconds: durationSeconds }
    try {
      const tokenServerUrl = (import.meta as any).env?.VITE_TOKEN_SERVER_URL || '/api'
      await fetch(`${tokenServerUrl}/end-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, leadData }),
      })
      console.log('[End Call] Lead data saved ✓')
    } catch (e) {
      console.error('[End Call] Failed to save lead data', e)
    }

    setIsSaving(false)
    setTimeout(() => {
      setShowSummary(true)
    }, 300)
  }

  const getFitBadge = () => {
    if (!leadAssessment) return null

    const fitLevel = leadAssessment.fit_level?.toLowerCase() || ''

    const styles: Record<string, { text: string; bg: string; border: string; dot: string }> = {
      strong_fit: {
        text: 'text-emerald-800',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        dot: 'bg-emerald-600'
      },
      potential: {
        text: 'text-amber-800',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        dot: 'bg-amber-600'
      },
      early_stage: {
        text: 'text-blue-800',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        dot: 'bg-blue-600'
      },
      no_fit: {
        text: 'text-red-800',
        bg: 'bg-red-50',
        border: 'border-red-200',
        dot: 'bg-red-600'
      }
    }

    const currentStyle = styles[fitLevel] || {
      text: 'text-slate-700',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      dot: 'bg-slate-500'
    }

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${currentStyle.bg} ${currentStyle.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${currentStyle.dot}`} />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${currentStyle.text}`}>
          {fitLevel.replace(/_/g, ' ')}
        </span>
      </div>
    )
  }

  if (!isCallActive) return null

  return (
    <>
      <motion.div
        className="w-full bg-white/95 border-b border-slate-200 text-slate-800 px-6 py-3.5 shadow-sm relative z-40"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Left: Active Connection Status & real-time Timer clock */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-emerald-50/80 border border-emerald-200 px-3 py-1 rounded-full select-none shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Live Session</span>
            </div>

            <div className="text-xl font-bold font-mono text-slate-900 tracking-tight leading-none bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 shadow-inner">
              {callDuration}
            </div>
          </div>

          {/* Center: Real-time fit assessment badge */}
          {leadAssessment && (
            <div className="hidden md:block select-none">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Assessment:</span>
                {getFitBadge()}
              </div>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 select-none shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 font-mono">Agent Speaking</span>
            </div>

            <motion.button
              id="end-session-btn"
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer text-xs uppercase tracking-wider"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Phone className="w-4 h-4 transform rotate-180" />
              <span>End Session</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Card */}
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 max-w-sm w-full mx-4 z-10"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            >
              {/* Icon */}
              <div className="flex items-center justify-center w-14 h-14 bg-red-50 border border-red-100 rounded-2xl mx-auto mb-5">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
                End this session?
              </h2>
              <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
                The conversation will be summarised and your lead data will be saved automatically.
              </p>

              {/* Session stats preview */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between mb-6">
                <span className="text-xs text-slate-500 font-medium">Session duration</span>
                <span className="text-sm font-bold font-mono text-slate-900">{callDuration}</span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Continue Call
                </button>
                <button
                  onClick={confirmEndCall}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <span className="animate-pulse">Saving…</span>
                  ) : (
                    <>
                      <Phone className="w-3.5 h-3.5 rotate-180" />
                      End Session
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
