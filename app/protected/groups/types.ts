export type GroupActionState = {
  ok: boolean
  message?: string
  fieldErrors?: Partial<Record<"group_name" | "website_url", string>>
}

export const initialState: GroupActionState = { ok: false }
