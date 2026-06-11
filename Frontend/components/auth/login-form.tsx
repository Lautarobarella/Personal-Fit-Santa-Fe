"use client"

import Image from "next/image"

import { DatePickerBirthdate } from "@/components/ui/date-picker-birthdate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useLoginForm } from "@/hooks/auth/use-login-form"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)

  const {
    activeTab,
    setActiveTab,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleLoginSubmit,
    registrationForm,
    registrationErrors,
    isRegistering,
    handleRegistrationInputChange,
    handleRegistrationSubmit,
  } = useLoginForm()

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/logo.svg"
              alt="Personal Fit Santa Fe"
              width={150}
              height={60}
              priority
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {activeTab === "login"
              ? "Ingresa a tu cuenta para continuar"
              : "Completa el formulario para solicitar validación de usuario"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Crear Usuario</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-4 rounded-xl border p-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Iniciar Sesión
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegistrationSubmit} className="space-y-5">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-5 w-1 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold">Datos personales</h3>
                </div>
                <div className="space-y-4 rounded-xl border p-4">
                  <div className="space-y-2">
                    <Label htmlFor="dni">
                      DNI <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="dni"
                      value={registrationForm.dni}
                      onChange={(e) => handleRegistrationInputChange("dni", e.target.value)}
                      placeholder="12345678"
                      className={registrationErrors.dni ? "border-error" : ""}
                    />
                    {registrationErrors.dni && <p className="text-sm text-error">{registrationErrors.dni}</p>}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        Nombre <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={registrationForm.firstName}
                        onChange={(e) => handleRegistrationInputChange("firstName", e.target.value)}
                        placeholder="Nombre"
                        className={registrationErrors.firstName ? "border-error" : ""}
                      />
                      {registrationErrors.firstName && <p className="text-sm text-error">{registrationErrors.firstName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Apellido <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={registrationForm.lastName}
                        onChange={(e) => handleRegistrationInputChange("lastName", e.target.value)}
                        placeholder="Apellido"
                        className={registrationErrors.lastName ? "border-error" : ""}
                      />
                      {registrationErrors.lastName && <p className="text-sm text-error">{registrationErrors.lastName}</p>}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
                  <h3 className="text-sm font-semibold">Datos de contacto</h3>
                </div>
                <div className="space-y-4 rounded-xl border p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="registerEmail">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="registerEmail"
                        type="email"
                        value={registrationForm.email}
                        onChange={(e) => handleRegistrationInputChange("email", e.target.value)}
                        placeholder="email@email.com"
                        className={registrationErrors.email ? "border-error" : ""}
                      />
                      {registrationErrors.email && <p className="text-sm text-error">{registrationErrors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Teléfono <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={registrationForm.phone}
                        onChange={(e) => handleRegistrationInputChange("phone", e.target.value)}
                        placeholder="+54 342 1234567"
                        className={registrationErrors.phone ? "border-error" : ""}
                      />
                      {registrationErrors.phone && <p className="text-sm text-error">{registrationErrors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Teléfono de Emergencia</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={registrationForm.emergencyPhone || ""}
                        onChange={(e) => handleRegistrationInputChange("emergencyPhone", e.target.value)}
                        placeholder="+54 342 7654321"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate">
                        Fecha de Nacimiento <span className="text-destructive">*</span>
                      </Label>
                      <DatePickerBirthdate
                        value={registrationForm.birthDate}
                        onChange={(date) => handleRegistrationInputChange("birthDate", date)}
                      />
                      {registrationErrors.birthDate && <p className="text-sm text-error">{registrationErrors.birthDate}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Dirección <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      value={registrationForm.address}
                      onChange={(e) => handleRegistrationInputChange("address", e.target.value)}
                      placeholder="Calle, número, ciudad"
                      rows={2}
                      className={registrationErrors.address ? "border-error" : ""}
                    />
                    {registrationErrors.address && <p className="text-sm text-error">{registrationErrors.address}</p>}
                  </div>
                </div>
              </section>

              <Button type="submit" className="w-full" disabled={isRegistering}>
                {isRegistering && <Loader2 className="mr-2 size-4 animate-spin" />}
                Solicitar Validación
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
