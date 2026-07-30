import { ListPageSkeleton } from "@/components/admin/table-skeleton"

export default function Loading() {
  return <ListPageSkeleton filters={2} columns={7} rows={8} />
}
