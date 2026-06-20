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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { UserType } from "@/types"
import { Copy } from "lucide-react"

interface ExportClientsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: UserType[]
  statusFilter: "ACTIVE" | "INACTIVE" | "all"
}

const tabLabels: Record<ExportClientsDialogProps["statusFilter"], string> = {
  ACTIVE: "Activos",
  INACTIVE: "Inactivos",
  all: "Total",
}

export function ExportClientsDialog({ open, onOpenChange, clients, statusFilter }: ExportClientsDialogProps) {
  const { toast } = useToast()

  const listText = clients
    .map((client) => `${client.firstName} ${client.lastName} | ${client.dni ?? "sin DNI"}`)
    .join("\n")

  const handleCopy = async () => {
    if (!listText) {
      return
    }

    try {
      await navigator.clipboard.writeText(listText)
      toast({ title: "Listado copiado", description: "Se copió al portapapeles." })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar listado</DialogTitle>
          <DialogDescription>
            {tabLabels[statusFilter]} · {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Textarea
            readOnly
            value={listText}
            aria-label="Listado de clientes"
            className="h-full min-h-[240px] resize-none text-sm leading-relaxed"
          />
        </DialogBody>
        <DialogFooter>
          <Button onClick={handleCopy} disabled={!listText}>
            <Copy className="size-4 mr-2" />
            Copiar listado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
