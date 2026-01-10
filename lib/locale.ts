const ZH_CN = 'zh-CN'

function hasChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(text)
}

export function formatNumberZh(value: number | null | undefined) {
  return typeof value === 'number' ? value.toLocaleString(ZH_CN) : '—'
}

export function formatLocalDateTimeZh(iso: string | null | undefined) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(ZH_CN, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function normalizeUiErrorMessage(input: unknown, fallback = '操作失败') {
  const message =
    typeof input === 'string'
      ? input
      : input instanceof Error
        ? input.message
        : ''

  const trimmed = message.trim()
  if (!trimmed) return fallback
  if (hasChinese(trimmed)) return trimmed

  const lower = trimmed.toLowerCase()
  if (lower.includes('unauthorized') || lower.includes('not authorized')) return '未登录或无权限'
  if (lower.includes('permission')) return '权限不足'
  if (lower.includes('duplicate') || lower.includes('unique')) return '数据已存在'
  if (lower.includes('jwt') && lower.includes('expired')) return '登录已过期，请重新登录'

  return fallback
}

