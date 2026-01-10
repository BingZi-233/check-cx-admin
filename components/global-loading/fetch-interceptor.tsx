'use client'

import { useEffect } from 'react'

import { loadingEnd, loadingStart } from './loading-store'

const PATCH_FLAG = '__checkCxAdminFetchPatched'

function shouldTrack(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof window === 'undefined') return false

  const rawUrl =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input instanceof Request
          ? input.url
          : String(input)

  let url: URL
  try {
    url = new URL(rawUrl, window.location.href)
  } catch {
    return false
  }

  if (url.searchParams.has('_rsc')) return false
  if (url.pathname.startsWith('/_next/')) return false

  const headers = new Headers(
    (init?.headers as HeadersInit | undefined) ||
      (input instanceof Request ? input.headers : undefined)
  )
  const purpose = headers.get('purpose') ?? headers.get('sec-purpose')
  if (purpose === 'prefetch') return false

  const sameOrigin = url.origin === window.location.origin
  if (sameOrigin && !url.pathname.startsWith('/api/')) return false

  return true
}

export function FetchInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const globalAny = globalThis as unknown as Record<string, unknown>
    if (globalAny[PATCH_FLAG]) return
    globalAny[PATCH_FLAG] = true

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const track = shouldTrack(input, init)
      if (track) loadingStart()
      try {
        return await originalFetch(input, init)
      } finally {
        if (track) loadingEnd()
      }
    }
  }, [])

  return null
}
