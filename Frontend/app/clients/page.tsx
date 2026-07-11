"use client"

import { ClientDetailsDialog } from "@/components/clients/details-client-dialog"
import { CreateInactivePaymentsDialog } from "@/components/clients/create-inactive-payments-dialog"
import { ExportClientsDialog } from "@/components/clients/export-clients-dialog"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useClientsPage } from "@/hooks/clients/use-clients-page"
import { UserRole } from "@/types"
import { Banknote, Calendar, ClipboardList, Loader2, Mail, MoreVertical, Phone, Plus, Search, UserCheck } from "lucide-react"
import Link from "next/link"

export default function ClientsPage() {
  const {
    user,
    router,
    clients,
    loading,
    error,
    filteredClients,
    pendingVerificationCount,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    clientDetailsDialog,
    setClientDetailsDialog,
    exportListOpen,
    setExportListOpen,
    deleteDialog,
    setDeleteDialog,
    isDeleting,
    resetPasswordDialog,
    setResetPasswordDialog,
    isResettingPassword,
    paymentSelectionMode,
    selectedPaymentClients,
    selectedPaymentClientIds,
    eligiblePaymentClientsCount,
    paymentConfirmOpen,
    setPaymentConfirmOpen,
    isCreatingInactivePayments,
    monthlyFee,
    isClientEligibleForPayment,
    getPaymentIneligibilityReason,
    startPaymentSelection,
    cancelPaymentSelection,
    togglePaymentClientSelection,
    handleOpenPaymentConfirm,
    handleConfirmCreatePayments,
    formatDate,
    handleClientDetails,
    handleOpenDeleteDialog,
    handleConfirmDelete,
    handleOpenResetPasswordDialog,
    handleConfirmResetPassword,
  } = useClientsPage()

  if (!user || user.role === UserRole.CLIENT || user.role === UserRole.TRAINER) {
    return <div>No tienes permisos para ver esta página</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div>{error}</div>
  }
  if (!clients) {
    return null
  }

  const activeClientsCount = clients.filter((c) => c.role === UserRole.CLIENT && c.status === "ACTIVE").length
  const inactiveClientsCount = clients.filter((c) => c.role === UserRole.CLIENT && c.status === "INACTIVE").length
  const selectedPaymentClientIdSet = new Set(selectedPaymentClientIds)

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <MobileHeader
        title="Clientes"
        actions={
          user.role === UserRole.ADMIN ? (
            <div className="flex items-center gap-2">
              <Link href="/clients/verify">
              </Link>
              <Link href="/clients/new">
                <Button size="sm">
                  <Plus className="size-4 mr-1" />
                  Nuevo
                </Button>
              </Link>
            </div>
          ) : null
        }
      />

      <div className="container-centered py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros por estado — panel único con divisores */}
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-3 divide-x">
            <button
              type="button"
              className={`px-3 py-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${statusFilter === "ACTIVE" ? "bg-green-500/10" : "hover:bg-muted/40"}`}
              onClick={() => setStatusFilter("ACTIVE")}
            >
              <div className="text-2xl font-semibold text-green-600">{activeClientsCount}</div>
              <div className="text-sm text-muted-foreground">Activos</div>
            </button>
            <button
              type="button"
              className={`px-3 py-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${statusFilter === "INACTIVE" ? "bg-primary/10" : "hover:bg-muted/40"}`}
              onClick={() => setStatusFilter("INACTIVE")}
            >
              <div className="text-2xl font-semibold text-primary">{inactiveClientsCount}</div>
              <div className="text-sm text-muted-foreground">Inactivos</div>
            </button>
            <button
              type="button"
              className={`px-3 py-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${statusFilter === "all" ? "bg-muted/60" : "hover:bg-muted/40"}`}
              onClick={() => setStatusFilter("all")}
            >
              <div className="text-2xl font-semibold">{clients.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </button>
          </div>
        </div>

        {/* Acciones de la solapa: carga rápida de pagos (solo ADMIN, en
            Inactivos) y exportar listado */}
        {paymentSelectionMode ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedPaymentClients.length}{" "}
              {selectedPaymentClients.length === 1 ? "seleccionado" : "seleccionados"}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={cancelPaymentSelection}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleOpenPaymentConfirm} disabled={selectedPaymentClients.length === 0}>
                Continuar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-4">
            {user.role === UserRole.ADMIN && statusFilter === "INACTIVE" && (
              <button
                type="button"
                onClick={startPaymentSelection}
                disabled={eligiblePaymentClientsCount === 0}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary disabled:pointer-events-none disabled:opacity-50"
              >
                <Banknote className="size-4" />
                Cargar pago
              </button>
            )}
            <button
              type="button"
              onClick={() => setExportListOpen(true)}
              disabled={filteredClients.length === 0}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary disabled:pointer-events-none disabled:opacity-50"
            >
              <ClipboardList className="size-4" />
              Generar listado
            </button>
          </div>
        )}

        {/* Client List — 1 columna en mobile, 2 en pantallas grandes */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {filteredClients.map((client) => (
            <div key={client.id} className="rounded-xl border p-4 transition-colors hover:bg-muted/40">
              {/* Encabezado: avatar + nombre + estado + menú */}
              <div className="flex items-center gap-3">
                {paymentSelectionMode && (
                  <Checkbox
                    checked={selectedPaymentClientIdSet.has(client.id) && isClientEligibleForPayment(client)}
                    onCheckedChange={() => togglePaymentClientSelection(client.id)}
                    disabled={!isClientEligibleForPayment(client)}
                    aria-label={`Seleccionar a ${client.firstName} ${client.lastName}`}
                    title={getPaymentIneligibilityReason(client) ?? undefined}
                    className="size-5 shrink-0"
                  />
                )}
                <UserAvatar
                  userId={client.id}
                  firstName={client.firstName}
                  lastName={client.lastName}
                  avatar={client.avatar}
                />

                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <h3 className="min-w-0 break-words font-medium">{client.firstName + " " + client.lastName}</h3>
                  <Badge variant={client.status === "ACTIVE" ? "default" : "secondary"} className="shrink-0">
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Opciones del cliente"
                      className="shrink-0 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleClientDetails(client.id)}>Ver Detalles</DropdownMenuItem>
                    {user.role === UserRole.ADMIN && (
                      <>
                        <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenResetPasswordDialog(client.id, `${client.firstName} ${client.lastName}`, client.dni ?? null)}
                        >
                          Reiniciar contraseña (DNI)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleOpenDeleteDialog(client.id, `${client.firstName} ${client.lastName}`)}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {paymentSelectionMode && !isClientEligibleForPayment(client) && (
                <p className="mt-2 text-xs text-muted-foreground">{getPaymentIneligibilityReason(client)}</p>
              )}

              {/* Contacto: a ancho completo desde la izquierda; el mail envuelve
                  en vez de truncarse */}
              <div className="mt-3 space-y-1 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-1 sm:space-y-0 lg:block lg:space-y-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="break-all">{client.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 shrink-0" />
                  <span>Última actividad: {client.lastActivity ? formatDate(client?.lastActivity) : "sin actividad"}</span>
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
              */}
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <div className="text-muted-foreground mb-4">
              {searchTerm ? "No se encontraron clientes" : "No hay clientes activos"}
            </div>
            {user.role === UserRole.ADMIN && !searchTerm && clients.length === 0 && (
              <Link href="/clients/new">
                <Button>
                  <Plus className="size-4 mr-2" />
                  Agregar Cliente
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
      {/* dialog */}
      {clientDetailsDialog.userId && (
        <ClientDetailsDialog
          _open={clientDetailsDialog.open}
          onOpenChange={(open) => setClientDetailsDialog({ open, userId: null })}
          userId={clientDetailsDialog.userId}
        />
      )}

      {/* Export client list dialog */}
      <ExportClientsDialog
        open={exportListOpen}
        onOpenChange={setExportListOpen}
        clients={filteredClients}
        statusFilter={statusFilter}
      />

      {/* Confirmación de carga rápida de pagos para inactivos */}
      <CreateInactivePaymentsDialog
        open={paymentConfirmOpen}
        onOpenChange={setPaymentConfirmOpen}
        clients={selectedPaymentClients}
        monthlyFee={monthlyFee}
        isSubmitting={isCreatingInactivePayments}
        onConfirm={handleConfirmCreatePayments}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !isDeleting && setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar a <strong>{deleteDialog.clientName}</strong>. Esta acción no se puede deshacer y{" "}
              <strong>se perderán todos los datos asociados al cliente</strong>, incluyendo pagos, asistencias y cualquier
              historial registrado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password confirmation dialog */}
      <AlertDialog
        open={resetPasswordDialog.open}
        onOpenChange={(open) => !isResettingPassword && setResetPasswordDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reiniciar contraseña del cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de reiniciar la contraseña de <strong>{resetPasswordDialog.clientName}</strong>.
              La nueva contraseña será su <strong>DNI ({resetPasswordDialog.clientDni ?? "sin DNI"})</strong> y esta acción
              <strong> no se puede volver atrás</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResettingPassword}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmResetPassword} disabled={isResettingPassword}>
              {isResettingPassword && <Loader2 className="mr-2 size-4 animate-spin" />}
              Reiniciar contraseña
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />

      {user.role === UserRole.ADMIN && pendingVerificationCount > 0 && (
        <Button
          className="fixed bottom-28 left-1/2 -translate-x-1/2 lg:bottom-8 z-50 shadow-lg transition-shadow bg-secondary rounded-full p-3"
          size="default"
          onClick={() => router.push("/clients/verify")}
        >
          <UserCheck className="size-5" />
          Verificar ({pendingVerificationCount})
        </Button>
      )}
    </div>
  )
}
