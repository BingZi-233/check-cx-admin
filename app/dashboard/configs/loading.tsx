import { ListPageSkeleton } from "@/components/admin/table-skeleton"

export default function Loading() {
  return <ListPageSkeleton filters={4} columns={9} rows={10} />
}
