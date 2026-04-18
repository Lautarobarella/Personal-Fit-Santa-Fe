"use client"

import { buildUserAvatarUrl } from "@/api/clients/usersApi"
import { AvatarPreviewDialog } from "@/components/ui/avatar-preview-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface UserAvatarProps {
  userId?: number | null
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
  className?: string
  fallbackClassName?: string
  enablePreview?: boolean
}

export function UserAvatar({
  userId,
  firstName,
  lastName,
  avatar,
  className,
  fallbackClassName,
  enablePreview = true,
}: UserAvatarProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const avatarUrl = buildUserAvatarUrl(userId ?? undefined, avatar)
  const displayName = `${firstName ?? ""} ${lastName ?? ""}`.trim() || "Usuario"
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase()
  const canPreview = enablePreview && Boolean(avatarUrl)

  const avatarContent = (
    <Avatar className={cn(className, canPreview && "transition-transform duration-200 group-hover:scale-[1.03]")}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
      <AvatarFallback className={fallbackClassName}>
        {initials || "?"}
      </AvatarFallback>
    </Avatar>
  )

  if (!canPreview) {
    return avatarContent
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="group inline-flex cursor-zoom-in rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Abrir foto de perfil de ${displayName}`}
        onClick={(event) => {
          event.stopPropagation()
          setIsPreviewOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            event.stopPropagation()
            setIsPreviewOpen(true)
          }
        }}
      >
        {avatarContent}
      </div>

      <AvatarPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        imageUrl={avatarUrl!}
        displayName={displayName}
      />
    </>
  )
}
