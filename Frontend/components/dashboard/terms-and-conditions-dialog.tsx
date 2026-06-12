"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTermsAndConditionsDialog } from "@/hooks/dashboard/use-terms-and-conditions-dialog"
import { Check, ScrollText, X } from "lucide-react"

interface TermsAndConditionsDialogProps {
  open: boolean
  onAccept: () => void
  onReject: () => void
  viewMode?: "default" | "readonly"
}

export function TermsAndConditionsDialog({
  open,
  onAccept,
  onReject,
  viewMode = "default"
}: TermsAndConditionsDialogProps) {
  const {
    user,
    hasScrolledToBottom,
    scrollAreaRef,
    handleScroll,
    handleAccept,
    handleReject,
    personalizedText,
  } = useTermsAndConditionsDialog(open, onAccept, onReject, viewMode)

  // Formatear el texto manteniendo los saltos de línea y resaltando datos autocompletados
  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Detectar líneas con datos autocompletados para resaltarlas
      const isDataLine = line.includes('Nombres y Apellido:') ||
        line.includes('D.N.I.:') ||
        line.includes('Dirección:') ||
        line.includes('Correo electrónico:') ||
        line.includes('LUGAR Y FECHA:')

      return (
        <p
          key={index}
          className={`${line.trim() === '' ? 'mb-4' : 'mb-2'} leading-relaxed ${isDataLine ? 'font-semibold text-primary' : ''}`}
        >
          {line || ' '}
        </p>
      )
    })
  }

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && (viewMode === "readonly" ? onAccept() : handleReject())}>
      <DialogContent className="h-[90vh] w-[90vw] max-w-none lg:max-w-none">
        <DialogHeader className="pr-12">
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="size-5 shrink-0 text-primary" />
            <span className="min-w-0">Términos y Condiciones</span>
          </DialogTitle>
          {viewMode === "default" && (
            <DialogDescription>
              {!hasScrolledToBottom ?
                'Por favor, lea detenidamente y desplácese hasta el final para aceptar' :
                'Ha leído completamente los términos y condiciones'
              }
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogBody className="flex min-h-0 flex-col overflow-hidden">
          <ScrollArea
            className="min-h-0 flex-1 rounded-xl border p-4"
            ref={scrollAreaRef}
            onScrollCapture={handleScroll}
          >
            {user ? (
              <div className="space-y-2 whitespace-pre-wrap text-sm leading-relaxed">
                {formatText(personalizedText)}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Cargando términos y condiciones…</p>
              </div>
            )}
          </ScrollArea>
        </DialogBody>

        {viewMode === "default" && (
          <DialogFooter className="flex-row items-center gap-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              className="min-w-0 flex-1"
              disabled={!user}
            >
              <X className="mr-1.5 size-4 shrink-0 max-sm:hidden" />
              Rechazar
            </Button>

            <Button
              onClick={handleAccept}
              disabled={!hasScrolledToBottom || !user}
              className="min-w-0 flex-1"
            >
              <Check className="mr-1.5 size-4 shrink-0 max-sm:hidden" />
              Aceptar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
