"use client"
/* eslint-disable @next/next/no-img-element */

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog"

interface AvatarPreviewDialogProps {
  open: boolean
  onOpenChange: (_open: boolean) => void
  imageUrl: string
  displayName: string
}

export function AvatarPreviewDialog({
  open,
  onOpenChange,
  imageUrl,
  displayName,
}: AvatarPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="avatar-preview-content fixed left-1/2 top-1/2 z-50 w-auto max-w-none -translate-x-1/2 -translate-y-1/2 overflow-visible border-0 bg-transparent p-0 text-white"
        >
          <DialogTitle className="sr-only">Foto de perfil de {displayName}</DialogTitle>
          <DialogDescription className="sr-only">
            Vista ampliada de la foto de perfil.
          </DialogDescription>

          <div className="relative flex flex-col items-center gap-4">
            <div className="h-[min(78vw,24rem)] w-[min(78vw,24rem)] overflow-hidden rounded-full shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:h-[min(70vw,28rem)] sm:w-[min(70vw,28rem)]">
              <img
                src={imageUrl}
                alt={`Foto de perfil de ${displayName}`}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>

            <div className="pointer-events-none rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm sm:text-sm">
              {displayName}
            </div>
          </div>

          <DialogClose className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white opacity-100 shadow-none outline-none ring-0 ring-offset-0 transition-colors hover:bg-white/20 focus:outline-none focus-visible:outline-none focus-visible:ring-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </DialogClose>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
