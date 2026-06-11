"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useSettingsEdit } from "@/hooks/settings/use-settings-edit"
import { Eye, EyeOff, Save } from "lucide-react"
import { useState } from "react"

export default function EditProfilePage() {
  const {
    user,
    profileData,
    passwordData,
    shouldUpdatePassword,
    isLoading,
    handleInputChange,
    handlePasswordChange,
    handleSubmit,
    handleCancel,
    formatDate,
  } = useSettingsEdit()

  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    next: false,
    confirm: false,
  })

  const togglePasswordVisibility = (field: "current" | "next" | "confirm") => {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const accountInfo = [
    { label: "Nombre", value: user?.firstName },
    { label: "Apellido", value: user?.lastName },
    { label: "DNI", value: user?.dni },
    { label: "Email", value: user?.email },
    { label: "Fecha de nacimiento", value: formatDate(user?.birthDate) },
  ]

  return (
    <div className="min-h-screen bg-background mb-32">
      <MobileHeader
        title="Editar Perfil"
        showBack
        onBack={handleCancel}
      />

      <div className="container-centered py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de la cuenta (solo lectura) */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h3 className="text-base font-semibold">Información de la cuenta</h3>
            </div>
            <div className="rounded-xl border px-4 py-1">
              <dl className="divide-y">
                {accountInfo.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <dt className="shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="min-w-0 break-all text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* Datos de contacto */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
              <h3 className="text-base font-semibold">Datos de contacto</h3>
            </div>
            <div className="space-y-4 rounded-xl border p-4">
              <div className="space-y-2">
                <Label htmlFor="address">
                  Dirección <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  type="text"
                  value={profileData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Ingresa tu dirección"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Ingresa tu teléfono"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency-phone">Teléfono de Emergencia</Label>
                <Input
                  id="emergency-phone"
                  type="tel"
                  value={profileData.emergencyPhone}
                  onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                  placeholder="Ingresa un teléfono de emergencia (opcional)"
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Contacto en caso de emergencia
                </p>
              </div>
            </div>
          </section>

          {/* Cambiar contraseña */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-primary" />
                <h3 className="text-base font-semibold">Cambiar contraseña</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                Si queda vacío, no se modifica
              </span>
            </div>
            <div className="space-y-4 rounded-xl border p-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={passwordVisibility.current ? "text" : "password"}
                    value={passwordData.current}
                    onChange={(e) => handlePasswordChange("current", e.target.value)}
                    placeholder="Solo requerida si vas a cambiar la contraseña"
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={passwordVisibility.current ? "Ocultar contraseña" : "Mostrar contraseña"}
                    disabled={isLoading}
                  >
                    {passwordVisibility.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={passwordVisibility.next ? "text" : "password"}
                    value={passwordData.next}
                    onChange={(e) => handlePasswordChange("next", e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("next")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={passwordVisibility.next ? "Ocultar contraseña" : "Mostrar contraseña"}
                    disabled={isLoading}
                  >
                    {passwordVisibility.next ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={passwordVisibility.confirm ? "text" : "password"}
                    value={passwordData.confirm}
                    onChange={(e) => handlePasswordChange("confirm", e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={passwordVisibility.confirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                    disabled={isLoading}
                  >
                    {passwordVisibility.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {shouldUpdatePassword && (
                <p className="text-xs text-muted-foreground">
                  Se actualizarán también tus credenciales cuando guardes.
                </p>
              )}
            </div>
          </section>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !profileData.address || !profileData.phone}
            >
              <Save className="size-4 mr-2" />
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
