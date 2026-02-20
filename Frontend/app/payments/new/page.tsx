"use client"

import { CreatePaymentDialog } from "@/components/payments/create-payment-dialog"
import { BottomNav } from "@/components/ui/bottom-nav"
import { useAuth } from "@/contexts/auth-provider"
import { usePaymentContext } from "@/contexts/payment-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { MethodType, UserRole } from "@/lib/types"
import { useRouter } from "next/navigation"

export default function NewPaymentPage() {
  const { createPayment } = usePaymentContext()
  const { user } = useAuth()
  const router = useRouter()

  // Use custom hook to redirect to login if not authenticated
  useRequireAuth()

  const handleCreatePayment = async (payment: {
    clientDnis: number[]
    amount: number
    createdAt: string
    expiresAt: string
    method: MethodType
    file?: File
  }) => {
    const isAutomaticPayment = user?.role === UserRole.ADMIN

    await createPayment({
      paymentData: payment,
      isAutomaticPayment,
    })
  }

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      router.push("/payments")
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
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
