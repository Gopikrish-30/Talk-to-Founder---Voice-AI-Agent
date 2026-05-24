import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, RotateCcw } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

export const EditLeadModal: React.FC = () => {
  const showEditModal = useAppStore((state) => state.showEditModal)
  const setShowEditModal = useAppStore((state) => state.setShowEditModal)
  const leadData = useAppStore((state) => state.leadData)
  const updateLeadField = useAppStore((state) => state.updateLeadField)
  const [editedData, setEditedData] = useState(leadData)

  // Keep state synced when modal is opened with fresh data
  useEffect(() => {
    if (showEditModal) {
      setEditedData(leadData)
    }
  }, [showEditModal, leadData])

  const fields: Array<{ key: keyof typeof leadData; label: string; placeholder: string }> = [
    { key: 'name', label: 'Name', placeholder: 'e.g., John Smith' },
    { key: 'company', label: 'Company', placeholder: 'e.g., Acme Inc' },
    { key: 'industry', label: 'Industry', placeholder: 'e.g., Technology, Finance' },
    { key: 'location', label: 'Location', placeholder: 'e.g., San Francisco, CA' },
    { key: 'team_size', label: 'Team Size', placeholder: 'e.g., 50-100 employees' },
    { key: 'role', label: 'Role', placeholder: 'e.g., Head of Operations' },
    { key: 'pain_point', label: 'Pain Point', placeholder: 'e.g., Manual data entry' },
    { key: 'current_tools', label: 'Current Tools', placeholder: 'e.g., Salesforce, HubSpot' },
    { key: 'ai_experience', label: 'AI Experience', placeholder: 'e.g., Beginner, Experienced' },
    { key: 'timeline', label: 'Timeline', placeholder: 'e.g., Next 3 months' },
    { key: 'budget', label: 'Budget', placeholder: 'e.g., $50k-$100k per year' },
    { key: 'email', label: 'Email', placeholder: 'e.g., john@acme.com' },
    { key: 'phone', label: 'Phone', placeholder: 'e.g., (555) 123-4567' },
  ]

  const handleInputChange = (field: keyof typeof leadData, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = () => {
    fields.forEach((field) => {
      if (editedData[field.key] !== leadData[field.key]) {
        updateLeadField(field.key, editedData[field.key] || '')
      }
    })
    setShowEditModal(false)
  }

  const handleReset = () => {
    setEditedData(leadData)
  }

  return (
    <AnimatePresence>
      {showEditModal && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-0 select-none"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.div
              className="panel-premium shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col relative border border-slate-250"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-6 flex-shrink-0 relative">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Lead Registry Editor</p>
                  <h2 className="font-display text-xl font-extrabold text-slate-900 mt-1">Edit Captured Intel</h2>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">Review and refine automated extraction metrics</p>
                </div>
                <motion.button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-slate-200/60 border border-slate-200 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-slate-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0 relative bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields.map((field, idx) => (
                    <motion.div
                      key={field.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                      className="flex flex-col"
                    >
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={editedData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-slate-900 text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none transition-all duration-200 text-xs font-semibold shadow-inner"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-slate-200 bg-slate-50 p-6 flex-shrink-0 flex gap-3 justify-end items-center">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-900" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                
                <motion.button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Save className="w-4 h-4 text-white" />
                  <span>Save Data</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
