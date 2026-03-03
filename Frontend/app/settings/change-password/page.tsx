"use client"

import { useChangePassword } from "@/hooks/settings/use-change-password"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Eye, EyeOff, LockKeyhole } from "lucide-react"

export default function ChangePasswordPage() {
    const {
        passwords,
        passwordVisibility,
        isLoading,
        togglePasswordVisibility,
        handlePasswordChange,
        handleSubmit,
        handleCancel,
    } = useChangePassword()

    return (
        <div className="min-h-screen bg-background">
            <MobileHeader
                title="Cambiar Contraseña"
                showBack
                onBack={handleCancel}
            />

            <div className="container-centered py-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LockKeyhole className="h-5 w-5" />
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
                                    <LockKeyhole className="h-4 w-4 mr-2" />
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
