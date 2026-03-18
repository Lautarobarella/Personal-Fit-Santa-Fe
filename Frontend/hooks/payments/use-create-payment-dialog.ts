"use client"

import type React from "react"

import { usePaymentContext } from "@/contexts/payment-provider"
import { useSettings } from "@/hooks/settings/use-settings"
import { useToast } from "@/hooks/use-toast"
import { createOptimizedPreview, validatePaymentFile } from "@/lib/file-compression"
import { MethodType, PaymentStatus, UserRole } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-provider"

interface ValidatedUser {
  dni: number
  name: string
  isValid: boolean
  isValidating: boolean
  errorMessage?: string
  hasActivePlan?: boolean
}

interface CreatePaymentArgs {
  clientDnis: number[]
  createdByDni: number
  amount: number
  createdAt: string
  expiresAt: string
  method: MethodType
  notes?: string
  file?: File
}

export function useCreatePaymentDialog(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onCreatePayment: (payment: CreatePaymentArgs) => Promise<void>,
) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { monthlyFee } = useSettings()
  const { payments: clientPayments, isLoading: isLoadingPayments } = usePaymentContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isCreating, setIsCreating] = useState(false)
  const [clientDnis, setClientDnis] = useState<string[]>([""])
  const [validatedUsers, setValidatedUsers] = useState<ValidatedUser[]>([])
  const [debounceTimers, setDebounceTimers] = useState<Array<NodeJS.Timeout | null>>([])
  const [baseAmount, setBaseAmount] = useState("")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<MethodType | "">("")
  const [notes, setNotes] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const today = new Date()
  const startDateStr = today.toISOString().split("T")[0]

  const calculateDueDate = (startDate: Date) => {
    const dueDate = new Date(startDate)
    dueDate.setMonth(dueDate.getMonth() + 1)
    if (dueDate.getDate() !== startDate.getDate()) {
      dueDate.setDate(0)
    }
    return dueDate
  }

  const oneMonthLater = calculateDueDate(today)
  const dueDateStr = oneMonthLater.toISOString().split("T")[0]

  const [startDate, setStartDate] = useState(startDateStr)
  const [dueDate, setDueDate] = useState(dueDateStr)

  const resetFormState = () => {
    setClientDnis([""])
    setValidatedUsers([{
      dni: 0,
      name: "",
      isValid: false,
      isValidating: false,
      hasActivePlan: false,
    }])
    debounceTimers.forEach((timer) => {
      if (timer) clearTimeout(timer)
    })
    setDebounceTimers([null])
    setBaseAmount("")
    setAmount("")
    setPaymentMethod("")
    setNotes("")
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsCreating(false)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    if (open && user && monthlyFee > 0) {
      if (user.role === UserRole.CLIENT && user.dni) {
        setClientDnis([user.dni.toString()])
        setTimeout(() => {
          validateDni(0, user.dni.toString())
        }, 100)
      } else {
        setClientDnis([""])
      }
      setBaseAmount(monthlyFee.toString())
    }
  }, [open, user, monthlyFee])

  useEffect(() => {
    const validUsersCount = validatedUsers.filter((u) => u.isValid).length
    if (validUsersCount > 0 && baseAmount) {
      const base = parseFloat(baseAmount) || 0
      const total = base * validUsersCount
      setAmount(total.toString())
    } else if (baseAmount) {
      setAmount(baseAmount)
    }
  }, [baseAmount, validatedUsers])

  useEffect(() => {
    return () => {
      resetFormState()
    }
  }, [])

  useEffect(() => {
    if (!open) {
      resetFormState()
    }
  }, [open])

  const addDniField = () => {
    setClientDnis((prev) => [...prev, ""])
    setValidatedUsers((prev) => [
      ...prev,
      { dni: 0, name: "", isValid: false, isValidating: false, hasActivePlan: false },
    ])
    setDebounceTimers((prev) => [...prev, null])
  }

  const removeDniField = (index: number) => {
    if (clientDnis.length > 1) {
      if (debounceTimers[index]) {
        clearTimeout(debounceTimers[index]!)
      }
      setClientDnis((prev) => prev.filter((_, i) => i !== index))
      setValidatedUsers((prev) => prev.filter((_, i) => i !== index))
      setDebounceTimers((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const updateDni = (index: number, value: string) => {
    const newDnis = [...clientDnis]
    newDnis[index] = value
    setClientDnis(newDnis)

    if (debounceTimers[index]) {
      clearTimeout(debounceTimers[index]!)
    }

    if (!value.trim()) {
      const newValidatedUsers = [...validatedUsers]
      newValidatedUsers[index] = {
        dni: 0, name: "", isValid: false, isValidating: false, hasActivePlan: false,
      }
      setValidatedUsers(newValidatedUsers)
      return
    }

    const newValidatedUsers = [...validatedUsers]
    newValidatedUsers[index] = {
      dni: 0, name: "", isValid: false, isValidating: true, hasActivePlan: false,
    }
    setValidatedUsers(newValidatedUsers)

    const newTimer = setTimeout(() => {
      validateDni(index, value.trim())
    }, 1000)

    const newTimers = [...debounceTimers]
    newTimers[index] = newTimer
    setDebounceTimers(newTimers)
  }

  const validateDni = async (index: number, dniString: string) => {
    try {
      const dni = parseInt(dniString, 10)
      if (isNaN(dni)) {
        throw new Error("El DNI debe ser un número válido")
      }

      const { fetchUserByDni } = await import("@/api/clients/usersApi")
      const fetchedUser = await fetchUserByDni(dni)
      const hasActivePlan = fetchedUser.status === "ACTIVE"

      const newValidatedUsers = [...validatedUsers]

      if (hasActivePlan) {
        newValidatedUsers[index] = {
          dni,
          name: fetchedUser.name,
          isValid: false,
          isValidating: false,
          hasActivePlan: true,
          errorMessage: `${fetchedUser.name} ya tiene un plan activo`,
        }
      } else {
        newValidatedUsers[index] = {
          dni,
          name: fetchedUser.name,
          isValid: true,
          isValidating: false,
          hasActivePlan: false,
        }
      }

      setValidatedUsers(newValidatedUsers)
    } catch (error: any) {
      console.error("Error validando DNI:", error)
      const newValidatedUsers = [...validatedUsers]
      let errorMessage = "Error inesperado"

      if (
        error?.response?.status === 404 ||
        error?.status === 404 ||
        error?.code === 404 ||
        (error?.message && error.message.includes("404"))
      ) {
        errorMessage = "DNI no encontrado"
      } else if (
        error?.message?.includes("Network Error") ||
        error?.message?.includes("ERR_NETWORK") ||
        error?.code === "NETWORK_ERROR"
      ) {
        errorMessage = "Error de conexión"
      } else if (error?.message === "El DNI debe ser un número válido") {
        errorMessage = error.message
      } else if (error?.message) {
        if (error.message.includes("DNI") || error.message.includes("usuario")) {
          errorMessage = error.message
        } else {
          errorMessage = "DNI no encontrado"
        }
      }

      newValidatedUsers[index] = {
        dni: 0, name: "", isValid: false, isValidating: false, hasActivePlan: false, errorMessage,
      }
      setValidatedUsers(newValidatedUsers)
    }
  }

  const checkExistingPayment = (): boolean => {
    if (!clientPayments || clientPayments.length === 0) return false
    return clientPayments.some(
      (payment) => payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.PENDING,
    )
  }

  const generateMonthOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthLabel = new Intl.DateTimeFormat("es-ES", {
        month: "long",
        year: "numeric",
      }).format(date)
      options.push({ value: monthStr, label: monthLabel })
    }
    return options
  }

  const monthOptions = generateMonthOptions()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validatePaymentFile(file)
    if (!validation.isValid) {
      toast({
        title: "Archivo inválido",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    try {
      setSelectedFile(file)
      const url = await createOptimizedPreview(file)
      setPreviewUrl(url)
    } catch (error) {
      console.error("Error al procesar archivo:", error)
      toast({
        title: "Error al procesar archivo",
        description: "No se pudo procesar el archivo seleccionado",
        variant: "destructive",
      })
    }
  }

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment")
      fileInputRef.current.click()
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSuccessfulPayment = () => {
    debounceTimers.forEach((timer) => {
      if (timer) clearTimeout(timer)
    })

    setClientDnis([""])
    setValidatedUsers([])
    setDebounceTimers([])
    setBaseAmount("")
    setStartDate("")
    setAmount("")
    setDueDate("")
    setSelectedFile(null)
    setPreviewUrl(null)
    setNotes("")
    setPaymentMethod("")
    setPaymentMethod(MethodType.TRANSFER)

    const isAutomaticPayment = user?.role === UserRole.ADMIN
    const message = isAutomaticPayment
      ? "El pago se ha registrado y el cliente ha sido activado automáticamente"
      : "El pago se ha registrado correctamente"

    toast({
      title: "Pago creado",
      description: message,
    })

    onOpenChange(false)
    router.push("/payments")
  }

  const handleClose = () => {
    onOpenChange(false)
    router.push("/payments")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (clientDnis.some((dni) => !dni.trim())) {
      toast({ title: "Error", description: "Todos los campos de DNI son requeridos", variant: "destructive" })
      return
    }

    if (!startDate || !amount || !dueDate) {
      toast({ title: "Error", description: "Todos los campos son requeridos", variant: "destructive" })
      return
    }

    if (!paymentMethod) {
      toast({ title: "Error", description: "Debe seleccionarse un método de pago", variant: "destructive" })
      return
    }

    const validUsers = validatedUsers.filter((u) => u.isValid)
    if (validUsers.length === 0 || validUsers.length !== clientDnis.filter((dni) => dni.trim()).length) {
      toast({
        title: "Error",
        description: "Todos los DNIs deben ser válidos y no contar con planes activos",
        variant: "destructive",
      })
      return
    }

    const usersWithErrors = validatedUsers.filter((u) => u.errorMessage)
    if (usersWithErrors.length > 0) {
      toast({ title: "Error", description: "Corregir los errores marcados", variant: "destructive" })
      return
    }

    if (user?.role === UserRole.CLIENT) {
      if (paymentMethod === MethodType.TRANSFER && !selectedFile) {
        toast({
          title: "Error",
          description: "Debes subir un comprobante para transferencias",
          variant: "destructive",
        })
        return
      }

      if (paymentMethod === MethodType.CASH && !notes.trim()) {
        toast({
          title: "Error",
          description: "Las notas son obligatorias para pagos en efectivo",
          variant: "destructive",
        })
        return
      }
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Error",
        description: "El monto base debe ser un número válido mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (user?.role === UserRole.CLIENT) {
      if (isLoadingPayments) {
        toast({ title: "Cargando", description: "Verificando pagos existentes..." })
        return
      }

      if (checkExistingPayment()) {
        toast({
          title: "Error",
          description:
            "Ya tienes un pago activo o pendiente. No puedes crear un nuevo pago hasta que el actual sea procesado o rechazado.",
          variant: "destructive",
        })
        return
      }
    }

    setIsCreating(true)

    try {
      const validDnis = validUsers.map((u) => u.dni)

      let createdByDni: number
      if (user?.role === UserRole.CLIENT) {
        createdByDni = user.dni
      } else if (user?.role === UserRole.ADMIN) {
        if (!user.dni) {
          throw new Error("El administrador debe tener un DNI configurado para registrar el pago")
        }
        createdByDni = user.dni
      } else {
        throw new Error("Rol de usuario no válido")
      }

      await onCreatePayment({
        clientDnis: validDnis,
        createdByDni,
        amount: amountNum,
        createdAt: startDate,
        expiresAt: dueDate,
        method: paymentMethod as MethodType,
        notes: notes.trim() || undefined,
        file: selectedFile ?? undefined,
      })

      handleSuccessfulPayment()
    } catch (error: any) {
      let errorMessage = "No se pudo crear el pago"
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  return {
    user,
    isCreating,
    clientDnis,
    validatedUsers,
    baseAmount,
    setBaseAmount,
    amount,
    setAmount,
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
    selectedFile,
    previewUrl,
    isUploading,
    fileInputRef,
    monthOptions,
    addDniField,
    removeDniField,
    updateDni,
    handleFileSelect,
    handleCameraCapture,
    handleRemoveFile,
    handleSubmit,
    handleClose,
  }
}
