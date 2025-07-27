"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Textarea } from "@/components/ui/textarea"
import { usePayment } from "@/hooks/use-payment"
import { useToast } from "@/hooks/use-toast"
import {
    AlertTriangle,
    Calendar,
    Camera,
    Check,
    CreditCard,
    FileImage,
    Loader2,
    Mail, Phone,
    Upload,
    User,
    X
} from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useEffect, useRef, useState } from "react"


interface UploadPageProps {
    params: Promise<{ id: string }>
}

export default function UploadPage({ params }: UploadPageProps) {
    const resolvedParams = use(params)
    const paymentId = Number(resolvedParams.id)

    console.log("Client ID:", paymentId)
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { user } = useAuth()
    const { toast } = useToast()

    const {
        selectedPayment,
        loadPaymentDetail,
        loading,
        error
    } = usePayment()

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [notes, setNotes] = useState("")
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        if (!paymentId || isNaN(paymentId)) {
            router.push("/payments")
            return
        }
        loadPaymentDetail(paymentId)
    }, [paymentId])

    useEffect(() => {
        if (!user || (user.role !== "client" && user.role !== "admin")) {
            router.push("/payments")
        }
    }, [user])

    if (loading) {
        return <p className="text-center py-10">Cargando...</p>
    }

    if (!selectedPayment) {
        return <p className="text-center py-10 text-destructive">No se encontró el pago.</p>
    }

    const payment = selectedPayment
    const client = {
        name: payment.clientName,
        email: `${payment.clientName.toLowerCase().replace(" ", ".")}@correo.com`,
        phone: "111-222-3333",
        dateOfBirth: "2000-01-01",
        joinDate: new Date("2022-01-01"),
        lastActivity: new Date("2024-07-01"),
        activitiesCount: 42,
        totalDebt: payment.amount,
        overduePayments: 1
    }

    const formatDate = (date: Date | string) =>
        new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" })
            .format(new Date(date))

    const formatMonth = (date: Date | string) =>
        new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" })
            .format(new Date(date))

    const calculateAge = (birthDate: string) => {
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
        return age
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
            toast({
                title: "Archivo inválido",
                description: "Debe ser una imagen menor a 5MB",
                variant: "destructive"
            })
            return
        }

        setSelectedFile(file)
        const reader = new FileReader()
        reader.onload = e => setPreviewUrl(e.target?.result as string)
        reader.readAsDataURL(file)
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

    const handleUpload = async () => {

        setIsUploading(true)
        await new Promise(res => setTimeout(res, 2000)) // Simulación
        toast({
            title: "Pago verificado exitosamente",
            description: `El pago para ${client.name} fue subido`
        })
        setIsUploading(false)
        router.push("/payments")
    }

    return (
        <div className="min-h-screen bg-background">
            <MobileHeader title="Subir Comprobante" showBack onBack={() => router.back()} />
            <div className="container py-6 space-y-6">

                {/* Información del cliente */}
                <Card className="border-l-4 border-l-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" /> Información del Cliente
                            <Badge variant="destructive" className="ml-2">Deudor</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-lg">
                                    {client.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold">{client.name}</h3>
                                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                    <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{client.email}</div>
                                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{client.phone}</div>
                                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{calculateAge(client.dateOfBirth)} años</div>
                                </div>
                            </div>
                        </div>
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Estado de Deuda:</strong> ${client.totalDebt} en {client.overduePayments} pagos vencidos.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Detalle del pago */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" /> Detalles del Pago
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <p><strong>Período:</strong> {formatMonth(payment.createdAt)}</p>
                        <p><strong>Monto:</strong> ${payment.amount}</p>
                        <p><strong>Vencimiento:</strong> {formatDate(payment.expiresAt)}</p>
                        <Badge variant="destructive">Vencido</Badge>
                    </CardContent>
                </Card>

                {/* Subir comprobante */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileImage className="h-5 w-5" /> Subir Comprobante</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!selectedFile ? (
                            <div className="border-2 border-dashed p-8 text-center rounded-lg">
                                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="mb-4 text-muted-foreground">Seleccioná o tomá una foto del comprobante</p>
                                <div className="flex justify-center gap-3">
                                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Archivo</Button>
                                    <Button variant="outline" onClick={handleCameraCapture}><Camera className="mr-2 h-4 w-4" /> Cámara</Button>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                            </div>
                        ) : (
                            <div>
                                <div className="relative border rounded-lg overflow-hidden">
                                    <img src={previewUrl || ""} alt="Comprobante" className="w-full max-h-64 object-contain" />
                                    <Button size="sm" onClick={handleRemoveFile} className="absolute top-2 right-2" variant="destructive">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Notas (opcional)</Label>
                            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3 sticky bottom-6">
                    <Button variant="outline" onClick={() => router.back()} disabled={isUploading} className="flex-1">Cancelar</Button>
                    <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
                        {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                        {isUploading ? "Subiendo..." : (user?.role === "admin" ? "Subir y Aprobar" : "Subir Comprobante")}

                    </Button>
                </div>
            </div>
        </div>
    )
}
