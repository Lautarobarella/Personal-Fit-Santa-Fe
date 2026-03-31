"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useSettingsEdit } from "@/hooks/settings/use-settings-edit"
import { Eye, EyeOff, LockKeyhole, Save, Shield, User, UserRoundPen } from "lucide-react"
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

  return (
    <div className="min-h-screen bg-background mb-32">
      <MobileHeader
        title="Editar Perfil"
        showBack
        onBack={handleCancel}
      />

      <div className="container-centered py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Información de la cuenta
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nombre</Label>
                    <p className="text-sm font-medium">{user?.firstName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Apellido</Label>
                    <p className="text-sm font-medium">{user?.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">DNI</Label>
                    <p className="text-sm font-medium">{user?.dni}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Fecha de nacimiento</Label>
                    <p className="text-sm font-medium">
                      {formatDate(user?.birthDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <UserRoundPen className="h-4 w-4" />
                  Datos de contacto
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Dirección <span className="text-red-500">*</span>
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
                    Teléfono <span className="text-red-500">*</span>
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

              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4" />
                    Cambiar contraseña
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Si queda vacío, no se modifica
                  </span>
                </div>

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
                      {passwordVisibility.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                      {passwordVisibility.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                      {passwordVisibility.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {shouldUpdatePassword && (
                  <p className="text-xs text-muted-foreground">
                    Se actualizarán también tus credenciales cuando guardes.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
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
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
