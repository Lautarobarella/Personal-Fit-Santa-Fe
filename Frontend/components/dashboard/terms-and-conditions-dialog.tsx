"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTermsAndConditionsDialog } from "@/hooks/dashboard/use-terms-and-conditions-dialog"

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
          {line || ' '}
        </p>
      )
    })
  }

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && (viewMode === "readonly" ? onAccept() : handleReject())}>
      <DialogContent className="h-[90vh] w-[90vw] max-w-none lg:max-w-none">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Términos y Condiciones
          </DialogTitle>
          {viewMode === "default" && (
            <p className="text-center text-sm text-muted-foreground">
              {!hasScrolledToBottom ?
                'Por favor, lea detenidamente y desplácese hasta el final para aceptar' :
                'Ha leído completamente los términos y condiciones'
              }
            </p>
          )}
        </DialogHeader>

        <DialogBody className="flex min-h-0 flex-col overflow-hidden">
          <ScrollArea
            className="flex-1 pr-4"
            ref={scrollAreaRef}
            onScrollCapture={handleScroll}
          >
            {user ? (
              <div className="space-y-2 whitespace-pre-wrap text-sm leading-relaxed">
                {formatText(personalizedText)}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Cargando términos y condiciones…</p>
              </div>
            )}
          </ScrollArea>
        </DialogBody>

        {viewMode === "default" && (
          <DialogFooter className="flex-row gap-4">
            <Button
              variant="destructive"
              onClick={handleReject}
              className="flex-1"
              disabled={!user}
            >
              Rechazar
            </Button>

            <Button
              onClick={handleAccept}
              disabled={!hasScrolledToBottom || !user}
              className="flex-1"
            >
              Aceptar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
