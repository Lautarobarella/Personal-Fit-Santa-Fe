"use client"

import { CreatePaymentDialog } from "@/components/payments/create-payment-dialog"
import { useAuth } from "@/components/providers/auth-provider"
import { BottomNav } from "@/components/ui/bottom-nav"
import { usePayment } from "@/hooks/use-payment"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function NewPaymentPage() {
  const { toast } = useToast()
  const { createPaymentWithStatus } = usePayment()
  const { user } = useAuth()
  const router = useRouter()

  const handleCreatePayment = async (payment: {
    clientDni: number
    amount: number
    createdAt: string
    expiresAt: string
    file?: File
  }) => {
    try {
      // Determinar si es un pago automático (admin) o manual
      const isAutomaticPayment = user?.role === "admin"
      
      await createPaymentWithStatus({
        paymentData: payment,
        isMercadoPagoPayment: isAutomaticPayment // Si es admin, se marca como pago automático
      })

      toast({
        title: "Pago creado",
        description: isAutomaticPayment 
          ? "El pago se ha registrado y el cliente ha sido activado automáticamente"
          : "El pago se ha registrado correctamente",
      })

      router.push("/payments")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el pago",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container py-6 space-y-6">
        <CreatePaymentDialog
          open={true}
          onOpenChange={(open) => console.log("Dialog open:", open)}
          onCreatePayment={handleCreatePayment}
        />
      </div>
      <BottomNav />
    </div>
  )
}
