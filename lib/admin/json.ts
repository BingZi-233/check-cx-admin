import { JsonValue } from "@/lib/admin/types"

export function parseOptionalJson(
  raw: FormDataEntryValue | null,
  fieldName: string
): JsonValue | null {
  const value = raw?.toString().trim()

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as JsonValue
  } catch {
    throw new Error(`${fieldName} 不是合法 JSON`)
  }
}

export function stringifyJson(value: JsonValue | null | undefined) {
  if (value == null) {
    return ""
  }

  return JSON.stringify(value, null, 2)
}
