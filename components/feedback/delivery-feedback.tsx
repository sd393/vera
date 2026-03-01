"use client"

import { Gauge, MessageCircle, Volume2, Timer, Music, PenLine } from "lucide-react"
import { motion } from "framer-motion"
import type { DeliveryObservation } from "@/lib/sessions"

const CATEGORY_META: Record<DeliveryObservation["category"], { icon: typeof Gauge; label: string }> = {
  pace:     { icon: Gauge,         label: "Pace" },
  fillers:  { icon: MessageCircle, label: "Fillers" },
  volume:   { icon: Volume2,       label: "Volume" },
  pauses:   { icon: Timer,         label: "Pauses" },
  pitch:    { icon: Music,         label: "Pitch" },
  phrasing: { icon: PenLine,       label: "Phrasing" },
}

const SEVERITY_STYLES: Record<DeliveryObservation["severity"], { border: string; bg: string; icon: string }> = {
  positive: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/[0.04]",
    icon: "text-emerald-500/70",
  },
  neutral: {
    border: "border-sky-500/20",
    bg: "bg-sky-500/[0.04]",
    icon: "text-sky-500/70",
  },
  concern: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/[0.04]",
    icon: "text-amber-500/70",
  },
}

interface DeliveryFeedbackProps {
  observations: DeliveryObservation[]
}

export function DeliveryFeedback({ observations }: DeliveryFeedbackProps) {
  if (observations.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Speech &amp; Delivery
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {observations.map((obs, i) => {
          const meta = CATEGORY_META[obs.category]
          const severity = SEVERITY_STYLES[obs.severity]
          const Icon = meta.icon

          return (
            <div
              key={i}
              className={`rounded-xl border ${severity.border} ${severity.bg} px-4 py-3`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-3.5 w-3.5 ${severity.icon}`} />
                <span className="text-xs font-medium text-foreground/70">{meta.label}</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/70">{obs.observation}</p>
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}
