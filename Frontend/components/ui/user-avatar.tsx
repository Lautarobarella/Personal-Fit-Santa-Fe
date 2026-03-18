"use client"

import { buildUserAvatarUrl } from "@/api/clients/usersApi"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserAvatarProps {
  userId?: number | null
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
  className?: string
  fallbackClassName?: string
}

export function UserAvatar({
  userId,
  firstName,
  lastName,
  avatar,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const avatarUrl = buildUserAvatarUrl(userId ?? undefined, avatar)
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase()

  return (
    <Avatar className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={`${firstName ?? ""} ${lastName ?? ""}`.trim()} />}
      <AvatarFallback className={fallbackClassName}>
        {initials || "?"}
      </AvatarFallback>
    </Avatar>
  )
}
