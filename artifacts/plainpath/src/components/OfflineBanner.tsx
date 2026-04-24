import { motion, AnimatePresence } from "framer-motion"
import { WifiOff } from "lucide-react"
import { useOnline } from "@/hooks/useOnline"

export function OfflineBanner() {
  const online = useOnline()

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed top-16 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
        >
          <div className="flex items-center gap-2 bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg shadow-amber-500/30 mt-2">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            You're offline — document processing is unavailable
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
