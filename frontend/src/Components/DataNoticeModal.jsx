import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";

const DataNoticeModal = ({ isOpen: externalOpen = false, onClose }) => {
    const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(() =>
    localStorage.getItem("dataNoticeAcknowledged") === "true"
  );
  const [internalOpen, setInternalOpen] = useState(!acknowledged || externalOpen);

  useEffect(() => {
    setInternalOpen(!acknowledged || externalOpen);
  }, [acknowledged, externalOpen]);

  const handleAcknowledge = () => {
    localStorage.setItem("dataNoticeAcknowledged", "true");
    setAcknowledged(true);
    setInternalOpen(false);
    onClose && onClose();
  };

  return (
    <AnimatePresence>
      {internalOpen && (
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
            className="max-w-md w-full bg-[var(--theme-card)] text-[var(--theme-fg)] rounded-2xl shadow-2xl p-6 border border-[var(--theme-border)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-[var(--theme-accent)]" />
              <h3 className="text-xl font-semibold text-[var(--theme-fg)]">Privacy Notice</h3>
            </div>

            <div className="space-y-3 text-sm text-[var(--theme-muted)] mb-6">
              <p>
                This app stores your <strong className="text-[var(--theme-fg)]">saved music, playlists, artists and albums</strong> and{" "}
                <strong className="text-[var(--theme-fg)]">preferences</strong> locally in your browser.
              </p>
              <p>• Data stays on your device only</p>
              <p>• Nothing is sent to external servers</p>
              <p>• Clear data anytime in settings</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAcknowledge}
              className="w-full bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] py-3 rounded-xl font-bold transition-all duration-200 cursor-pointer shadow-md"
            >
              Understood
            </motion.button>
            {/* <p className="text-white py-2 text-sm">By clicking the <strong>Understood</strong> button, you agree to our app's <span className="underline cursor-pointer" onClick={() => router.push("/terms")}>Terms and Condidtions</span> & <span className="underline cursor-pointer" onClick={() => router.push("/privacy")}>Privacy Policy</span></p> */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DataNoticeModal;
