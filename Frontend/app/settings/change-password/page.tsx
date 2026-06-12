"use client"

import { useChangePassword } from "@/hooks/settings/use-change-password"
import { Button } from "@/components/ui/button"
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
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="rounded-xl border p-4">
                        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
                            <LockKeyhole className="size-5 shrink-0 text-primary" />
                            Cambiar Contraseña
                        </h2>

                        <div className="space-y-4">
                            {/* Contraseña Actual */}
                            <div className="space-y-2">
                                <Label htmlFor="current-password">
                                    Contraseña Actual <span className="text-destructive">*</span>
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
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Nueva Contraseña */}
                            <div className="space-y-2">
                                <Label htmlFor="new-password">
                                    Nueva Contraseña <span className="text-destructive">*</span>
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
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                                    La contraseña debe tener al menos 6 caracteres
                                </p>
                            </div>

                            {/* Confirmar Nueva Contraseña */}
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">
                                    Confirmar Nueva Contraseña <span className="text-destructive">*</span>
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
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-row items-center gap-2 pt-1">
                        <Button
                            type="button"
                            variant="ghost"
                            className="min-w-0 flex-1"
                            onClick={handleCancel}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="min-w-0 flex-1"
                            disabled={isLoading || !passwords.current || !passwords.new || !passwords.confirm}
                        >
                            <LockKeyhole className="mr-2 size-4 shrink-0 max-sm:hidden" />
                            {isLoading ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
