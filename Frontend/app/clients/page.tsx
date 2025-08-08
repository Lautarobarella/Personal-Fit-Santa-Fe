"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useClients } from "@/hooks/use-client"
import { ClientDetailsDialog } from "@/components/clients/details-client-dialog"
import { Plus, Search, MoreVertical, Loader2 } from "lucide-react"
import Link from "next/link"
import { BottomNav } from "@/components/ui/bottom-nav"

export default function ClientsPage() {

  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const {
    clients,
    loading,
    error,
    loadClients,
    deleteClient,
  } = useClients()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active")
  const [clientDetailsDialog, setClientDetailsDialog] = useState<{
    open: boolean
    userId: number | null
  }>({ open: false, userId: null })

  useEffect(() => {
    loadClients()
  }, [loadClients])

  if (!user || user.role === "client") {
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date))
  }

  const handleClientDetails = (userId: number) => setClientDetailsDialog({ open: true, userId })

  const handleEditClient = (userId: number) => {
    router.push(`/clients/${userId}`)
  }

  const handleDeleteClient = async (userId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
      try {
        await deleteClient(userId)
        toast({
          title: "Cliente eliminado",
          description: "El cliente ha sido eliminado exitosamente",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el cliente",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Clientes" showBack={false} />

      <div className="container-centered py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""} encontrado{filteredClients.length !== 1 ? "s" : ""}
            </p>
          </div>
          {user.role === "admin" && (
            <Link href="/clients/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cliente
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Activos
            </Button>
            <Button
              variant={statusFilter === "inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("inactive")}
            >
              Inactivos
            </Button>
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Todos
            </Button>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {`${client.firstName[0] ?? ""}${client.lastName[0] ?? ""}`}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {client.firstName} {client.lastName}
                        </h3>
                        <Badge variant={client.status === "active" ? "default" : "secondary"}>
                          {client.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-blue-600 font-medium">{client.activitiesCount} actividades</span>
                        <span className="text-muted-foreground">
                          Desde {client.joinDate ? formatDate(new Date(client.joinDate)) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleClientDetails(client.id)}>
                        Ver Detalles
                      </DropdownMenuItem>
                      {user.role === "admin" && (
                        <>
                          <DropdownMenuItem onClick={() => handleEditClient(client.id)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            Eliminar
                          </DropdownMenuItem>
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

      {/* Client Details Dialog */}
      {clientDetailsDialog.userId && (
        <ClientDetailsDialog
          open={clientDetailsDialog.open}
          onOpenChange={(open) => setClientDetailsDialog({ open, userId: open ? clientDetailsDialog.userId : null })}
          userId={clientDetailsDialog.userId}
          onEdit={() => {
            setClientDetailsDialog({ open: false, userId: null })
            if (clientDetailsDialog.userId) {
              handleEditClient(clientDetailsDialog.userId)
            }
          }}
          onDeactivate={() => {
            setClientDetailsDialog({ open: false, userId: null })
            if (clientDetailsDialog.userId) {
              handleDeleteClient(clientDetailsDialog.userId)
            }
          }}
        />
      )}
      <BottomNav />
    </div>
  )
}
