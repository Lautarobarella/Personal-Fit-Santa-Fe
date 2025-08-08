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

      // El diálogo maneja el toast y la navegación exitosa
      // No necesitamos hacer nada más aquí
    } catch (error) {
      // El diálogo maneja los errores internamente
      // Re-lanzar el error para que el diálogo lo maneje
      throw error
    }
  }

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Redirigir según el rol del usuario
      if (user?.role === "client") {
        router.push("/payments/method-select")
      } else {
        router.push("/payments")
      }
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container-centered py-6 space-y-6">
        <CreatePaymentDialog
          open={true}
          onOpenChange={handleDialogChange}
          onCreatePayment={handleCreatePayment}
        />
      </div>
      <BottomNav />
    </div>
  )
}
