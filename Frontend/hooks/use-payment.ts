import { fetchPaymentDetail, fetchPaymentDetailMock, fetchPayments, fetchPaymentsById, fetchPendingPaymentDetail, updatePayment } from "@/api/payment/paymentsApi"
import { PaymentType, VerifyPaymentType } from "@/lib/types"
import { useCallback, useState } from "react"


export function usePayment() {
  const [payments, setPayments] = useState<PaymentType[]>([])
  const [selectedPayment, setSelectedPayment] = useState<VerifyPaymentType | null>(null)
  const [pendingPayments, setPendingPayments] = useState<VerifyPaymentType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar todos los pagos
  const loadPayments = useCallback(async () => {
    console.log("Cargando pagos...")
    setLoading(true)
    setError(null)
    try {
      const res = await fetchPayments()
      console.log("Respuesta de pagos:", res)
      setPayments(res)
    } catch (err) {
      setError("Error al cargar los pagos")
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar pagos por ID
  const loadPaymentsById = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPaymentsById(id)
      console.log("Pagos por ID de usuario cargados:", data)
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
      const res = await fetchPaymentDetail(id)
      console.log("Respuesta de detalle de pago:", res)
      setSelectedPayment(res)
      console.log("Detalle del pago cargado:", selectedPayment)
    } catch (err) {
      setError("Error al cargar el detalle del cliente")
    } finally {
      setLoading(false)
    }
  }, [])

  

  // Cargar pagos pendientes
  const loadPendingPaymentDetail = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const detail = await fetchPendingPaymentDetail()
      setPendingPayments(detail)

    } catch (err) {
      setError("Error al cargar el detalle del cliente")
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar estado de un pago
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

  // Limpiar cliente seleccionado
  const clearSelectedPayment = () => setSelectedPayment(null)

  return {
    payments,
    selectedPayment,
    pendingPayments,
    loading,
    error,
    loadPayments,
    loadPaymentDetail,
    loadPendingPaymentDetail,
    clearSelectedPayment,
    setSelectedPayment, // opcional, por si quieres manipular manualmente
    loadPaymentsById,
    updatePaymentStatus,
  }



}