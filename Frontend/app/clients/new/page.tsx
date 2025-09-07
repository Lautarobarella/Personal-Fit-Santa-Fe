"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerScroll } from "@/components/ui/date-picker-scroll"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useClients } from "@/hooks/clients/use-client"
import { useToast } from "@/hooks/use-toast"
import { UserFormType } from "@/lib/types"
import { Loader2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BottomNav } from "@/components/ui/bottom-nav"


export default function NewClientPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  // Use custom hook to redirect to login if not authenticated
  useRequireAuth()
  const { form, setForm, createClient } = useClients()

  const [errors, setErrors] = useState<Partial<UserFormType>>({})

  if (!user || user.role !== UserRole.ADMIN) {
    return <div>No tienes permisos para crear clientes</div>
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormType> = {}

    if (!form.dni.trim()) newErrors.dni = "El DNI es requerido"
    if (!form.firstName.trim()) newErrors.firstName = "El nombre es requerido"
    if (!form.lastName.trim()) newErrors.lastName = "El nombre es requerido"
    if (!form.email.trim()) newErrors.email = "El email es requerido"
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Email inválido"
    if (!form.phone.trim()) newErrors.phone = "El teléfono es requerido"
    if (!form.birthDate) newErrors.birthDate = "La fecha de nacimiento es requerida"
    if (!form.address.trim()) newErrors.address = "La dirección es requerida"
    if (!form.password.trim()) newErrors.password = "La contraseña es requerida"
    
    // Validate age (must be at least 16)
    if (form.birthDate) {
      const birthDate = new Date(form.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 16) {
        newErrors.birthDate = "El cliente debe tener al menos 16 años"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    form.password = form.dni.toString()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await createClient(form)
      toast({
        title: "Éxito",
        description: response?.message || "El cliente ha sido registrado exitosamente",
      })
      router.push("/clients")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserFormType, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="min-h-screen bg-background mb-32">
      <MobileHeader title="Nuevo Cliente" showBack onBack={() => router.back()} />

      <div className="container-centered py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Registrar Nuevo Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información Personal</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">DNI</Label>
                  <Input
                    id="dni"
                    value={form.dni}
                    onChange={(e) => handleInputChange("dni", e.target.value)}
                    placeholder="123456789"
                    className={errors.dni ? "border-error" : ""}
                  />
                  {errors.dni && <p className="text-sm text-error">{errors.dni}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Nombre"
                    className={errors.firstName ? "border-error" : ""}
                  />
                  {errors.firstName && <p className="text-sm text-error">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Apellido"
                    className={errors.firstName ? "border-error" : ""}
                  />
                  {errors.firstName && <p className="text-sm text-error">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="email@email.com"
                    className={errors.email ? "border-error" : ""}
                  />
                  {errors.email && <p className="text-sm text-error">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+34 666 123 456"
                    className={errors.phone ? "border-error" : ""}
                  />
                  {errors.phone && <p className="text-sm text-error">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Teléfono de Emergencia</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={form.emergencyPhone || ""}
                    onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                    placeholder="342 666 789012"
                    className={errors.emergencyPhone ? "border-error" : ""}
                  />
                  {errors.emergencyPhone && <p className="text-sm text-error">{errors.emergencyPhone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <DatePickerScroll
                    value={form.birthDate}
                    onChange={(date) => handleInputChange("birthDate", date)}
                  />
                  {errors.birthDate && <p className="text-sm text-error">{errors.birthDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Calle, número, ciudad, código postal"
                    rows={2}
                  />
                  {errors.address && <p className="text-sm text-error">{errors.address}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="trainer">Rol</Label>
                    <Select value={form.role} onValueChange={(value) => handleInputChange("role", value)}>
                      <SelectTrigger className={errors.role ? "border-error" : ""}>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.CLIENT}>Cliente</SelectItem>
                        <SelectItem value={UserRole.TRAINER}>Entrenador</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-sm text-error">{errors.role}</p>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} onClick={handleSubmit} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Cliente
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
