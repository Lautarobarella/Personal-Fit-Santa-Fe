"use client"

import { CreatePaymentDialog } from "@/components/payments/create-payment-dialog"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-provider"
import { usePaymentContext } from "@/contexts/payment-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { MethodType, UserRole } from "@/lib/types"
import { getPaymentCreationWindowLabel, isWithinPaymentCreationWindow } from "@/lib/payment-rules"
import { cn } from "@/lib/utils"
import { User, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

type PaymentCreationMode = "individual" | "group"

interface PaymentDialogConfig {
  mode: PaymentCreationMode
  expectedDniCount?: number
}

export default function NewPaymentPage() {
  const { createPayment } = usePaymentContext()
  const { user } = useAuth()
  const router = useRouter()

  useRequireAuth()

  const [modeDialogOpen, setModeDialogOpen] = useState(true)
  const [selectedMode, setSelectedMode] = useState<PaymentCreationMode>("individual")
  const [groupSizeInput, setGroupSizeInput] = useState("")
  const [paymentDialogConfig, setPaymentDialogConfig] = useState<PaymentDialogConfig | null>(null)

  const parsedGroupSize = useMemo(() => {
    const parsed = Number.parseInt(groupSizeInput, 10)
    if (Number.isNaN(parsed)) {
      return 0
    }
    return parsed
  }, [groupSizeInput])

  const isPaymentCreationWindowOpen = useMemo(() => isWithinPaymentCreationWindow(), [])
  const paymentCreationWindowLabel = useMemo(() => getPaymentCreationWindowLabel(), [])

  const canContinue = useMemo(() => {
    if (!isPaymentCreationWindowOpen) {
      return false
    }

    if (selectedMode === "individual") {
      return true
    }

    return Number.isInteger(parsedGroupSize) && parsedGroupSize >= 2
  }, [isPaymentCreationWindowOpen, parsedGroupSize, selectedMode])

  const handleCreatePayment = async (payment: {
    clientDnis: number[]
    createdByDni: number
    amount: number
    createdAt: string
    expiresAt: string
    method: MethodType
    notes?: string
    file?: File
  }) => {
    const isAutomaticPayment = user?.role === UserRole.ADMIN

    await createPayment({
      paymentData: payment,
      isAutomaticPayment,
    })
  }

  const handleModeDialogOpenChange = (open: boolean) => {
    setModeDialogOpen(open)
    if (!open && !paymentDialogConfig) {
      router.push("/payments")
    }
  }

  const handleContinueToPayment = () => {
    if (!isPaymentCreationWindowOpen) {
      return
    }

    if (selectedMode === "individual") {
      setPaymentDialogConfig({ mode: "individual", expectedDniCount: 1 })
      setModeDialogOpen(false)
      return
    }

    if (!canContinue) {
      return
    }

    setPaymentDialogConfig({ mode: "group", expectedDniCount: parsedGroupSize })
    setModeDialogOpen(false)
  }

  const handlePaymentDialogChange = (open: boolean) => {
    if (!open) {
      router.push("/payments")
    }
  }

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <div className="container-centered py-6 space-y-6">
        <Dialog open={modeDialogOpen} onOpenChange={handleModeDialogOpenChange}>
          <DialogContent className="sm:max-w-lg top-[72px] bottom-auto max-h-[calc(100vh-152px)]">
            <DialogHeader className="pb-3">
              <DialogTitle>Nuevo pago</DialogTitle>
              <DialogDescription>
                Selecciona el tipo de pago que deseas registrar.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 px-5 py-4 sm:px-6">
              {!isPaymentCreationWindowOpen && (
                <Card className="border-amber-300 bg-amber-50">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium text-amber-900">
                      La carga de pagos está habilitada {paymentCreationWindowLabel}.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSelectedMode("individual")}
                  className={cn(
                    "w-full text-left rounded-xl border px-4 py-4 transition-colors",
                    selectedMode === "individual" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Pago Individual</p>
                      <p className="text-sm text-muted-foreground">Registra un pago para un solo cliente.</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode("group")}
                  className={cn(
                    "w-full text-left rounded-xl border px-4 py-4 transition-colors",
                    selectedMode === "group" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Pago Grupal</p>
                      <p className="text-sm text-muted-foreground">Registra un pago para varios clientes.</p>
                    </div>
                  </div>
                </button>
              </div>

              {selectedMode === "group" && (
                <Card className="border-border/80">
                  <CardContent className="space-y-2 p-4">
                    <Label htmlFor="group-size">Cantidad de usuarios (DNIs)</Label>
                    <Input
                      id="group-size"
                      type="number"
                      min={2}
                      step={1}
                      value={groupSizeInput}
                      onChange={(event) => setGroupSizeInput(event.target.value)}
                      placeholder="Ej: 3"
                    />
                    <p className="text-xs text-muted-foreground">
                      Debes completar exactamente esa cantidad de DNIs para habilitar la confirmacion del pago.
                    </p>
                  </CardContent>
                </Card>
              )}
            </DialogBody>

            <DialogFooter className="gap-3">
              <Button onClick={handleContinueToPayment} disabled={!canContinue} className="w-full sm:w-auto">Continuar</Button>
              <Button variant="outline" onClick={() => router.push("/payments")} className="w-full sm:w-auto">Cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {paymentDialogConfig && (
          <CreatePaymentDialog
            open={true}
            onOpenChange={handlePaymentDialogChange}
            onCreatePayment={handleCreatePayment}
            paymentFlowMode={paymentDialogConfig.mode}
            expectedDniCount={paymentDialogConfig.expectedDniCount}
          />
        )}
      </div>
      <BottomNav />
    </div>
  )
}
