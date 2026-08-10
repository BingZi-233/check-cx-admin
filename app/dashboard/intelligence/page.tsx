import { IntelligenceTable } from "@/app/dashboard/intelligence/intelligence-table"
import { PageHeader } from "@/components/admin/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireAdminUser } from "@/lib/admin/auth"
import { listIntelligenceStats } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function formatRate(value: number | null) {
  return value === null ? "—" : `${value}%`
}

export default async function IntelligencePage() {
  const user = await requireAdminUser()

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="智能评估"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const stats = await listIntelligenceStats(user)

  const scored = stats.filter((row) => row.total_score !== null)
  const avgScore =
    scored.length > 0
      ? Math.round(
          (scored.reduce((sum, row) => sum + (row.total_score ?? 0), 0) /
            scored.length) *
            100
        ) / 100
      : null
  const totalSamples = stats.reduce((sum, row) => sum + row.total_samples, 0)

  // 难题（难度 3-5）整体通过率：对所有非 null 的难题档取平均
  const hardRates = stats.flatMap((row) =>
    [row.d3_pass_rate, row.d4_pass_rate, row.d5_pass_rate].filter(
      (rate): rate is number => rate !== null
    )
  )
  const avgHardRate =
    hardRates.length > 0
      ? Math.round(
          (hardRates.reduce((sum, rate) => sum + rate, 0) / hardRates.length) *
            100
        ) / 100
      : null

  const cards = [
    {
      label: "已评估配置",
      value: String(stats.length),
      hint: "近 30 天有挑战记录的配置数。",
    },
    {
      label: "平均综合得分",
      value: avgScore === null ? "—" : String(avgScore),
      hint: "按难度加权（1/2/4/8/16），样本不足 5 的难度档不计入。",
    },
    {
      label: "近 30 天总样本",
      value: String(totalSamples),
      hint: "难题约占 20%，随轮询自动累积。",
    },
    {
      label: "难题整体通过率",
      value: formatRate(avgHardRate),
      hint: "难度 3-5（状态追踪/逻辑蕴涵/指令遵循）的平均通过率。",
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="智能评估"
        description="基于健康检查中混入的挑战题（近 30 天）评估模型能力；难题答错不影响健康状态。"
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {item.hint}
            </CardContent>
          </Card>
        ))}
      </div>

      <IntelligenceTable stats={stats} />
    </div>
  )
}
