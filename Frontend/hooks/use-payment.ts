import { fetchPaymentDetail, fetchPayments, fetchPaymentsById, updatePayment } from "@/api/payment/paymentsApi"
import { PaymentType, VerifyPaymentType } from "@/lib/types"
import { useState, useCallback } from "react"


export function usePayment() {
  const [payments, setPayments] = useState<PaymentType[]>([])
  const [selectedPayment, setSelectedPayment] = useState<VerifyPaymentType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar todos los clientes
  const loadPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPayments()
      setPayments(data)
      console.log("Pagos cargados:", data)
    } catch (err) {
      setError("Error al cargar los clientes")
    } finally {
      setLoading(false)
    }
  }, [])

    const loadPaymentsById = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPaymentsById(id)
      setPayments(data)
      console.log("Pagos cargados:", data)
    } catch (err) {
      setError("Error al cargar los clientes")
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar detalle de un cliente
  const loadPaymentDetail = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const detail = await fetchPaymentDetail(id)
      setSelectedPayment(detail)
      console.log("Detalle del pago cargado:", detail)
    } catch (err) {
      setError("Error al cargar el detalle del cliente")
    } finally {
      setLoading(false)
    }
  }, [])

  // Limpiar cliente seleccionado
  const clearSelectedPayment = () => setSelectedPayment(null)

  const updatePaymentStatus = useCallback(async (id: number, status: "paid" | "rejected", rejectionReason?: string) => {
    setLoading(true)
    setError(null)
    try {
      const updatedPayment = await updatePayment(id, status, rejectionReason)
      setSelectedPayment(updatedPayment)
      console.log("Pago actualizado:", updatedPayment)
    } catch (err) {
      setError("Error al actualizar el pago")
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    payments,
    selectedPayment,
    loading,
    error,
    loadPayments,
    loadPaymentDetail,
    clearSelectedPayment,
    setSelectedPayment, // opcional, por si quieres manipular manualmente
    loadPaymentsById,
    updatePaymentStatus,
  }



}