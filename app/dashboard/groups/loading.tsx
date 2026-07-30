import { ListPageSkeleton } from "@/components/admin/table-skeleton"

export default function Loading() {
  return <ListPageSkeleton filters={0} columns={5} rows={8} />
}
