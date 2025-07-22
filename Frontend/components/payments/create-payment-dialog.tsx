"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar, DollarSign, Loader2, User } from "lucide-react"

interface CreatePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: Array<{
    id: string
    name: string
    email: string
    status: string
  }>
  onCreatePayment: (payment: {
    clientId: string
    month: string
    amount: number
    dueDate: Date
  }) => Promise<void>
}

export function CreatePaymentDialog({ open, onOpenChange, clients, onCreatePayment }: CreatePaymentDialogProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const { toast } = useToast()

  const activeClients = clients.filter((client) => client.status === "active")

  // Generate month options (current month and next 12 months)
  const generateMonthOptions = () => {
    const options = []
    const now = new Date()

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthLabel = new Intl.DateTimeFormat("es-ES", {
        month: "long",
        year: "numeric",
      }).format(date)

      options.push({ value: monthStr, label: monthLabel })
    }

    return options
  }

  const monthOptions = generateMonthOptions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClient || !selectedMonth || !amount || !dueDate) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      })
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número válido mayor a 0",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      await onCreatePayment({
        clientId: selectedClient,
        month: selectedMonth,
        amount: amountNum,
        dueDate: new Date(dueDate),
      })

      toast({
        title: "Pago creado",
        description: "El pago mensual ha sido creado exitosamente",
      })

      // Reset form
      setSelectedClient("")
      setSelectedMonth("")
      setAmount("")
      setDueDate("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el pago",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Crear Pago Mensual
          </DialogTitle>
          <DialogDescription>Asigna un pago mensual a un cliente activo</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {activeClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{client.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">Mes *</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto ($) *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="150.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Fecha de Vencimiento *</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
