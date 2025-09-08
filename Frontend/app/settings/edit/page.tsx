"use client"

import { updateUserProfile } from "@/api/clients/usersApi"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useToast } from "@/hooks/use-toast"
import { Save, User, Shield, UserRoundPen } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function EditProfilePage() {
    const { refreshUser } = useAuth()
    const { user } = useRequireAuth()
    const router = useRouter()
    const { toast } = useToast()

    const [profileData, setProfileData] = useState({
        address: "",
        phone: "",
        emergencyPhone: ""
    })

    const [isLoading, setIsLoading] = useState(false)

    // Cargar datos actuales del usuario
    useEffect(() => {
        if (user) {
            setProfileData({
                address: user.address || "",
                phone: user.phone || "",
                emergencyPhone: user.emergencyPhone || ""
            })
        }
    }, [user])

    const handleInputChange = (field: string, value: string) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const validateForm = (): boolean => {
        if (!profileData.phone.trim()) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "El teléfono es requerido"
            })
            return false
        }

        if (!profileData.address.trim()) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "La dirección es requerida"
            })
            return false
        }

        // Validación básica de formato de teléfono (solo números y algunos caracteres permitidos)
        const phoneRegex = /^[0-9\s\-\+\(\)]+$/
        if (!phoneRegex.test(profileData.phone)) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "El formato del teléfono no es válido"
            })
            return false
        }

        if (profileData.emergencyPhone && !phoneRegex.test(profileData.emergencyPhone)) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "El formato del teléfono de emergencia no es válido"
            })
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return
        if (!user) return

        setIsLoading(true)

        try {
            await updateUserProfile({
                userId: user.id,
                address: profileData.address,
                phone: profileData.phone,
                emergencyPhone: profileData.emergencyPhone || undefined
            })

            toast({
                title: "Éxito",
                description: "Datos actualizados correctamente"
            })

            // Actualizar datos del usuario en el contexto
            await refreshUser()

            // Redirigir después de un breve delay
            setTimeout(() => {
                router.push('/settings')
            }, 1500)

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Error al actualizar los datos"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        router.back()
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
