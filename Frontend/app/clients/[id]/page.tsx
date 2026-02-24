"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { UserRole } from "@/lib/types"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { User, Loader2 } from "lucide-react"
import { useClients } from "@/hooks/clients/use-client"
import { BottomNav } from "@/components/ui/bottom-nav"

export default function EditClientPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  useRequireAuth()

  const { loadClientDetail, selectedClient, loading, updateClientProfile } = useClients()

  const [phone, setPhone] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")
  const [address, setAddress] = useState("")

  const clientId = Number(params.id)

  useEffect(() => {
    if (clientId) {
      loadClientDetail(clientId)
    }
  }, [clientId, loadClientDetail])

  useEffect(() => {
    if (selectedClient) {
      setPhone(selectedClient.phone ?? "")
      setEmergencyPhone(selectedClient.emergencyPhone ?? "")
      setAddress(selectedClient.address ?? "")
    }
  }, [selectedClient])

  if (!user || user.role !== UserRole.ADMIN) {
    return <div>No tienes permisos para editar clientes</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!selectedClient) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateClientProfile({
        userId: clientId,
        phone: phone.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
        address: address.trim() || undefined,
      })
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente fueron actualizados exitosamente.",
      })
      router.push("/clients")
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background mb-32">
      <MobileHeader title="Editar Cliente" showBack onBack={() => router.back()} />

      <div className="container-centered py-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              {selectedClient.firstName} {selectedClient.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">DNI:</span> {selectedClient.dni}</p>
            <p><span className="font-medium text-foreground">Email:</span> {selectedClient.email}</p>
            <p>
              <span className="font-medium text-foreground">Fecha de nacimiento:</span>{" "}
              {selectedClient.birthDate
                ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(
                    typeof selectedClient.birthDate === "string"
                      ? (() => {
                          const [y, m, d] = (selectedClient.birthDate as string).split("-").map(Number)
                          return new Date(y, m - 1, d)
                        })()
                      : selectedClient.birthDate
                  )
                : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos editables</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 342 000 0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Telefono de emergencia</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+54 9 342 111 1111"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Direccion</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, numero, ciudad"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  )
}
