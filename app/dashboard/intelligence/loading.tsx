import { ListPageSkeleton } from "@/components/admin/table-skeleton"

export default function Loading() {
  return <ListPageSkeleton filters={0} columns={9} rows={12} />
}
