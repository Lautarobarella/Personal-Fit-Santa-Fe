"use client"

import { useSettingsEdit } from "@/hooks/settings/use-settings-edit"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Save, User, Shield, UserRoundPen } from "lucide-react"

export default function EditProfilePage() {
    const {
        user,
        profileData,
        isLoading,
        handleInputChange,
        handleSubmit,
        handleCancel,
    } = useSettingsEdit()

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
                            {/* Información no editable */}
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
                                            {user?.birthDate 
                                                ? new Date(user.birthDate).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : 'No especificada'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Datos editables */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                                    <UserRoundPen className="h-4 w-4" />
                                    Datos de contacto 
                                </h3>
                                
                                {/* Dirección */}
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

                            {/* Teléfono */}
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

                            {/* Teléfono de Emergencia */}
                            <div className="space-y-2">
                                <Label htmlFor="emergency-phone">
                                    Teléfono de Emergencia
                                </Label>
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

                            {/* Botones */}
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
