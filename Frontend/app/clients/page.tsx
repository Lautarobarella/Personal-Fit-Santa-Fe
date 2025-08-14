"use client"

import { ClientDetailsDialog } from "@/components/clients/details-client-dialog"
import { useAuth } from "@/components/providers/auth-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useClients } from "@/hooks/use-client"
import { UserRole } from "@/lib/types"
import { Calendar, Loader2, Mail, MoreVertical, Phone, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function ClientsPage() {

  const { user } = useAuth()
  const {
    clients,
    loading,
    error,
    loadClients,
  } = useClients()
  const [searchTerm, setSearchTerm] = useState("")

  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "all">("ACTIVE")

  const [clientDetailsDialog, setClientDetailsDialog] = useState<{
    open: boolean
    userId: number | null
  }>({ open: false, userId: null })

  useEffect(() => {
    loadClients()
  }, [loadClients])

  if (!user || user.role === UserRole.CLIENT) {
    return <div>No tienes permisos para ver esta página</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) return <div>{error}</div>
  if (!clients) return null

  const filteredClients = clients
    .filter((c) =>
      (statusFilter === "all" ? true : c.status === statusFilter) &&
      (
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )


  const formatDate = (date: Date | string | null) => {

    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date ?? "N/A"))
  }

  const handleClientDetails = (userId: number) => setClientDetailsDialog({ open: true, userId })

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader
        title="Clientes"
        actions={
          user.role === UserRole.ADMIN ? (
            <Link href="/clients/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nuevo
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="container-centered py-6 space-y-4">
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

        <div className="grid grid-cols-3 gap-4">
          <button
            className={`rounded-2xl transition-all duration-200 ${statusFilter === "ACTIVE" ? "ring-2 ring-green-500/50 bg-green-500/10" : "hover:bg-muted/50"} focus:outline-none`}
            onClick={() => setStatusFilter("ACTIVE")}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {clients.filter((c) => c.status === "ACTIVE").length}
                </div>
                <div className="text-sm text-muted-foreground">Activos</div>
              </CardContent>
            </Card>
          </button>
          <button
            className={`rounded-2xl transition-all duration-200 ${statusFilter === "INACTIVE" ? "ring-2 ring-orange-500/50 bg-orange-500/10" : "hover:bg-muted/50"} focus:outline-none`}
            onClick={() => setStatusFilter("INACTIVE")}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {clients.filter((c) => c.status === "INACTIVE").length}
                </div>
                <div className="text-sm text-muted-foreground">Inactivos</div>
              </CardContent>
            </Card>
          </button>
          <button
            className={`rounded-2xl transition-all duration-200 ${statusFilter === "all" ? "ring-2 ring-blue-500/50 bg-blue-500/10" : "hover:bg-muted/50"} focus:outline-none`}
            onClick={() => setStatusFilter("all")}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Client List */}
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <Card key={client.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {`${client.firstName[0] ?? ""}${client.lastName[0] ?? ""}`}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{client.firstName + " " + client.lastName}</h3>
                      <Badge variant={client.status === "ACTIVE" ? "default" : "secondary"}>
                        {client.role === UserRole.CLIENT
                          ? client.status === "ACTIVE"
                            ? "Activo"
                            : "Inactivo"
                          : client.role === UserRole.TRAINER
                            ? client.status === "ACTIVE"
                              ? "Entrenador"
                              : "Inactivo"
                            : "Desconocido"}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Última actividad: {client.lastActivity ? formatDate(client?.lastActivity) : "no ha realizado ninguna actividad"}</span>
                      </div>
                    </div>
                  </div>
                  {/*
                    Yo quitaría esto porque ocupa demasiado espacio los clientes, y no me parece relevante
                      si quiere acceder a los detalles del cliente, cuando se unió y cuantas actividades realizó
                      que entre a los detalles del cliente. Además, por como está estilado, "actividades" parece
                      clickeable, y no lo es.
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-blue-600 font-medium">{client.activitiesCount} actividades</span>
                      <span className="text-muted-foreground">Desde {formatDate(client.joinDate)}</span>
                    </div>
                  </div> */}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleClientDetails(client.id)}>Ver Detalles</DropdownMenuItem>
                      {user.role === UserRole.ADMIN && (
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
                {searchTerm ? "No se encontraron clientes" : "No hay clientes activos"}
              </div>
              {user.role === UserRole.ADMIN && !searchTerm && clients.length === 0 && (
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
      {clientDetailsDialog.userId && (
        <ClientDetailsDialog
          open={clientDetailsDialog.open}
          onOpenChange={(open) => setClientDetailsDialog({ open, userId: null })}
          userId={clientDetailsDialog.userId}
        />
      )}
      <BottomNav />
    </div>
  )
}
