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
import { BottomNav } from "@/components/ui/bottom-nav"

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
    <div className="min-h-screen bg-background pb-20">

      <div className="container py-6 space-y-6">

      </div>

      <BottomNav />
    </div>
  )

}
