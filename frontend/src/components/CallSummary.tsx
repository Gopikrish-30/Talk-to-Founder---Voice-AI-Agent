import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Download,
  Copy,
  Check,
  Award,
  Clock,
  MessageSquare,
  ClipboardCheck,
  Terminal,
  Play
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

export const CallSummary: React.FC = () => {
  const showSummary = useAppStore((state) => state.showSummary)
  const setShowSummary = useAppStore((state) => state.setShowSummary)
  const messages = useAppStore((state) => state.messages)
  const leadData = useAppStore((state) => state.leadData)
  const leadAssessment = useAppStore((state) => state.leadAssessment)
  const callStartTime = useAppStore((state) => state.callStartTime)
  const clearMessages = useAppStore((state) => state.clearMessages)
  const callId = useAppStore((state) => state.callId)
  
  const [copied, setCopied] = useState(false)

  const calculateDuration = () => {
    if (!callStartTime) return '00:00'
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const downloadTranscript = () => {
    const transcript = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(transcript))
    element.setAttribute('download', `transcript-${callId}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const downloadLeadJSON = () => {
    const data = {
      call_id: callId,
      timestamp: new Date().toISOString(),
      duration: calculateDuration(),
      lead_data: leadData,
      assessment: leadAssessment,
      message_count: messages.length,
    }
    const element = document.createElement('a')
    element.setAttribute(
      'href',
      'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2))
    )
    element.setAttribute('download', `lead-${callId}.json`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const copyLeadJSON = () => {
    const json = JSON.stringify(leadData, null, 2)
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNewCall = () => {
    setShowSummary(false)
    clearMessages()
  }

  const getFitStyle = (fitLevel: string) => {
    switch (fitLevel?.toLowerCase()) {
      case 'strong_fit':
        return {
          border: 'border-slate-300',
          bg: 'bg-slate-50',
          text: 'text-slate-900',
          badge: '🟢 Strong B2B Fit',
        }
      case 'potential':
        return {
          border: 'border-slate-300',
          bg: 'bg-slate-50',
          text: 'text-slate-900',
          badge: '🟡 Potential Fit',
        }
      case 'early_stage':
        return {
          border: 'border-slate-300',
          bg: 'bg-slate-50',
          text: 'text-slate-900',
          badge: '🔵 Early-stage Qualified',
        }
      case 'no_fit':
        return {
          border: 'border-slate-300',
          bg: 'bg-slate-50',
          text: 'text-slate-900',
          badge: '🔴 Outside Ideal Profile',
        }
      default:
        return {
          border: 'border-slate-200',
          bg: 'bg-slate-50',
          text: 'text-slate-800',
          badge: '◯ Unassessed',
        }
    }
  }

  const fitStyle = leadAssessment ? getFitStyle(leadAssessment.fit_level) : null
  const fieldsFilledCount = Object.values(leadData).filter((v) => v).length

  return (
    <AnimatePresence>
      {showSummary && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSummary(false)}
          />

          {/* Modal Centered Container */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-0 select-none"
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="panel-premium shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col relative border border-slate-305"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative border-b border-slate-200 bg-slate-50 p-6 flex-shrink-0 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Post-Call Intelligence</p>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900 mt-1">Founder Discovery Summary</h2>
                  
                  <div className="flex items-center gap-1.5 mt-2 bg-white border border-slate-250 px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-700 w-fit shadow-sm">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    <span>ID: {callId}</span>
                  </div>
                </div>

                <motion.button
                  onClick={() => setShowSummary(false)}
                  className="p-2 hover:bg-slate-200/60 border border-slate-250 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-slate-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 bg-white">
                
                {/* Fit Assessment Card */}
                {fitStyle && leadAssessment && (
                  <motion.div
                    className={`p-5 rounded-2xl border ${fitStyle.border} ${fitStyle.bg} relative overflow-hidden shadow-sm`}
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <Award className={`w-5 h-5 ${fitStyle.text}`} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Valuation</p>
                          <p className={`text-base font-black mt-0.5 ${fitStyle.text}`}>{fitStyle.badge}</p>
                        </div>
                      </div>
                      
                      {leadAssessment.confidence && (
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confidence</p>
                          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight mt-0.5">{leadAssessment.confidence}%</p>
                        </div>
                      )}
                    </div>
                    {leadAssessment.notes && (
                      <p className="text-[13px] mt-4 text-slate-750 leading-relaxed border-t border-slate-200 pt-3.5 font-medium">
                        {leadAssessment.notes}
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Quick Premium Stats grid */}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-inner">
                      <Clock className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Duration</p>
                      <p className="text-lg font-black text-slate-900 font-mono mt-1.5">{calculateDuration()}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-inner">
                      <MessageSquare className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Exchanges</p>
                      <p className="text-lg font-black text-slate-900 font-mono mt-1.5">{messages.length}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-inner">
                      <ClipboardCheck className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Criteria Met</p>
                      <p className="text-lg font-black text-slate-900 font-mono mt-1.5">{fieldsFilledCount}/13</p>
                    </div>
                  </div>
                </motion.div>

                {/* Captured lead criteria box */}
                <motion.div
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    <span>Captured System Intelligence</span>
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(leadData)
                      .map(([key, value]) => (
                        <div key={key} className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-center min-w-0 shadow-sm">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {key.replace('_', ' ')}
                          </p>
                          <p className={`text-[13px] font-semibold mt-2 truncate ${
                            value ? 'text-slate-900 font-bold' : 'text-slate-400 italic font-medium'
                          }`}>
                            {value || '—'}
                          </p>
                        </div>
                      ))}
                  </div>
                </motion.div>

                {/* Recommended Service CTA */}
                {leadAssessment?.recommended_service && (
                  <motion.div
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 mb-2">
                      <Terminal className="w-4 h-4 text-slate-900" />
                      <span>Recommended Service Strategy</span>
                    </p>
                    <p className="text-[13px] text-slate-700 leading-relaxed font-semibold">
                      {leadAssessment.recommended_service}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="border-t border-slate-200 bg-slate-50 p-6 flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <motion.button
                    onClick={downloadTranscript}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm animate-fade-in"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Download className="w-4 h-4 text-slate-900" />
                    <span>Download Transcript</span>
                  </motion.button>
                  <motion.button
                    onClick={downloadLeadJSON}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span>Export Lead Dossier</span>
                  </motion.button>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={copyLeadJSON}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Data Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-900" />
                        <span>Copy Lead JSON</span>
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    onClick={handleNewCall}
                    className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-900 cursor-pointer flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch New Call</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
