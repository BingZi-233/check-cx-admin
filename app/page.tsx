export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"

import { getOptionalAppUser } from "@/lib/admin/auth"

export default async function Page() {
  const user = await getOptionalAppUser()

  redirect(user ? "/dashboard" : "/login")
}
