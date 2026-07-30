"use client"

import { SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ALL = "__all__"

export type ToolbarFilter = {
  key: string
  label: string
  options: Array<{ value: string; label: string }>
}

type TableToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: ToolbarFilter[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  hasActiveQuery?: boolean
  onReset?: () => void
  /** 右侧附加内容，例如"新建"按钮 */
  actions?: React.ReactNode
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "搜索…",
  filters = [],
  filterValues = {},
  onFilterChange,
  hasActiveQuery,
  onReset,
  actions,
}: TableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup className="w-full sm:w-64">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </InputGroup>
      {filters.map((filter) => {
        const items: Record<string, string> = {
          [ALL]: filter.label,
          ...Object.fromEntries(
            filter.options.map((option) => [option.value, option.label])
          ),
        }
        const current = filterValues[filter.key] || ALL

        return (
          <Select
            key={filter.key}
            items={items}
            value={current}
            onValueChange={(next) =>
              onFilterChange?.(filter.key, next === ALL ? "" : String(next))
            }
          >
            <SelectTrigger className="min-w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      })}
      {hasActiveQuery && onReset ? (
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          <XIcon />
          清空筛选
        </Button>
      ) : null}
      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
