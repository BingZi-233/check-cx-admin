"use client"

import { useCallback, useDeferredValue, useMemo, useState } from "react"

export type SortDirection = "asc" | "desc"

export type TableColumnSpec<T> = {
  /** 排序键；与 DataTable 列的 sortKey 对应 */
  key: string
  /** 取排序值；返回 string / number / null */
  sortValue?: (row: T) => string | number | null | undefined
}

export type FilterSpec<T> = {
  key: string
  /** 返回 true 表示该行通过筛选 */
  match: (row: T, value: string) => boolean
}

export type UseTableStateOptions<T> = {
  rows: T[]
  /** 搜索时参与匹配的文本片段 */
  searchFields?: (row: T) => Array<string | null | undefined>
  columns?: TableColumnSpec<T>[]
  filters?: FilterSpec<T>[]
  initialSort?: { key: string; direction: SortDirection }
  pageSize?: number
}

const collator = new Intl.Collator("zh-Hans-CN", { numeric: true })

function compareValues(
  left: string | number | null | undefined,
  right: string | number | null | undefined
) {
  const leftEmpty = left === null || left === undefined || left === ""
  const rightEmpty = right === null || right === undefined || right === ""

  if (leftEmpty && rightEmpty) return 0
  // 空值一律排在后面，不受升降序影响，避免"按更新时间排序"时一堆 - 抢占首屏
  if (leftEmpty) return 1
  if (rightEmpty) return -1

  if (typeof left === "number" && typeof right === "number") {
    return left - right
  }

  return collator.compare(String(left), String(right))
}

/**
 * 列表页的搜索 / 筛选 / 排序 / 分页状态。
 * 数据量在几百条以内时全部在客户端处理，交互零往返。
 */
export function useTableState<T>({
  rows,
  searchFields,
  columns = [],
  filters = [],
  initialSort,
  pageSize = 20,
}: UseTableStateOptions<T>) {
  const [search, setSearch] = useState("")
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sort, setSort] = useState(initialSort ?? null)
  const [page, setPage] = useState(1)

  // 大列表下输入不卡：过滤走低优先级渲染
  const deferredSearch = useDeferredValue(search)

  const activeFilters = useMemo(
    () => Object.entries(filterValues).filter(([, value]) => value.length > 0),
    [filterValues]
  )

  const filteredRows = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase()

    return rows.filter((row) => {
      if (keyword.length > 0 && searchFields) {
        const haystack = searchFields(row)
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        if (!haystack.includes(keyword)) {
          return false
        }
      }

      return activeFilters.every(([key, value]) => {
        const spec = filters.find((item) => item.key === key)
        return spec ? spec.match(row, value) : true
      })
    })
  }, [activeFilters, deferredSearch, filters, rows, searchFields])

  const sortedRows = useMemo(() => {
    if (!sort) {
      return filteredRows
    }

    const spec = columns.find((item) => item.key === sort.key)

    if (!spec?.sortValue) {
      return filteredRows
    }

    const factor = sort.direction === "asc" ? 1 : -1

    return [...filteredRows].sort(
      (left, right) =>
        factor * compareValues(spec.sortValue!(left), spec.sortValue!(right))
    )
  }, [columns, filteredRows, sort])

  const total = sortedRows.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pagedRows = useMemo(
    () => sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [pageSize, safePage, sortedRows]
  )

  const toggleSort = useCallback((key: string) => {
    setPage(1)
    setSort((current) => {
      if (current?.key !== key) {
        return { key, direction: "asc" }
      }

      return current.direction === "asc"
        ? { key, direction: "desc" }
        : null
    })
  }, [])

  const setFilter = useCallback((key: string, value: string) => {
    setPage(1)
    setFilterValues((current) => ({ ...current, [key]: value }))
  }, [])

  const updateSearch = useCallback((value: string) => {
    setPage(1)
    setSearch(value)
  }, [])

  const reset = useCallback(() => {
    setSearch("")
    setFilterValues({})
    setPage(1)
  }, [])

  return {
    rows: pagedRows,
    total,
    filteredTotal: total,
    sourceTotal: rows.length,
    search,
    setSearch: updateSearch,
    filterValues,
    setFilter,
    hasActiveQuery: search.trim().length > 0 || activeFilters.length > 0,
    reset,
    sort,
    toggleSort,
    page: safePage,
    pageCount,
    pageSize,
    setPage,
  }
}

export type TableState<T> = ReturnType<typeof useTableState<T>>
