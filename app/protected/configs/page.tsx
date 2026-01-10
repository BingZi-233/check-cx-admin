import { redirect } from 'next/navigation'

import type { CheckConfigRow } from '@/lib/check-configs/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

import { ConfigsClient } from './configs-client'

export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string | string[]
  group?: string | string[]
  page?: string | string[]
}

function first(value: string | string[] | undefined) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function sanitizeOrQueryValue(input: string) {
  return input.replaceAll('%', '').replaceAll(',', ' ').replaceAll('(', ' ').replaceAll(')', ' ')
}

export default async function ConfigsPage(props: { searchParams?: SearchParams | Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect('/auth/login')

  const searchParams = await Promise.resolve(props.searchParams ?? {})
  const q = (first(searchParams.q) ?? '').trim()
  const group = (first(searchParams.group) ?? '').trim()
  const page = Math.max(1, Number((first(searchParams.page) ?? '1').trim()) || 1)
  const perPage = 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const admin = createAdminClient()

  let query = admin
    .from('check_configs')
    .select(
      'id,name,type,model,endpoint,enabled,is_maintenance,request_header,metadata,group_name,created_at,updated_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (group === '__ungrouped__') {
    query = query.is('group_name', null)
  } else if (group) {
    query = query.eq('group_name', group)
  }

  if (q) {
    const safe = sanitizeOrQueryValue(q)
    query = query.or(
      [
        `name.ilike.%${safe}%`,
        `type.ilike.%${safe}%`,
        `model.ilike.%${safe}%`,
        `endpoint.ilike.%${safe}%`,
        `group_name.ilike.%${safe}%`,
      ].join(',')
    )
  }

  const { data: rows, error: listError, count } = await query.range(from, to)
  if (listError) {
    throw new Error(listError.message)
  }

  const { data: groupRows, error: groupError } = await admin
    .from('group_info')
    .select('group_name')
    .order('group_name', { ascending: true })
  if (groupError) {
    throw new Error(groupError.message)
  }

  const groups = Array.from(
    new Set((groupRows ?? []).map((r) => r.group_name).filter((g): g is string => !!g?.trim()))
  ).sort((a, b) => a.localeCompare(b))

  return (
    <div className="flex flex-col gap-6">
      <ConfigsClient
        initialRows={(rows ?? []) as unknown as CheckConfigRow[]}
        groups={groups}
        q={q}
        group={group}
        page={page}
        perPage={perPage}
        total={count ?? 0}
      />
    </div>
  )
}
