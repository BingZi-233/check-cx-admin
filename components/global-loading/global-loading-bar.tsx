'use client'

import { useEffect, useRef, useState } from 'react'

import { useGlobalLoading } from './use-global-loading'

const SHOW_DELAY_MS = 150
const MIN_VISIBLE_MS = 250

export function GlobalLoadingBar() {
  const isLoading = useGlobalLoading()
  const [visible, setVisible] = useState(false)
  const shownAtRef = useRef<number | null>(null)
  const showTimerRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (showTimerRef.current) window.clearTimeout(showTimerRef.current)
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)

    if (isLoading) {
      if (visible) return
      showTimerRef.current = window.setTimeout(() => {
        shownAtRef.current = Date.now()
        setVisible(true)
      }, SHOW_DELAY_MS)
      return
    }

    if (!visible) return

    const shownAt = shownAtRef.current ?? Date.now()
    const elapsed = Date.now() - shownAt
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)
    hideTimerRef.current = window.setTimeout(() => {
      shownAtRef.current = null
      setVisible(false)
    }, remaining)
  }, [isLoading, visible])

  useEffect(() => {
    return () => {
      if (showTimerRef.current) window.clearTimeout(showTimerRef.current)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="global-loading-bar"
      data-visible={visible ? 'true' : 'false'}
    >
      <div className="global-loading-bar__inner" />
    </div>
  )
}
