import { AppUser } from "@/lib/admin/types"

export function isAdminUser(user: AppUser) {
  return user.role === "admin"
}

export function getRequiredGroupName(user: AppUser) {
  const groupName = user.groupName?.trim() ?? ""

  if (!isAdminUser(user) && groupName.length === 0) {
    throw new Error("当前成员未绑定分组，无法访问后台配置")
  }

  return groupName || null
}

export function isGroupInUserScope(user: AppUser, groupName: string | null | undefined) {
  if (isAdminUser(user)) {
    return true
  }

  return (groupName?.trim() ?? "") === (getRequiredGroupName(user) ?? "")
}

export function describeUserScope(user: AppUser) {
  if (isAdminUser(user)) {
    return "管理员 / 全部分组"
  }

  return `成员 / ${getRequiredGroupName(user)}`
}
