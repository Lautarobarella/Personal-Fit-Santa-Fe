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
import { UserType } from "@/types"
import { Loader2 } from "lucide-react"

interface CreateInactivePaymentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: UserType[]
  monthlyFee: number
  isSubmitting: boolean
  onConfirm: () => void
}

const formatAmount = (amount: number) => `$${amount.toLocaleString("es-AR")}`

export function CreateInactivePaymentsDialog({
  open,
  onOpenChange,
  clients,
  monthlyFee,
  isSubmitting,
  onConfirm,
}: CreateInactivePaymentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="lg:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cargar pago</DialogTitle>
          <DialogDescription>
            {monthlyFee > 0 ? (
              <>
                Se generará un pago confirmado para {clients.length}{" "}
                {clients.length === 1 ? "cliente" : "clientes"} ({formatAmount(monthlyFee)} por cliente · total{" "}
                {formatAmount(monthlyFee * clients.length)}).
              </>
            ) : (
              <>No se pudo obtener la cuota mensual. Recargá la página e intentá nuevamente.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ul
            aria-label="Clientes seleccionados"
            className="max-h-[280px] divide-y overflow-y-auto rounded-xl border text-sm"
          >
            {clients.map((client) => (
              <li key={client.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="min-w-0 break-words font-medium">
                  {client.firstName} {client.lastName}
                </span>
                <span className="shrink-0 text-muted-foreground">DNI {client.dni ?? "sin DNI"}</span>
              </li>
            ))}
          </ul>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          {/* Sin cuota conocida no se puede confirmar: el admin debe ver el
              monto real antes de autorizar el pago */}
          <Button onClick={onConfirm} disabled={isSubmitting || clients.length === 0 || monthlyFee <= 0}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
