export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        <span>加载中…</span>
      </div>
    </div>
  )
}
