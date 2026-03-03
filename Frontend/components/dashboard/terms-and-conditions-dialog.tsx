"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
                <p key={index} className={`${line.trim() === '' ? 'mb-4' : 'mb-2'} leading-relaxed ${isDataLine ? 'font-semibold text-primary' : ''
                    }`}>
                    {line || '\u00A0'}
                </p>
            )
        })
    }

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && (viewMode === "readonly" ? onAccept() : handleReject())}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-none flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4">
          <DialogTitle className="text-xl font-bold text-center">
            Términos y Condiciones
          </DialogTitle>
          {viewMode === "default" && (
            <p className="text-sm text-muted-foreground text-center">
              {!hasScrolledToBottom ? 
                'Por favor, lea detenidamente y desplácese hasta el final para aceptar' : 
                'Ha leído completamente los términos y condiciones'
              }
            </p>
          )}
        </DialogHeader>                <div className="flex-1 flex flex-col min-h-0 px-6">
                    <ScrollArea
                        className="flex-1 pr-4"
                        ref={scrollAreaRef}
                        onScrollCapture={handleScroll}
                    >
                        {user ? (
                            <div className="text-sm space-y-2 whitespace-pre-wrap leading-relaxed">
                                {formatText(personalizedText)}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground">Cargando términos y condiciones...</p>
                            </div>
                        )}
                    </ScrollArea>

                    {viewMode === "default" && (
                        <div className="flex-shrink-0 flex justify-between gap-4 pt-6 pb-6 border-t mt-4">
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
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}