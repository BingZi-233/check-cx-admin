'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react'

import type { CheckConfigRow } from '@/lib/check-configs/types'
import { creatableProviderTypes, providerTypes } from '@/lib/check-configs/types'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

import {
  copyCheckConfigAction,
  createCheckConfigAction,
  deleteCheckConfigAction,
  setEnabledAction,
  setMaintenanceAction,
  updateCheckConfigAction,
} from './actions'

type Props = {
  initialRows: CheckConfigRow[]
  groups: string[]
  q: string
  group: string
  page: number
  perPage: number
  total: number
}

type ConfigFormState = {
  id?: string
  copyFromId?: string
  name: string
  type: string
  model: string
  endpoint: string
  apiKey: string
  updateApiKey: boolean
  enabled: boolean
  isMaintenance: boolean
  requestHeaderJson: string
  metadataJson: string
  groupName: string
}

function stringifyJson(value: unknown) {
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

function defaultCreateState(): ConfigFormState {
  return {
    name: '',
    type: 'openai',
    model: '',
    endpoint: '',
    apiKey: '',
    updateApiKey: true,
    enabled: true,
    isMaintenance: false,
    requestHeaderJson: '',
    metadataJson: '',
    groupName: '',
  }
}

function defaultEditState(row: CheckConfigRow): ConfigFormState {
  return {
    id: row.id,
    name: row.name ?? '',
    type: row.type ?? 'openai',
    model: row.model ?? '',
    endpoint: row.endpoint ?? '',
    apiKey: '',
    updateApiKey: false,
    enabled: !!row.enabled,
    isMaintenance: !!row.is_maintenance,
    requestHeaderJson: stringifyJson(row.request_header),
    metadataJson: stringifyJson(row.metadata),
    groupName: row.group_name ?? '',
  }
}

function defaultCopyState(row: CheckConfigRow): ConfigFormState {
  const baseName = (row.name ?? '').trim()
  const name = baseName ? `${baseName} - 副本` : ''
  return {
    copyFromId: row.id,
    name,
    type: row.type ?? 'openai',
    model: row.model ?? '',
    endpoint: row.endpoint ?? '',
    apiKey: '',
    updateApiKey: false,
    enabled: !!row.enabled,
    isMaintenance: !!row.is_maintenance,
    requestHeaderJson: stringifyJson(row.request_header),
    metadataJson: stringifyJson(row.metadata),
    groupName: row.group_name ?? '',
  }
}

function buildHref(params: URLSearchParams, patch: Record<string, string | null | undefined>) {
  const next = new URLSearchParams(params)
  for (const [key, value] of Object.entries(patch)) {
    if (!value) next.delete(key)
    else next.set(key, value)
  }
  const qs = next.toString()
  return qs ? `?${qs}` : '?'
}

function StatusBadges({ row }: { row: CheckConfigRow }) {
  const enabled = !!row.enabled
  const maintenance = !!row.is_maintenance
  return (
    <div className="flex items-center gap-2">
      {enabled ? <Badge variant="success">已启用</Badge> : <Badge variant="muted">已禁用</Badge>}
      {maintenance ? <Badge variant="info">维护中</Badge> : null}
    </div>
  )
}

export function ConfigsClient({ initialRows, groups, q, group, page, perPage, total }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  const [search, setSearch] = React.useState(q)
  const [activeGroup, setActiveGroup] = React.useState(group)
  const [error, setError] = React.useState<string | null>(null)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [copyOpen, setCopyOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const [form, setForm] = React.useState<ConfigFormState>(() => defaultCreateState())
  const [deleteTarget, setDeleteTarget] = React.useState<CheckConfigRow | null>(null)

  const [pending, startTransition] = React.useTransition()

  const unknownActiveGroup = React.useMemo(() => {
    const normalized = (activeGroup ?? '').trim()
    if (!normalized) return null
    if (normalized === '__ungrouped__') return null
    return groups.includes(normalized) ? null : normalized
  }, [activeGroup, groups])

  const groupOptionsForForm = React.useMemo(() => {
    const normalized = (form.groupName ?? '').trim()
    if (!normalized) return groups
    if (groups.includes(normalized)) return groups
    return [normalized, ...groups]
  }, [form.groupName, groups])

  React.useEffect(() => {
    setSearch(q)
  }, [q])

  React.useEffect(() => {
    setActiveGroup(group)
  }, [group])

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      const href = buildHref(sp, { q: search.trim() || null, page: '1' })
      router.replace(href, { scroll: false })
    }, 250)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  React.useEffect(() => {
    const href = buildHref(sp, { group: activeGroup || null, page: '1' })
    router.replace(href, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup])

  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const prevPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    const result = await action()
    if (!result.ok) {
      setError(result.error ?? '操作失败')
      return false
    }
    router.refresh()
    return true
  }

  function openCreate() {
    setError(null)
    setForm(defaultCreateState())
    setCreateOpen(true)
  }

  function openEdit(row: CheckConfigRow) {
    setError(null)
    setForm(defaultEditState(row))
    setEditOpen(true)
  }

  function openCopy(row: CheckConfigRow) {
    setError(null)
    setForm(defaultCopyState(row))
    setCopyOpen(true)
  }

  function openDelete(row: CheckConfigRow) {
    setError(null)
    setDeleteTarget(row)
    setDeleteOpen(true)
  }

  const rows = initialRows

  return (
    <div className="space-y-6">
      <Card className="bg-card/70 border-border/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-xl tracking-tight">检测配置管理</CardTitle>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            新增配置
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="q">搜索</Label>
              <Input
                id="q"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="名称 / 类型 / 模型 / 接口地址 / 分组"
              />
            </div>
            <div className="w-full space-y-1 sm:w-64">
              <Label htmlFor="group">分组</Label>
              <NativeSelect id="group" value={activeGroup} onChange={(e) => setActiveGroup(e.target.value)}>
                <option value="">全部</option>
                <option value="__ungrouped__">未分组</option>
                {unknownActiveGroup ? (
                  <option value={unknownActiveGroup}>{unknownActiveGroup}（不在分组管理）</option>
                ) : null}
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          {error ? (
            <div className="text-destructive border-destructive/30 bg-destructive/10 rounded-lg border px-3 py-2 text-sm">
              {error}
            </div>
          ) : null}

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">名称</TableHead>
                  <TableHead className="w-[140px]">提供方</TableHead>
                  <TableHead>模型</TableHead>
                  <TableHead>分组</TableHead>
                  <TableHead className="w-[220px]">状态</TableHead>
                  <TableHead className="w-[170px]">快捷操作</TableHead>
                  <TableHead className="w-[120px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name ?? '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{row.type ?? '-'}</TableCell>
                      <TableCell className="truncate">{row.model ?? '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{row.group_name ?? '未分组'}</TableCell>
                      <TableCell>
                        <StatusBadges row={row} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">启用</span>
                            <Switch
                              checked={!!row.enabled}
                              disabled={pending}
                              onCheckedChange={(next) =>
                                startTransition(() => {
                                  void run(() => setEnabledAction(row.id, next))
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">维护</span>
                            <Switch
                              checked={!!row.is_maintenance}
                              disabled={pending}
                              onCheckedChange={(next) =>
                                startTransition(() => {
                                  void run(() => setMaintenanceAction(row.id, next))
                                })
                              }
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => openCopy(row)}
                            disabled={pending}
                            aria-label="复制"
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => openEdit(row)}
                            disabled={pending}
                            aria-label="编辑"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => openDelete(row)}
                            disabled={pending}
                            aria-label="删除"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="text-muted-foreground py-8 text-center" colSpan={7}>
                      没有匹配的配置
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
            <div className="text-muted-foreground text-sm">
              共 {total} 条，当前第 {page} / {totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <Link
                className={cn(
                  'text-sm',
                  page <= 1 ? 'pointer-events-none opacity-50' : 'hover:underline'
                )}
                href={buildHref(sp, { page: String(prevPage) })}
              >
                上一页
              </Link>
              <Link
                className={cn(
                  'text-sm',
                  page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:underline'
                )}
                href={buildHref(sp, { page: String(nextPage) })}
              >
                下一页
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增配置</DialogTitle>
            <DialogDescription>API 密钥使用密码框输入；JSON 字段留空表示空值。</DialogDescription>
          </DialogHeader>
          <Form
            onSubmit={(e) => {
              e.preventDefault()
              startTransition(async () => {
                const ok = await run(() =>
                  createCheckConfigAction({
                    name: form.name,
                    type: form.type,
                    model: form.model,
                    endpoint: form.endpoint,
                    apiKey: form.apiKey,
                    enabled: form.enabled,
                    isMaintenance: form.isMaintenance,
                    requestHeaderJson: form.requestHeaderJson,
                    metadataJson: form.metadataJson,
                    groupName: form.groupName,
                  })
                )
                if (ok) setCreateOpen(false)
              })
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>名称</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>分组</Label>
                <NativeSelect value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })}>
                  <option value="">未分组</option>
                  {groupOptionsForForm.map((g) => (
                    <option key={g} value={g}>
                      {groups.includes(g) ? g : `${g}（不在分组管理）`}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1">
                <Label>提供方类型</Label>
                <NativeSelect value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {creatableProviderTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1">
                <Label>模型</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>接口地址</Label>
                <Input
                  value={form.endpoint}
                  onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                  placeholder="例如：https://.../v1/..."
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>API 密钥</Label>
                <Input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>请求头（JSON）</Label>
                <Textarea
                  value={form.requestHeaderJson}
                  onChange={(e) => setForm({ ...form, requestHeaderJson: e.target.value })}
                  placeholder='例如：{"User-Agent":"custom"}'
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>元数据（JSON）</Label>
                <Textarea
                  value={form.metadataJson}
                  onChange={(e) => setForm({ ...form, metadataJson: e.target.value })}
                  placeholder='例如：{"temperature":0.5}'
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
                <span className="text-sm">启用</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isMaintenance}
                  onCheckedChange={(v) => setForm({ ...form, isMaintenance: v })}
                />
                <span className="text-sm">维护模式</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={pending}>
                取消
              </Button>
              <Button type="submit" disabled={pending}>
                保存
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑配置</DialogTitle>
            <DialogDescription>
              API 密钥不会回显；如需修改请勾选“更新 API 密钥”并输入新值。
            </DialogDescription>
          </DialogHeader>
          <Form
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.id) return
              startTransition(async () => {
                const ok = await run(() =>
                  updateCheckConfigAction({
                    id: form.id!,
                    name: form.name,
                    type: form.type,
                    model: form.model,
                    endpoint: form.endpoint,
                    updateApiKey: form.updateApiKey,
                    apiKey: form.apiKey,
                    enabled: form.enabled,
                    isMaintenance: form.isMaintenance,
                    requestHeaderJson: form.requestHeaderJson,
                    metadataJson: form.metadataJson,
                    groupName: form.groupName,
                  })
                )
                if (ok) setEditOpen(false)
              })
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>名称</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>分组</Label>
                <NativeSelect value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })}>
                  <option value="">未分组</option>
                  {groupOptionsForForm.map((g) => (
                    <option key={g} value={g}>
                      {groups.includes(g) ? g : `${g}（不在分组管理）`}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1">
                <Label>提供方类型</Label>
                <NativeSelect value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {(providerTypes as readonly string[]).includes(form.type) ? null : (
                    <option key={form.type} value={form.type}>
                      {form.type}（已存在）
                    </option>
                  )}
                  {providerTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1">
                <Label>模型</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>接口地址</Label>
                <Input
                  value={form.endpoint}
                  onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>API 密钥</Label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={form.updateApiKey}
                      onCheckedChange={(v) => setForm({ ...form, updateApiKey: v })}
                    />
                    更新 API 密钥
                  </label>
                </div>
                <Input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder={form.updateApiKey ? '请输入新的 API 密钥' : '••••••••（未更新）'}
                  disabled={!form.updateApiKey}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>请求头（JSON）</Label>
                <Textarea
                  value={form.requestHeaderJson}
                  onChange={(e) => setForm({ ...form, requestHeaderJson: e.target.value })}
                  placeholder='例如：{"User-Agent":"custom"}'
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>元数据（JSON）</Label>
                <Textarea
                  value={form.metadataJson}
                  onChange={(e) => setForm({ ...form, metadataJson: e.target.value })}
                  placeholder='例如：{"temperature":0.5}'
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
                <span className="text-sm">启用</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isMaintenance}
                  onCheckedChange={(v) => setForm({ ...form, isMaintenance: v })}
                />
                <span className="text-sm">维护模式</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={pending}>
                取消
              </Button>
              <Button type="submit" disabled={pending}>
                保存
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Copy */}
      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>复制配置</DialogTitle>
            <DialogDescription>
              点击“保存”后才会创建新配置；默认沿用源配置的 API 密钥（不会回显），如需修改请勾选“更新 API 密钥”。
            </DialogDescription>
          </DialogHeader>
          <Form
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.copyFromId) return
              startTransition(async () => {
                const ok = await run(() =>
                  copyCheckConfigAction({
                    sourceId: form.copyFromId!,
                    name: form.name,
                    type: form.type,
                    model: form.model,
                    endpoint: form.endpoint,
                    updateApiKey: form.updateApiKey,
                    apiKey: form.apiKey,
                    enabled: form.enabled,
                    isMaintenance: form.isMaintenance,
                    requestHeaderJson: form.requestHeaderJson,
                    metadataJson: form.metadataJson,
                    groupName: form.groupName,
                  })
                )
                if (ok) setCopyOpen(false)
              })
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>名称</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>分组</Label>
                <NativeSelect value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })}>
                  <option value="">未分组</option>
                  {groupOptionsForForm.map((g) => (
                    <option key={g} value={g}>
                      {groups.includes(g) ? g : `${g}（不在分组管理）`}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1">
                <Label>提供方类型</Label>
                <NativeSelect value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {providerTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1">
                <Label>模型</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>接口地址</Label>
                <Input value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>API 密钥</Label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={form.updateApiKey}
                      onCheckedChange={(v) => setForm({ ...form, updateApiKey: v })}
                    />
                    更新 API 密钥
                  </label>
                </div>
                <Input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder={form.updateApiKey ? '请输入新的 API 密钥' : '••••••••（沿用源配置）'}
                  disabled={!form.updateApiKey}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>请求头（JSON）</Label>
                <Textarea
                  value={form.requestHeaderJson}
                  onChange={(e) => setForm({ ...form, requestHeaderJson: e.target.value })}
                  placeholder='例如：{"User-Agent":"custom"}'
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>元数据（JSON）</Label>
                <Textarea
                  value={form.metadataJson}
                  onChange={(e) => setForm({ ...form, metadataJson: e.target.value })}
                  placeholder='例如：{"temperature":0.5}'
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
                <span className="text-sm">启用</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isMaintenance}
                  onCheckedChange={(v) => setForm({ ...form, isMaintenance: v })}
                />
                <span className="text-sm">维护模式</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCopyOpen(false)} disabled={pending}>
                取消
              </Button>
              <Button type="submit" disabled={pending}>
                保存
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[min(520px,calc(100vw-2rem))]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              将永久删除配置：<span className="text-foreground font-medium">{deleteTarget?.name ?? '-'}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || !deleteTarget}
              onClick={() => {
                if (!deleteTarget) return
                startTransition(async () => {
                  const ok = await run(() => deleteCheckConfigAction(deleteTarget.id))
                  if (ok) setDeleteOpen(false)
                })
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
