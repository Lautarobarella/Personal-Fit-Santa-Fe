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
            <div className={`animate-pulse rounded-xl border ${className}`}>
                <div className="flex h-64 w-full items-center justify-center rounded-xl bg-muted">
                    <div className="text-sm text-muted-foreground">Cargando…</div>
                </div>
            </div>
        );
    }

    if (error || !fileData) {
        return (
            <div className={`rounded-xl border border-dashed py-10 text-center ${className}`}>
                <FileText className="mx-auto mb-2 size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No se pudo cargar el comprobante</p>
            </div>
        );
    }

    const isPDF = fileData.type === 'application/pdf';
    const isImage = fileData.type.startsWith('image/');

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="overflow-hidden rounded-xl border" style={{ height: isImage ? imageHeight : 'auto' }}>
                {isPDF ? (
                    <div className="w-full">
                        <iframe
                            src={fileData.url}
                            className="w-full border-0"
                            style={{ height: pdfHeight }}
                            title="Comprobante PDF"
                            loading="lazy"
                            sandbox="allow-downloads"
                        />
                    </div>
                ) : isImage ? (
                    <div className="flex size-full items-center justify-center bg-muted/40">
                        <img
                            src={fileData.url}
                            alt="Comprobante de pago"
                            className="max-w-full max-h-full object-contain"
                            onError={() => handleImageError()}
                        />
                    </div>
                ) : (
                    <div className="bg-muted/40 p-8 text-center">
                        <FileText className="mx-auto mb-4 size-16 text-muted-foreground" />
                        <p className="mb-2 text-lg font-medium">Archivo adjunto</p>
                        <p className="text-sm text-muted-foreground">
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
                        <Eye className="size-4 mr-2" />
                        Ver completo
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="bg-transparent"
                    >
                        <Download className="size-4 mr-2" />
                        Descargar
                    </Button>
                </div>
            )}
        </div>
    );
}
