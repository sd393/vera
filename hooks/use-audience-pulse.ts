"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { buildAuthHeaders } from "@/lib/api-utils"
import { isValidFaceEmotion, type FaceEmotion } from "@/components/audience-face"
import type { Message } from "@/hooks/use-message-context"

export interface PulseLabel {
  text: string
  emotion: FaceEmotion
}

interface UseAudiencePulseOptions {
  messagesRef: React.MutableRefObject<Message[]>
  appendPulseLabels: (labels: PulseLabel[]) => void
}

export function useAudiencePulse({ messagesRef, appendPulseLabels }: UseAudiencePulseOptions) {
  const [pulseLabels, setPulseLabels] = useState<PulseLabel[]>([])
  const [pulseIndex, setPulseIndex] = useState(0)
  // Stable ref so fetchPulseLabels doesn't need appendPulseLabels as a dep
  const appendRef = useRef(appendPulseLabels)
  appendRef.current = appendPulseLabels

  // Cycle through labels every 4 seconds
  useEffect(() => {
    if (pulseLabels.length <= 1) return
    const t = setInterval(() => setPulseIndex(i => (i + 1) % pulseLabels.length), 4000)
    return () => clearInterval(t)
  }, [pulseLabels])

  const fetchPulseLabels = useCallback((overrideMessages?: { role: string; content: string }[]) => {
    const recent = overrideMessages ?? messagesRef.current
      .filter(m => m.content?.trim())
      .slice(-4)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
    if (recent.length === 0) return

    fetch("/api/audience-pulse", {
      method: "POST",
      headers: buildAuthHeaders(),
      body: JSON.stringify({ messages: recent }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`Pulse API ${r.status}`)
        return r.json()
      })
      .then(({ labels }: { labels: unknown[] }) => {
        if (!Array.isArray(labels)) return
        const validLabels = labels
          .map((l: unknown) => {
            if (l && typeof l === "object" && "text" in l) {
              const obj = l as { text: unknown; emotion?: unknown }
              const text = typeof obj.text === "string" ? obj.text : ""
              const emotion: FaceEmotion = isValidFaceEmotion(obj.emotion) ? obj.emotion : "neutral"
              return text ? { text, emotion } : null
            }
            if (typeof l === "string") return { text: l, emotion: "neutral" as FaceEmotion }
            return null
          })
          .filter((l): l is PulseLabel => l !== null)
        if (validLabels.length > 0) {
          setPulseLabels(validLabels)
          setPulseIndex(0)
          appendRef.current(validLabels)
        }
      })
      .catch(err => { console.warn("[audience-pulse] failed:", err) })
  }, [messagesRef])

  return {
    pulseLabels,
    pulseIndex,
    currentPulse: pulseLabels[pulseIndex] ?? null,
    fetchPulseLabels,
  }
}
