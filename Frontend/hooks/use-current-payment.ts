import { useToast } from "@/hooks/use-toast"
import { PaymentType } from "@/lib/types"
import { useCallback, useEffect, useState } from "react"
import { usePayment } from "./use-payment"

export function useCurrentPayment(pendingPayments: PaymentType[], currentIndex: number) {
    const [currentPayment, setCurrentPayment] = useState<PaymentType & { receiptUrl: string | null } | null>(null)
    const [isPaymentLoading, setIsPaymentLoading] = useState(true)
    const { fetchSinglePayment } = usePayment(undefined, true)
    const { toast } = useToast()

    const loadPayment = useCallback(async () => {
        setIsPaymentLoading(true)
        const paymentId = pendingPayments[currentIndex]?.id

        if (!paymentId) {
            setCurrentPayment(null)
            setIsPaymentLoading(false)
            return
        }

        try {
            const fetched = await fetchSinglePayment(paymentId)
            setCurrentPayment(fetched)
        } catch (error) {
            toast({
                title: "Error al cargar el pago",
                description: "Ocurrió un error al cargar el detalle del pago.",
                variant: "destructive",
            })
            setCurrentPayment(null)
        } finally {
            setIsPaymentLoading(false)
        }
    }, [currentIndex, pendingPayments, fetchSinglePayment, toast])

    useEffect(() => {
        if (pendingPayments.length > 0) {
            loadPayment()
        }
    }, [loadPayment, pendingPayments.length])

    return { currentPayment, isPaymentLoading, reloadCurrentPayment: loadPayment }
}
