"use client"

import { updateUserPassword } from "@/api/clients/usersApi"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Eye, EyeOff, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface PasswordVisibility {
    current: boolean
    new: boolean
    confirm: boolean
}

export default function EditProfilePage() {
    const { user } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    })

    const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibility>({
        current: false,
        new: false,
        confirm: false
    })

    const [isLoading, setIsLoading] = useState(false)

    const togglePasswordVisibility = (field: keyof PasswordVisibility) => {
        setPasswordVisibility(prev => ({
            ...prev,
            [field]: !prev[field]
        }))
    }

    const handlePasswordChange = (field: string, value: string) => {
        setPasswords(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const validatePasswords = (): boolean => {
        if (!passwords.current.trim()) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "La contraseña actual es requerida"
            })
            return false
        }

        if (!passwords.new.trim()) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "La nueva contraseña es requerida"
            })
            return false
        }

        if (passwords.new.length < 6) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "La nueva contraseña debe tener al menos 6 caracteres"
            })
            return false
        }

        if (passwords.new !== passwords.confirm) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Las contraseñas nuevas no coinciden"
            })
            return false
        }

        if (passwords.current === passwords.new) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "La nueva contraseña debe ser diferente a la actual"
            })
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validatePasswords()) return
        if (!user) return

        setIsLoading(true)

        try {
            await updateUserPassword({
                userId: user.id,
                currentPassword: passwords.current,
                newPassword: passwords.new
            })

            toast({
                title: "Éxito",
                description: "Contraseña actualizada correctamente"
            })

            // Limpiar formulario
            setPasswords({ current: "", new: "", confirm: "" })

            // Redirigir después de un breve delay
            setTimeout(() => {
                router.push('/settings')
            }, 1500)

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Error al actualizar la contraseña"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        router.back()
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-background">
            <MobileHeader
                title="Editar Perfil"
                showBack
                onBack={handleCancel}
            />

            <div className="container-centered py-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Save className="h-5 w-5" />
                            Cambiar Contraseña
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Contraseña Actual */}
                            <div className="space-y-2">
                                <Label htmlFor="current-password">
                                    Contraseña Actual <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="current-password"
                                        type={passwordVisibility.current ? "text" : "password"}
                                        value={passwords.current}
                                        onChange={(e) => handlePasswordChange("current", e.target.value)}
                                        placeholder="Ingresa tu contraseña actual"
                                        disabled={isLoading}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("current")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        disabled={isLoading}
                                    >
                                        {passwordVisibility.current ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Nueva Contraseña */}
                            <div className="space-y-2">
                                <Label htmlFor="new-password">
                                    Nueva Contraseña <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={passwordVisibility.new ? "text" : "password"}
                                        value={passwords.new}
                                        onChange={(e) => handlePasswordChange("new", e.target.value)}
                                        placeholder="Ingresa la nueva contraseña"
                                        disabled={isLoading}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("new")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        disabled={isLoading}
                                    >
                                        {passwordVisibility.new ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    La contraseña debe tener al menos 6 caracteres
                                </p>
                            </div>

                            {/* Confirmar Nueva Contraseña */}
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">
                                    Confirmar Nueva Contraseña <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={passwordVisibility.confirm ? "text" : "password"}
                                        value={passwords.confirm}
                                        onChange={(e) => handlePasswordChange("confirm", e.target.value)}
                                        placeholder="Confirma la nueva contraseña"
                                        disabled={isLoading}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("confirm")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        disabled={isLoading}
                                    >
                                        {passwordVisibility.confirm ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
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
                                    disabled={isLoading || !passwords.current || !passwords.new || !passwords.confirm}
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
