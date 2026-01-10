export const providerTypes = [
  'openai',
  'gemini',
  'anthropic',
  'azure-openai',
  'groq',
  'deepseek',
  'mistral',
  'xai',
  'openai-compatible',
] as const

// 新增配置时允许创建的 Provider 类型（只做收敛，不影响历史数据/既有记录）。
export const creatableProviderTypes = ['openai', 'gemini', 'anthropic'] as const

export type ProviderType = (typeof providerTypes)[number]
export type CreatableProviderType = (typeof creatableProviderTypes)[number]

export type CheckConfigRow = {
  id: string
  name: string | null
  type: ProviderType | null
  model: string | null
  endpoint: string | null
  enabled: boolean | null
  is_maintenance: boolean | null
  request_header: Record<string, string> | null
  metadata: Record<string, unknown> | null
  group_name: string | null
  created_at: string | null
  updated_at: string | null
}
