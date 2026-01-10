"use client"

import * as React from "react"
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  createGroupAction,
  deleteGroupAction,
  initialState,
  updateGroupAction,
  type GroupActionState,
} from "@/app/protected/groups/actions"
import { normalizeUiErrorMessage } from "@/lib/locale"

type GroupInfoRow = {
  id: string
  group_name: string
  website_url: string | null
  created_at: string | null
  updated_at: string | null
}

function ActionMessage({ state }: { state: GroupActionState }) {
  if (!state.message) return null
  return (
    <p className={state.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
      {state.message}
    </p>
  )
}

function GroupFormDialog({
  title,
  description,
  trigger,
  action,
  defaultValues,
  hiddenFields,
}: {
  title: string
  description?: string
  trigger: React.ReactNode
  action: (prevState: GroupActionState, formData: FormData) => Promise<GroupActionState>
  defaultValues?: { group_name?: string; website_url?: string }
  hiddenFields?: Array<{ name: string; value: string }>
}) {
  const [open, setOpen] = React.useState(false)
  const [state, formAction, pending] = React.useActionState(action, initialState)

  React.useEffect(() => {
    if (state.ok) setOpen(false)
  }, [state.ok])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <Form action={formAction}>
          {hiddenFields?.map((f) => (
            <input key={f.name} type="hidden" name={f.name} value={f.value} />
          ))}

          <FormField name="group_name" error={state.fieldErrors?.group_name}>
            <FormItem>
              <FormLabel>分组名称</FormLabel>
              <FormControl>
                <Input
                  name="group_name"
                  placeholder="例如：OpenAI"
                  defaultValue={defaultValues?.group_name ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField name="website_url" error={state.fieldErrors?.website_url}>
            <FormItem>
              <FormLabel>官网URL</FormLabel>
                  <FormControl>
                    <Input
                      name="website_url"
                      placeholder="例如：https://example.com"
                      defaultValue={defaultValues?.website_url ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
          </FormField>

          <ActionMessage state={state} />

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "处理中..." : "保存"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteGroupDialog({ group }: { group: GroupInfoRow }) {
  const [open, setOpen] = React.useState(false)
  const [state, formAction, pending] = React.useActionState(deleteGroupAction, initialState)

  React.useEffect(() => {
    if (state.ok) setOpen(false)
  }, [state.ok])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon-sm" variant="destructive" aria-label="删除分组">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除分组</DialogTitle>
          <DialogDescription>
            你确定要删除 <span className="font-semibold">{group.group_name}</span> 吗？
            删除分组不会删除关联的配置，只是解除关联（建议数据库外键使用 ON DELETE SET
            NULL）。
          </DialogDescription>
        </DialogHeader>

        <Form action={formAction}>
          <input type="hidden" name="id" value={group.id} />
          <ActionMessage state={state} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function GroupsClient({
  groups,
  configCountsByGroupId,
  loadError,
}: {
  groups: GroupInfoRow[]
  configCountsByGroupId: Record<string, number | null>
  loadError: string | null
}) {
  const safeLoadError = loadError ? normalizeUiErrorMessage(loadError, "加载失败") : null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">分组管理</h1>
          <p className="text-muted-foreground text-sm">
            管理仪表盘上的分组展示（新增、编辑、删除）。
          </p>
        </div>

        <GroupFormDialog
          title="新增分组"
          description="输入分组名称与官网URL。分组名称需唯一。"
          action={createGroupAction}
          trigger={
            <Button>
              <Plus className="size-4" />
              新增分组
            </Button>
          }
        />
      </div>

      {safeLoadError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>加载失败</CardTitle>
            <CardDescription>{safeLoadError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {groups.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((g) => {
            const configCount = configCountsByGroupId[g.id]
            return (
              <Card key={g.id}>
                <CardHeader className="border-b">
                  <CardTitle className="truncate">{g.group_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>检测配置：</span>
                    <span className="font-medium">
                      {typeof configCount === "number" ? configCount : "—"}
                    </span>
                  </CardDescription>
                  <CardAction className="flex items-center gap-2">
                    <GroupFormDialog
                      title="编辑分组"
                      action={updateGroupAction}
                      defaultValues={{
                        group_name: g.group_name,
                        website_url: g.website_url ?? "",
                      }}
                      hiddenFields={[{ name: "id", value: g.id }]}
                      trigger={
                        <Button size="icon-sm" variant="outline" aria-label="编辑分组">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <DeleteGroupDialog group={g} />
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <div className="text-muted-foreground">官网</div>
                    {g.website_url ? (
                      <a
                        className="inline-flex items-center gap-1 hover:underline"
                        href={g.website_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {g.website_url}
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>还没有分组</CardTitle>
            <CardDescription>先创建一个分组，用于仪表盘展示。</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
