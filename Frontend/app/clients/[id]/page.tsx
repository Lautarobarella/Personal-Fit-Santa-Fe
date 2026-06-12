"use client"

import { useClientEdit } from "@/hooks/clients/use-client-edit"
import { UserRole } from "@/types"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { BottomNav } from "@/components/ui/bottom-nav"

export default function EditClientPage() {
  const {
    user,
    router,
    isLoading,
    loading,
    selectedClient,
    phone,
    setPhone,
    emergencyPhone,
    setEmergencyPhone,
    address,
    setAddress,
    handleSubmit,
    formatDate,
  } = useClientEdit()

  if (!user || user.role !== UserRole.ADMIN) {
    return <div>No tienes permisos para editar clientes</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (!selectedClient) return null

  return (
    <div className="min-h-screen bg-background mb-32">
      <MobileHeader title="Editar Cliente" showBack onBack={() => router.back()} />

      <div className="container-centered py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del cliente */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h3 className="text-base font-semibold">
                {selectedClient.firstName} {selectedClient.lastName}
              </h3>
            </div>
            <div className="space-y-2 rounded-xl border p-4 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">DNI:</span> {selectedClient.dni}</p>
              <p className="break-all"><span className="font-medium text-foreground">Email:</span> {selectedClient.email}</p>
              <p>
                <span className="font-medium text-foreground">Fecha de nacimiento:</span>{" "}
                <span> {formatDate(selectedClient.birthDate)}</span>
              </p>
            </div>
          </section>

          {/* Datos editables */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
              <h3 className="text-base font-semibold">Datos editables</h3>
            </div>
            <div className="space-y-4 rounded-xl border p-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 342 000 0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Teléfono de emergencia</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+54 9 342 111 1111"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, ciudad"
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
      <BottomNav />
    </div>
  )
}
