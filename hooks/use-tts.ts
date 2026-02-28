"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { buildAuthHeaders } from "@/lib/api-utils"

interface TTSSentence {
  text: string
  start: number
  end: number
}

interface UseTTSOptions {
  onSpeakEnd?: () => void
}

export function useTTS({ onSpeakEnd }: UseTTSOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [caption, setCaption] = useState("")

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sentencesRef = useRef<TTSSentence[]>([])
  const abortRef = useRef<AbortController | null>(null)
  // Use a ref so onSpeakEnd is always current without re-creating `speak`
  const onSpeakEndRef = useRef(onSpeakEnd)
  onSpeakEndRef.current = onSpeakEnd

  useEffect(() => {
    return () => { audioRef.current?.pause(); audioRef.current = null }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsLoading(false)
    setIsSpeaking(false)
    setCaption("")
    sentencesRef.current = []
  }, [])

  const speak = useCallback((text: string) => {
    stop()
    setIsLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    fetch("/api/tts", {
      method: "POST",
      headers: buildAuthHeaders(),
      body: JSON.stringify({ text }),
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(`TTS failed: ${res.status}`)
        return res.json()
      })
      .then(({ audio, sentences }: { audio: string; sentences: TTSSentence[] }) => {
        if (controller.signal.aborted) return

        sentencesRef.current = sentences
        if (sentences.length > 0) setCaption(sentences[0].text)

        const bytes = Uint8Array.from(atob(audio), c => c.charCodeAt(0))
        const blob = new Blob([bytes], { type: "audio/mpeg" })
        const url = URL.createObjectURL(blob)
        const audioEl = new Audio(url)
        audioRef.current = audioEl

        audioEl.onplaying = () => { setIsLoading(false); setIsSpeaking(true) }
        audioEl.ontimeupdate = () => {
          const t = audioEl.currentTime + 0.3
          const hit = sentencesRef.current.find(s => t >= s.start && t < s.end)
          if (hit) setCaption(hit.text)
        }
        audioEl.onended = () => {
          URL.revokeObjectURL(url)
          setIsSpeaking(false)
          setCaption("")
          audioRef.current = null
          onSpeakEndRef.current?.()
        }
        audioEl.onerror = () => {
          URL.revokeObjectURL(url)
          setIsLoading(false)
          setIsSpeaking(false)
          setCaption("")
          audioRef.current = null
        }

        audioEl.play().catch(() => {
          setIsLoading(false)
          setIsSpeaking(false)
          setCaption("")
          URL.revokeObjectURL(url)
          audioRef.current = null
          toast.error("Browser blocked audio playback. Tap anywhere and try again.")
        })
      })
      .catch(err => {
        if (err instanceof Error && err.name === "AbortError") return
        setIsLoading(false)
        setCaption("")
        toast.error("Vera's voice is unavailable right now.")
      })
  }, [stop])

  return { isLoading, isSpeaking, caption, speak, stop }
}
