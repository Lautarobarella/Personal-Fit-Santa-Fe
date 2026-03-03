"use client"

import { Button } from "@/components/ui/button";
import { usePaymentReceipt } from "@/hooks/payments/use-payment-receipt";
import { Download, Eye, FileText } from "lucide-react";

interface PaymentReceiptDisplayProps {
    fileId: number | null | undefined;
    fileName?: string;
    className?: string;
    showActions?: boolean;
    pdfHeight?: string;
    imageHeight?: string;
}

export function PaymentReceiptDisplay({
    fileId,
    fileName,
    className = "",
    showActions = true,
    pdfHeight = "400px",
    imageHeight = "400px"
}: PaymentReceiptDisplayProps) {
    const {
        fileData,
        isLoading,
        error,
        handleDownload,
        handleViewFullSize,
        handleImageError,
    } = usePaymentReceipt(fileId, fileName)

    if (isLoading) {
        return (
            <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}>
                <div className="w-full h-64 bg-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-gray-500">Cargando...</div>
                </div>
            </div>
        );
    }

    if (error || !fileData) {
        return (
            <div className={`border rounded-lg p-8 text-center ${className}`}>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No se pudo cargar el comprobante</p>
            </div>
        );
    }

    const isPDF = fileData.type === 'application/pdf';
    const isImage = fileData.type.startsWith('image/');

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="border rounded-lg overflow-hidden" style={{ height: isImage ? imageHeight : 'auto' }}>
                {isPDF ? (
                    <div className="w-full">
                        <iframe
                            src={fileData.url}
                            className="w-full border-0"
                            style={{ height: pdfHeight }}
                            title="Comprobante PDF"
                            loading="lazy"
                        />
                    </div>
                ) : isImage ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <img
                            src={fileData.url}
                            alt="Comprobante de pago"
                            className="max-w-full max-h-full object-contain"
                            onError={() => handleImageError()}
                        />
                    </div>
                ) : (
                    <div className="bg-gray-50 p-8 text-center">
                        <FileText className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">Archivo adjunto</p>
                        <p className="text-sm text-gray-600">
                            Tipo: {fileData.type}
                        </p>
                    </div>
                )}
            </div>

            {showActions && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewFullSize}
                        className="bg-transparent"
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver completo
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="bg-transparent"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                    </Button>
                </div>
            )}
        </div>
    );
}
