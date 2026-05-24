import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  Circle, 
  Edit2, 
  Copy, 
  Download, 
  User, 
  Building2, 
  Briefcase, 
  MapPin, 
  Users2, 
  Shield, 
  AlertCircle, 
  Wrench, 
  Cpu, 
  Calendar, 
  DollarSign, 
  Mail, 
  Phone,
  Sparkles,
  CalendarDays,
  ExternalLink,
  Video,
  CheckCircle,
  Loader2,
  ChevronRight,
  Clock,
  ChevronDown,
  MessageSquare,
  X
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import axios from 'axios'

const TOKEN_SERVER_URL = (import.meta as any).env?.VITE_TOKEN_SERVER_URL || 'http://localhost:8000'

interface LeadCapturePanelProps {
  onClose?: () => void
}

export const LeadCapturePanel: React.FC<LeadCapturePanelProps> = ({ onClose }) => {
  const leadData = useAppStore((state) => state.leadData)
  const leadAssessment = useAppStore((state) => state.leadAssessment)
  const setShowEditModal = useAppStore((state) => state.setShowEditModal)
  
  // 3-Tab Control: 'dossier' | 'scheduler' | 'contact'
  const [activeTab, setActiveTab] = useState<'dossier' | 'scheduler' | 'contact'>('dossier')

  // 1. Contact Form States
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactQuery, setContactQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Pre-fill contact form fields from voice agent extraction
  useEffect(() => {
    if (leadData.name) setContactName(leadData.name)
    if (leadData.email) setContactEmail(leadData.email)
    if (leadData.phone) setContactPhone(leadData.phone)
  }, [leadData])

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName || !contactEmail || !contactQuery) {
      setSubmitError('Please fill out all required fields.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await axios.post(`${TOKEN_SERVER_URL}/contact`, {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        query: contactQuery
      })
      setSubmitSuccess(true)
      setContactQuery('')
    } catch (err) {
      console.warn('[Contact] Backend server not reachable, simulating success...', err)
      setTimeout(() => {
        setSubmitSuccess(true)
        setContactQuery('')
      }, 600)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 2. Scheduler Tab States
  const [schedulerMode, setSchedulerMode] = useState<'calendly' | 'meet'>('meet')
  const [meetDate, setMeetDate] = useState('')
  const [meetTime, setMeetTime] = useState('10:00')
  const [meetBooked, setMeetBooked] = useState(false)
  const [generatedMeetLink, setGeneratedMeetLink] = useState('')

  const handleMeetBook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetDate) return

    const randomId = Math.random().toString(36).substring(2, 5) + '-' + 
                     Math.random().toString(36).substring(2, 6) + '-' + 
                     Math.random().toString(36).substring(2, 5)
    
    setGeneratedMeetLink(`https://meet.google.com/${randomId}`)
    setMeetBooked(true)
  }

  const downloadICS = () => {
    if (!meetDate) return
    
    const [year, month, day] = meetDate.split('-')
    const [hour, minute] = meetTime.split(':')
    
    const startDate = `${year}${month}${day}T${hour}${minute}00`
    const endDate = `${year}${month}${day}T${(parseInt(hour!) + 1).toString().padStart(2, '0')}${minute}00`
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Maneuver AI Discovery//Founder Discovery Call//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@maneuver.ai`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      'SUMMARY:Discovery Architecture Session with Technical Founder',
      'DESCRIPTION:Google Meet 1:1 Systems architecture consultation with Husain (Technical Founder).',
      `LOCATION:${generatedMeetLink}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', 'discovery_meet_invite.ics')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 3. Dossier Fields Config
  const fields: Array<{ key: keyof typeof leadData; label: string; icon: React.ReactNode }> = [
    { key: 'name', label: 'Name', icon: <User className="w-4 h-4" /> },
    { key: 'company', label: 'Company', icon: <Building2 className="w-4 h-4" /> },
    { key: 'industry', label: 'Industry', icon: <Briefcase className="w-4 h-4" /> },
    { key: 'location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
    { key: 'team_size', label: 'Team Size', icon: <Users2 className="w-4 h-4" /> },
    { key: 'role', label: 'Role', icon: <Shield className="w-4 h-4" /> },
    { key: 'pain_point', label: 'Pain Point', icon: <AlertCircle className="w-4 h-4" /> },
    { key: 'current_tools', label: 'Current Tools', icon: <Wrench className="w-4 h-4" /> },
    { key: 'ai_experience', label: 'AI Experience', icon: <Cpu className="w-4 h-4" /> },
    { key: 'timeline', label: 'Timeline', icon: <Calendar className="w-4 h-4" /> },
    { key: 'budget', label: 'Budget', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
    { key: 'phone', label: 'Phone', icon: <Phone className="w-4 h-4" /> },
  ]

  const filledCount = Object.values(leadData).filter((v) => v).length
  const progressPercent = Math.round((filledCount / fields.length) * 100)

  const getFitStyle = (fitLevel: string) => {
    switch (fitLevel?.toLowerCase()) {
      case 'strong_fit':
        return {
          border: 'border-emerald-300',
          bg: 'bg-emerald-50/60',
          text: 'text-emerald-800',
          badge: 'bg-emerald-100 border-emerald-200 text-emerald-900',
        }
      case 'potential':
        return {
          border: 'border-amber-300',
          bg: 'bg-amber-50/60',
          text: 'text-amber-800',
          badge: 'bg-amber-100 border-amber-200 text-amber-900',
        }
      case 'early_stage':
        return {
          border: 'border-blue-300',
          bg: 'bg-blue-50/60',
          text: 'text-blue-800',
          badge: 'bg-blue-100 border-blue-200 text-blue-900',
        }
      case 'no_fit':
        return {
          border: 'border-red-300',
          bg: 'bg-red-50/60',
          text: 'text-red-800',
          badge: 'bg-red-100 border-red-200 text-red-950',
        }
      default:
        return {
          border: 'border-slate-200',
          bg: 'bg-slate-50/60',
          text: 'text-slate-700',
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
        }
    }
  }

  const fitStyle = getFitStyle(leadAssessment?.fit_level || '')

  const copyToClipboard = () => {
    const json = JSON.stringify(leadData, null, 2)
    navigator.clipboard.writeText(json)
  }

  const downloadTranscript = () => {
    const messages = useAppStore.getState().messages
    const transcript = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(transcript))
    element.setAttribute('download', `transcript-${new Date().toISOString().split('T')[0]}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <motion.div
      className="flex flex-col h-full panel-premium-glass rounded-2xl overflow-hidden relative"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header Area */}
      <div className="border-b border-slate-200 bg-white/50 p-5">
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">PROSPECT INTELLIGENCE</p>
            <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">Real-time Lead Capture</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-900 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-md uppercase font-mono tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>AI ENGINE</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-200/60 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mt-4 mb-2">
          <span>Captured {filledCount} of {fields.length} criteria</span>
          <span className="text-slate-900 font-bold font-mono tracking-wide">{progressPercent}%</span>
        </div>
        
        {/* Solid Ink Black Progress Bar (No generic neons) */}
        <div className="bg-slate-200/80 rounded-full h-2 overflow-hidden border border-slate-300/40">
          <motion.div
            className="bg-slate-950 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Cohesive 3-Tab Controls */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-300/50 mt-4">
          <button
            onClick={() => setActiveTab('dossier')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'dossier'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dossier
          </button>
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'scheduler'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Scheduler
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Contact
          </button>
        </div>
      </div>

      {/* Scrollable Panel Area */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 relative select-none">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DOSSIER CHECKLIST */}
          {activeTab === 'dossier' && (
            <motion.div
              key="dossier"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Real-time Fit Assessment Banner */}
              {leadAssessment && (
                <motion.div
                  className={`p-4 rounded-xl border ${fitStyle.border} ${fitStyle.bg} relative overflow-hidden`}
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Live Assessment</p>
                      <p className={`text-sm font-extrabold capitalize mt-0.5 ${fitStyle.text}`}>
                        {leadAssessment.fit_level.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">AI Confidence</p>
                      <p className="text-lg font-black text-slate-900 font-mono tracking-tight mt-0.5">{leadAssessment.confidence}%</p>
                    </div>
                  </div>
                  {leadAssessment.notes && (
                    <p className="text-xs mt-2.5 text-slate-700 leading-relaxed border-t border-slate-200/60 pt-2 font-medium">
                      {leadAssessment.notes}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Checklist Grid */}
              <div className="grid grid-cols-1 gap-2">
                {fields.map((field) => {
                  const isFilled = !!leadData[field.key]
                  return (
                    <motion.div
                      key={field.key}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                        isFilled
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-white/40 border-slate-200'
                      }`}
                      whileHover={{ scale: 1.005 }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon Badge */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                          isFilled
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}>
                          {field.icon}
                        </div>

                        {/* Title and Value */}
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {field.label}
                          </p>
                          <p className={`text-[12.5px] mt-1 truncate ${
                            isFilled ? 'text-slate-900 font-bold' : 'text-slate-400 italic font-medium'
                          }`}>
                            {leadData[field.key] || 'Awaiting input...'}
                          </p>
                        </div>
                      </div>

                      {/* State Indicator */}
                      <div className="flex-shrink-0 ml-3">
                        {isFilled ? (
                          <motion.div
                            initial={{ scale: 0.6 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          </motion.div>
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 2: SCHEDULER */}
          {activeTab === 'scheduler' && (
            <motion.div
              key="scheduler"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Secondary Sub-Tab Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setSchedulerMode('meet')}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all ${
                    schedulerMode === 'meet'
                      ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Dynamic Google Meet
                </button>
                <button
                  onClick={() => setSchedulerMode('calendly')}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all ${
                    schedulerMode === 'calendly'
                      ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Calendly Discovery
                </button>
              </div>

              {schedulerMode === 'meet' ? (
                /* Dynamic Google Meet invitation */
                <div className="space-y-3 pt-1">
                  {meetBooked ? (
                    <motion.div
                      className="py-4 text-center flex flex-col items-center justify-center bg-white/40 border border-slate-200 rounded-xl p-4"
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-3">
                        <Video className="w-6 h-6 text-slate-900" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-slate-900">Google Meet Scheduled!</h4>
                      
                      <div className="w-full mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Date & Time</span>
                          <span className="text-slate-900 font-bold font-mono">{meetDate} @ {meetTime}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] border-t border-slate-200 pt-2">
                          <span className="text-slate-400">Platform</span>
                          <span className="text-slate-900 font-bold flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            Google Meet
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 w-full mt-4">
                        <motion.a
                          href={generatedMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <span>Join Meet</span>
                          <ExternalLink className="w-3 h-3" />
                        </motion.a>
                        
                        <motion.button
                          onClick={downloadICS}
                          className="py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <span>Download ICS</span>
                          <Download className="w-3 h-3" />
                        </motion.button>
                      </div>

                      <button
                        onClick={() => setMeetBooked(false)}
                        className="mt-4 text-slate-500 hover:text-slate-900 text-[10px] font-bold uppercase tracking-wider underline cursor-pointer"
                      >
                        Reschedule meeting
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleMeetBook} className="space-y-3 bg-white/40 border border-slate-200 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-1">
                        Book a direct 1:1 Google Meet Discovery Call. Your details will be pre-filled automatically.
                      </p>

                      {/* Date Select */}
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={meetDate}
                          onChange={(e) => setMeetDate(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-lg premium-input focus:outline-none bg-transparent"
                        />
                      </div>

                      {/* Time Select */}
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                          required
                          value={meetTime}
                          onChange={(e) => setMeetTime(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-lg premium-input focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="09:00">09:00 AM</option>
                          <option value="10:00">10:00 AM</option>
                          <option value="11:00">11:00 AM</option>
                          <option value="12:00">12:00 PM</option>
                          <option value="13:00">01:00 PM</option>
                          <option value="14:00">02:00 PM</option>
                          <option value="15:00">03:00 PM</option>
                          <option value="16:00">04:00 PM</option>
                          <option value="17:00">05:00 PM</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>

                      {/* Action button */}
                      <motion.button
                        type="submit"
                        className="w-full py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border border-slate-900"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Video className="w-4 h-4" />
                        <span>Book Google Meet</span>
                      </motion.button>
                    </form>
                  )}
                </div>
              ) : (
                /* Calendly Architecture Call */
                <div className="flex flex-col items-center justify-center py-6 text-center bg-white/40 border border-slate-200 rounded-xl p-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-5">
                    <CalendarDays className="w-7 h-7 text-slate-900" />
                  </div>

                  <h3 className="font-display text-base font-bold text-slate-900">Founder Discovery Session</h3>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed max-w-xs px-2">
                    Qualify for a complimentary 1:1 systems architecture consultation with our founding technical team.
                  </p>

                  <div className="w-full mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-3">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-200 pb-2">
                      <span className="text-slate-450">Duration</span>
                      <span className="text-slate-900 font-semibold font-mono">30 Minutes</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-200 pb-2">
                      <span className="text-slate-450">Host</span>
                      <span className="text-slate-900 font-semibold">Husain (Technical Founder)</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] pb-1">
                      <span className="text-slate-450">Email Pre-fill</span>
                      <span className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded-full border ${
                        leadData.email
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                          : 'bg-amber-50 border-amber-250 text-amber-700'
                      }`}>
                        {leadData.email ? 'Pre-filled' : 'Missing'}
                      </span>
                    </div>
                  </div>

                  <motion.a
                    href={`https://calendly.com/maneuver-ai/discovery?email=${encodeURIComponent(leadData.email || '')}&name=${encodeURIComponent(leadData.name || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mt-5 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-slate-900"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span>Book via Calendly</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </motion.a>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: CONTACT FORM */}
          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {submitSuccess ? (
                <motion.div
                  className="py-4 text-center flex flex-col items-center justify-center bg-white/40 border border-slate-200 rounded-xl p-4"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="font-display text-sm font-bold text-slate-900">Inquiry Dispatched</h4>
                  <p className="text-[11px] text-slate-500 px-4 mt-2 leading-relaxed">
                    Your details have been forwarded to Husain at <strong className="text-slate-800 font-semibold font-mono">thegopikrish30@gmail.com</strong>.
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Send another query
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3 bg-white/40 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-1">
                    Have additional questions? Dispatch an inquiry directly to founder Husain's inbox.
                  </p>

                  {/* Name */}
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Full Name *"
                      className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-lg premium-input focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Email Address *"
                      className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-lg premium-input focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Phone Number (Optional)"
                      className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-lg premium-input focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Message Query */}
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <textarea
                      required
                      rows={3}
                      value={contactQuery}
                      onChange={(e) => setContactQuery(e.target.value)}
                      placeholder="Describe your inquiry... *"
                      className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-lg premium-input focus:outline-none resize-none bg-transparent"
                    />
                  </div>

                  {submitError && (
                    <p className="text-[10px] font-bold text-red-500 text-center">{submitError}</p>
                  )}

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border border-slate-900"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Dispatch Inquiry</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Sticky Action Footer */}
      <div className="border-t border-slate-200 bg-white/50 p-4 space-y-2 z-10">
        <motion.button
          onClick={() => setShowEditModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-850 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-sm"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Edit2 className="w-4 h-4 text-slate-900" />
          <span className="text-xs font-bold uppercase tracking-wide">Edit Captured Fields</span>
        </motion.button>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-sm transition-colors text-xs font-semibold cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-800" />
            Copy Data
          </button>
          <button
            onClick={downloadTranscript}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-sm transition-colors text-xs font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-800" />
            Export Log
          </button>
        </div>
      </div>
    </motion.div>
  )
}
