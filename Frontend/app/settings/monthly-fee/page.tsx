"use client"

import { useAuth } from "@/contexts/auth-provider"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/lib/types"
import { ArrowLeft, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function MonthlyFeePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [monthlyFee, setMonthlyFee] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.push("/settings")
    }
  }, [user, router])

  // Fetch current monthly fee
  useEffect(() => {
    const fetchMonthlyFee = async () => {
      try {
        setIsLoading(true)
        const { fetchMonthlyFee: fetchFee } = await import('@/api/settings/settingsApi')
        const fee = await fetchFee()
        setMonthlyFee(fee.toString())
      } catch (error) {
        console.error('Error fetching monthly fee:', error)
        toast({
          title: "Error",
          description: "No se pudo cargar el valor actual de la cuota",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.role === UserRole.ADMIN) {
      fetchMonthlyFee()
    }
  }, [user, toast])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const amount = parseFloat(monthlyFee)
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "El valor debe ser un número positivo",
          variant: "destructive",
        })
        return
      }

      const { updateMonthlyFee } = await import('@/api/settings/settingsApi')
      await updateMonthlyFee(amount)

      toast({
        title: "Éxito",
        description: "El valor de la cuota se actualizó correctamente",
      })
      router.push("/settings")
    } catch (error) {
      console.error('Error updating monthly fee:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el valor de la cuota",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!user || user.role !== UserRole.ADMIN) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Valor de la Cuota" showBack onBack={() => router.back()} />

      <div className="container-centered py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Establecer Valor de la Cuota Mensual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyFee">Valor de la cuota ($)</Label>
              <Input
                id="monthlyFee"
                type="number"
                min="0"
                step="0.01"
                placeholder="25000"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Este valor se utilizará como monto predeterminado para todos los pagos mensuales.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/settings")}
                disabled={isSaving}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="flex-1"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  )
} 