export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"

import { getOptionalAdminUser } from "@/lib/admin/auth"

export default async function Page() {
  const user = await getOptionalAdminUser()

  redirect(user ? "/dashboard" : "/login")
}
