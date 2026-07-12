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
            className="max-w-md w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Privacy Notice</h3>
            </div>

            <div className="space-y-3 text-sm text-gray-300 mb-6">
              <p>
                This app stores your <strong className="text-white">saved music, playlists, artists and albums</strong> and{" "}
                <strong className="text-white">preferences</strong> locally in your browser.
              </p>
              <p>• Data stays on your device only</p>
              <p>• Nothing is sent to external servers</p>
              <p>• Clear data anytime in settings</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAcknowledge}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-200"
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
