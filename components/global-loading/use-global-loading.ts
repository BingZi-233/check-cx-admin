'use client'

import { useSyncExternalStore } from 'react'

import { getInflightCount, subscribe } from './loading-store'

export function useGlobalLoading() {
  const inflight = useSyncExternalStore(subscribe, getInflightCount, () => 0)
  return inflight > 0
}
