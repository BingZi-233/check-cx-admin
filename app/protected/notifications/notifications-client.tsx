'use client'

import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormItem } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { NotificationLevel, SystemNotification } from './page'

const levelToBadgeVariant: Record<NotificationLevel, 'info' | 'warning' | 'error'> = {
  info: 'info',
  warning: 'warning',
  error: 'error',
}

function formatLocalDateTime(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

function toIsoOrNull(value: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

type EditorDraft = {
  message: string
  level: NotificationLevel
  is_active: boolean
  start_time: string
  end_time: string
}

function emptyDraft(): EditorDraft {
  return {
    message: '',
    level: 'info',
    is_active: false,
    start_time: '',
    end_time: '',
  }
}

function draftFromNotification(n: SystemNotification): EditorDraft {
  return {
    message: n.message ?? '',
    level: n.level,
    is_active: n.is_active,
    start_time: toDatetimeLocalValue(n.start_time),
    end_time: toDatetimeLocalValue(n.end_time),
  }
}

export function NotificationsClient({
  initialNotifications,
  initialError,
}: {
  initialNotifications: SystemNotification[]
  initialError: string | null
}) {
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialNotifications)
  const [pageError, setPageError] = useState<string | null>(initialError)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const [editing, setEditing] = useState<SystemNotification | null>(null)
  const [deleting, setDeleting] = useState<SystemNotification | null>(null)

  const [draft, setDraft] = useState<EditorDraft>(emptyDraft())

  const previewText = useMemo(() => {
    if (!draft.message.trim()) return '（空）'
    return draft.message
  }, [draft.message])

  const openCreate = () => {
    setDialogError(null)
    setDraft(emptyDraft())
    setCreateOpen(true)
  }

  const openEdit = (n: SystemNotification) => {
    setDialogError(null)
    setEditing(n)
    setDraft(draftFromNotification(n))
    setEditOpen(true)
  }

  const openDelete = (n: SystemNotification) => {
    setDialogError(null)
    setDeleting(n)
    setDeleteOpen(true)
  }

  const closeAllDialogs = () => {
    setCreateOpen(false)
    setEditOpen(false)
    setDeleteOpen(false)
    setEditing(null)
    setDeleting(null)
    setDialogError(null)
  }

  const createNotification = async () => {
    setBusy(true)
    setDialogError(null)
    setPageError(null)
    try {
      if (!draft.message.trim()) {
        setDialogError('通知内容不能为空。')
        return
      }

      const supabase = createClient()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('system_notifications')
        .insert({
          message: draft.message,
          level: draft.level,
          is_active: draft.is_active,
          start_time: toIsoOrNull(draft.start_time),
          end_time: toIsoOrNull(draft.end_time),
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single()

      if (error) throw error

      setNotifications((prev) => [data as SystemNotification, ...prev])
      setCreateOpen(false)
    } catch (e: unknown) {
      setDialogError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setBusy(false)
    }
  }

  const updateNotification = async () => {
    if (!editing) return
    setBusy(true)
    setDialogError(null)
    setPageError(null)
    try {
      if (!draft.message.trim()) {
        setDialogError('通知内容不能为空。')
        return
      }

      const supabase = createClient()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('system_notifications')
        .update({
          message: draft.message,
          level: draft.level,
          is_active: draft.is_active,
          start_time: toIsoOrNull(draft.start_time),
          end_time: toIsoOrNull(draft.end_time),
          updated_at: now,
        })
        .eq('id', editing.id)
        .select('*')
        .single()

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) => (n.id === editing.id ? (data as SystemNotification) : n))
      )
      closeAllDialogs()
    } catch (e: unknown) {
      setDialogError(e instanceof Error ? e.message : '更新失败')
    } finally {
      setBusy(false)
    }
  }

  const deleteNotification = async () => {
    if (!deleting) return
    setBusy(true)
    setDialogError(null)
    setPageError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('system_notifications')
        .delete()
        .eq('id', deleting.id)

      if (error) throw error

      setNotifications((prev) => prev.filter((n) => n.id !== deleting.id))
      closeAllDialogs()
    } catch (e: unknown) {
      setDialogError(e instanceof Error ? e.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (n: SystemNotification) => {
    setBusy(true)
    setDialogError(null)
    setPageError(null)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('system_notifications')
        .update({ is_active: !n.is_active, updated_at: now })
        .eq('id', n.id)
        .select('*')
        .single()

      if (error) throw error

      setNotifications((prev) =>
        prev.map((row) => (row.id === n.id ? (data as SystemNotification) : row))
      )
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>系统通知</CardTitle>
            <CardDescription>管理 check-cx 首页通知横幅（支持 Markdown）。</CardDescription>
          </div>
          <Button onClick={openCreate} disabled={busy}>
            <Plus className="size-4" />
            新增通知
          </Button>
        </div>
        {pageError ? <p className="text-sm text-destructive">{pageError}</p> : null}
      </CardHeader>

      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">级别</TableHead>
              <TableHead>内容</TableHead>
              <TableHead className="w-[110px]">状态</TableHead>
              <TableHead className="w-[180px]">开始</TableHead>
              <TableHead className="w-[180px]">结束</TableHead>
              <TableHead className="w-[180px]">创建时间</TableHead>
              <TableHead className="w-[170px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                  暂无通知
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>
                    <Badge variant={levelToBadgeVariant[n.level]}>{n.level}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[520px]">
                    <div className="truncate">{n.message}</div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={n.is_active ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => toggleActive(n)}
                      disabled={busy}
                    >
                      {n.is_active ? '已激活' : '未激活'}
                    </Button>
                  </TableCell>
                  <TableCell>{formatLocalDateTime(n.start_time)}</TableCell>
                  <TableCell>{formatLocalDateTime(n.end_time)}</TableCell>
                  <TableCell>{formatLocalDateTime(n.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => openEdit(n)}
                        disabled={busy}
                        aria-label="编辑"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => openDelete(n)}
                        disabled={busy}
                        aria-label="删除"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={createOpen} onOpenChange={(open) => (open ? setCreateOpen(true) : closeAllDialogs())}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>新增通知</DialogTitle>
            <DialogDescription>填写内容并选择级别，可预览 Markdown。</DialogDescription>
          </DialogHeader>

          <EditorForm
            draft={draft}
            setDraft={setDraft}
            previewText={previewText}
            error={dialogError}
            busy={busy}
            onCancel={closeAllDialogs}
            onSubmit={createNotification}
            submitText="创建"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => (open ? setEditOpen(true) : closeAllDialogs())}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>编辑通知</DialogTitle>
            <DialogDescription>修改内容、级别和时间窗口。</DialogDescription>
          </DialogHeader>

          <EditorForm
            draft={draft}
            setDraft={setDraft}
            previewText={previewText}
            error={dialogError}
            busy={busy}
            onCancel={closeAllDialogs}
            onSubmit={updateNotification}
            submitText="保存"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(open) => (open ? setDeleteOpen(true) : closeAllDialogs())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>这会永久删除该通知，无法恢复。</DialogDescription>
          </DialogHeader>
          {deleting ? (
            <div className="rounded-md border p-3 text-sm">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={levelToBadgeVariant[deleting.level]}>{deleting.level}</Badge>
                <span className="text-muted-foreground">{deleting.id}</span>
              </div>
              <div className="max-h-28 overflow-auto whitespace-pre-wrap">{deleting.message}</div>
            </div>
          ) : null}
          {dialogError ? <p className="text-sm text-destructive">{dialogError}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs} disabled={busy}>
              取消
            </Button>
            <Button variant="destructive" onClick={deleteNotification} disabled={busy}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function EditorForm({
  draft,
  setDraft,
  previewText,
  error,
  busy,
  onCancel,
  onSubmit,
  submitText,
}: {
  draft: EditorDraft
  setDraft: (next: EditorDraft) => void
  previewText: string
  error: string | null
  busy: boolean
  onCancel: () => void
  onSubmit: () => void
  submitText: string
}) {
  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <FormItem>
          <Label>通知内容（Markdown）</Label>
          <Textarea
            value={draft.message}
            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
            placeholder="支持 Markdown，例如：**重要通知**"
            className="min-h-64 font-mono"
          />
        </FormItem>

        <FormItem>
          <Label>预览</Label>
          <div className="bg-muted/30 min-h-64 rounded-md border p-3 text-sm">
            <ReactMarkdown>{previewText}</ReactMarkdown>
          </div>
        </FormItem>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormItem>
          <Label>级别</Label>
          <Select
            value={draft.level}
            onValueChange={(v) => setDraft({ ...draft, level: v as NotificationLevel })}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择级别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">info</SelectItem>
              <SelectItem value="warning">warning</SelectItem>
              <SelectItem value="error">error</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>

        <FormItem>
          <Label>是否激活</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={draft.is_active ? 'secondary' : 'outline'}
              onClick={() => setDraft({ ...draft, is_active: !draft.is_active })}
              disabled={busy}
            >
              {draft.is_active ? '已激活' : '未激活'}
            </Button>
            <span className="text-muted-foreground text-sm">
              激活后会在 check-cx 首页显示（取决于前端显示逻辑）。
            </span>
          </div>
        </FormItem>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormItem>
          <Label>开始时间（可选）</Label>
          <Input
            type="datetime-local"
            value={draft.start_time}
            onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
          />
        </FormItem>
        <FormItem>
          <Label>结束时间（可选）</Label>
          <Input
            type="datetime-local"
            value={draft.end_time}
            onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
          />
        </FormItem>
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          取消
        </Button>
        <Button type="submit" disabled={busy}>
          {submitText}
        </Button>
      </DialogFooter>
    </Form>
  )
}
