type Listener = () => void

let inflightCount = 0
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener()
}

export function loadingStart() {
  inflightCount += 1
  emit()
}

export function loadingEnd() {
  inflightCount = Math.max(0, inflightCount - 1)
  emit()
}

export function getInflightCount() {
  return inflightCount
}

export function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
