"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Phone, Mail, Calendar, MapPin, Edit, Clock, Target, AlertTriangle } from "lucide-react"
import Link from "next/link"

// Mock client data
const mockClient = {
  id: "1",
  name: "María González",
  email: "maria@email.com",
  phone: "+34 666 123 456",
  dateOfBirth: "1990-05-15",
  address: "Calle Mayor 123, Madrid, 28001",
  emergencyContact: "Juan González",
  emergencyPhone: "+34 666 654 321",
  medicalConditions: "Alergia al polen",
  fitnessGoals: "Perder peso y mejorar resistencia cardiovascular",
  experienceLevel: "intermediate",
  preferredSchedule: "morning",
  status: "active",
  joinDate: new Date("2024-01-01"),
  activitiesCount: 5,
  lastActivity: new Date("2024-01-14"),
}

const mockActivities = [
  {
    id: "1",
    name: "Yoga Matutino",
    date: new Date("2024-01-15T09:00:00"),
    status: "enrolled",
    attendance: "present",
  },
  {
    id: "2",
    name: "CrossFit Avanzado",
    date: new Date("2024-01-12T18:00:00"),
    status: "completed",
    attendance: "present",
  },
  {
    id: "3",
    name: "Pilates Intermedio",
    date: new Date("2024-01-10T10:00:00"),
    status: "completed",
    attendance: "absent",
  },
]

const mockPayments = [
  {
    id: "1",
    activityName: "Yoga Matutino",
    amount: 25,
    date: new Date("2024-01-14"),
    status: "completed",
    method: "card",
  },
  {
    id: "2",
    activityName: "CrossFit Avanzado",
    amount: 35,
    date: new Date("2024-01-11"),
    status: "completed",
    method: "cash",
  },
  {
    id: "3",
    activityName: "Pilates Intermedio",
    amount: 30,
    date: new Date("2024-01-15"),
    status: "pending",
    method: "transfer",
  },
]

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [client] = useState(mockClient)
  const [activities] = useState(mockActivities)
  const [payments] = useState(mockPayments)

  if (!user || (user.role !== "admin" && user.role !== "trainer")) {
    return <div>No tienes permisos para ver este perfil</div>
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const getExperienceLevel = (level: string) => {
    switch (level) {
      case "beginner":
        return "Principiante"
      case "intermediate":
        return "Intermedio"
      case "advanced":
        return "Avanzado"
      default:
        return level
    }
  }

  const getPreferredSchedule = (schedule: string) => {
    switch (schedule) {
      case "morning":
        return "Mañana (6:00 - 12:00)"
      case "afternoon":
        return "Tarde (12:00 - 18:00)"
      case "evening":
        return "Noche (18:00 - 22:00)"
      case "flexible":
        return "Flexible"
      default:
        return schedule
    }
  }

  const completedActivities = activities.filter((a) => a.status === "completed")
  const attendanceRate =
    completedActivities.length > 0
      ? Math.round(
          (completedActivities.filter((a) => a.attendance === "present").length / completedActivities.length) * 100,
        )
      : 0

  const totalSpent = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader
        title="Perfil del Cliente"
        showBack
        onBack={() => router.back()}
        actions={
          user.role === "admin" ? (
            <Link href={`/clients/${client.id}/edit`}>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="container py-6 space-y-6">
        {/* Client Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold">{client.name}</h1>
                  <Badge variant={client.status === "active" ? "default" : "secondary"}>
                    {client.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Cliente desde {formatDate(client.joinDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{client.activitiesCount}</div>
              <div className="text-sm text-muted-foreground">Actividades</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{attendanceRate}%</div>
              <div className="text-sm text-muted-foreground">Asistencia</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">${totalSpent}</div>
              <div className="text-sm text-muted-foreground">Gastado</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="activities">Actividades</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Edad:</span>
                    <p className="font-medium">{calculateAge(client.dateOfBirth)} años</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha de nacimiento:</span>
                    <p className="font-medium">{formatDate(new Date(client.dateOfBirth))}</p>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground text-sm">Dirección:</span>
                  <p className="font-medium flex items-start gap-1">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    {client.address}
                  </p>
                </div>

                <Separator />

                <div>
                  <span className="text-muted-foreground text-sm">Contacto de emergencia:</span>
                  <div className="mt-1 space-y-1">
                    <p className="font-medium">{client.emergencyContact}</p>
                    <p className="text-sm text-muted-foreground">{client.emergencyPhone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health & Fitness Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Salud y Fitness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-muted-foreground text-sm">Nivel de experiencia:</span>
                  <p className="font-medium">{getExperienceLevel(client.experienceLevel)}</p>
                </div>

                <div>
                  <span className="text-muted-foreground text-sm">Horario preferido:</span>
                  <p className="font-medium">{getPreferredSchedule(client.preferredSchedule)}</p>
                </div>

                <div>
                  <span className="text-muted-foreground text-sm">Objetivos de fitness:</span>
                  <p className="font-medium">{client.fitnessGoals}</p>
                </div>

                {client.medicalConditions && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-orange-800">Condiciones médicas:</span>
                        <p className="text-sm text-orange-700">{client.medicalConditions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-3 mt-4">
            {activities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{activity.name}</h3>
                    <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                      {activity.status === "completed" ? "Completada" : "Inscrita"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(activity.date)}</span>
                    </div>
                    {activity.status === "completed" && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className={activity.attendance === "present" ? "text-green-600" : "text-red-600"}>
                          {activity.attendance === "present" ? "Presente" : "Ausente"}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="payments" className="space-y-3 mt-4">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{payment.activityName}</h3>
                    <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                      {payment.status === "completed" ? "Pagado" : "Pendiente"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{formatDate(payment.date)}</span>
                      <span className="capitalize">{payment.method}</span>
                    </div>
                    <span className="font-bold text-lg">${payment.amount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
