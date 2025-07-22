"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Search, Phone, Mail, MoreVertical, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { mockUsers } from "@/mocks/mockUsers"
import Link from "next/link"
import { ClientDetailsDialog } from "@/components/clients/details-client-dialog"
import { mockActivities } from "@/mocks/mockActivities"

export default function ClientsPage() {
  const { user } = useAuth()
  const [clients] = useState(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientDetailsDialog, setClientDetailsDialog] = useState<{
    open: boolean
    user: (typeof mockUsers)[0] | null
  }>({ open: false, user: null })

  if (!user || user.role === "client") {
    return <div>No tienes permisos para ver esta página</div>
  }

  const filteredClients = clients.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  } 
  
  const handleClientDetails = (user: (typeof mockUsers)[0]) => setClientDetailsDialog({ open: true, user })

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader
        title="Clientes"
        actions={
          user.role === "admin" ? (
            <Link href="/clients/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nuevo
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="container py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {clients.filter((c) => c.status === "active").length}
              </div>
              <div className="text-sm text-muted-foreground">Activos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {clients.filter((c) => c.status === "inactive").length}
              </div>
              <div className="text-sm text-muted-foreground">Inactivos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
        <div className="space-y-3">
          {filteredClients.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{user.name}</h3>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {user.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Última actividad: {user.lastActivity ? formatDate(user?.lastActivity) : "no ha realizado ninguna actividad"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-blue-600 font-medium">{user.activitiesCount} actividades</span>
                      <span className="text-muted-foreground">Desde {formatDate(user.joinDate)}</span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleClientDetails(user)}>Ver Detalles</DropdownMenuItem>
                      {user.role === "admin" && (
                        <>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground mb-4">
                {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
              </div>
              {user.role === "admin" && !searchTerm && (
                <Link href="/clients/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Cliente
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {/* dialog */}
      {clientDetailsDialog.user && (
        <ClientDetailsDialog
          open={clientDetailsDialog.open}
          onOpenChange={(open) => setClientDetailsDialog({ open, user: null })}
          user={clientDetailsDialog.user}
          activities={mockActivities || []}
          payments={[]}
        />
      )}
      <BottomNav />
    </div>
  )
}
