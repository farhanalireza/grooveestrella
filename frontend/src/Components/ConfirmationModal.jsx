import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onConfirm, onCancel, title, message, confirmText, confirmColor = "red", icon }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="max-w-sm w-full bg-[var(--theme-card)] text-[var(--theme-fg)] rounded-2xl shadow-2xl p-6 border border-[var(--theme-border)]"
          >
            <div className="flex items-center gap-3 mb-4">
              {icon}
              <h3 className="text-lg font-semibold text-[var(--theme-fg)]">{title}</h3>
            </div>
            
            <p className="text-[var(--theme-muted)] text-sm mb-6">{message}</p>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="flex-1 bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] border border-[var(--theme-border)] py-2.5 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className={`flex-1 ${
                  confirmColor === 'red' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-bg)]'
                } py-2.5 rounded-lg font-medium transition-colors duration-200 cursor-pointer`}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;