"use client"

import { useEffect, useState } from "react"

/**
 * error.tsx captura errores dentro del subtree de páginas (por ejemplo, un
 * ChunkLoadError al navegar a una ruta cuyo chunk ya no existe tras un deploy,
 * o una excepción de runtime en una página). A diferencia de global-error.tsx,
 * acá el layout raíz y sus estilos ya están montados.
 *
 *  - Si el error parece un fallo de carga de chunk: recuperación automática.
 *  - Siempre: reporta el error a /client-log (visible en docker logs) y permite
 *    ver/copiar los detalles técnicos en pantalla para diagnosticar a distancia.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const [copied, setCopied] = useState(false)
    const [showDetails, setShowDetails] = useState(false)

    const recovery = (typeof window !== "undefined" && (window as any).__pfChunkRecovery) || null
    const isLoadError = recovery ? recovery.looksLikeLoadError(error) : false

    useEffect(() => {
        recovery?.report?.({
            source: "error-boundary",
            message: error?.message ?? null,
            stack: error?.stack ?? null,
            digest: error?.digest ?? null,
        })
        if (recovery && recovery.looksLikeLoadError(error)) {
            recovery.recover()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    const details = [
        `mensaje: ${error?.message ?? "(sin mensaje)"}`,
        `digest: ${error?.digest ?? "(none)"}`,
        `url: ${typeof window !== "undefined" ? window.location.href : ""}`,
        `userAgent: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}`,
        `stack:\n${error?.stack ?? "(sin stack)"}`,
    ].join("\n")

    const handleForceReload = () => {
        if (recovery) recovery.forceReload()
        else if (typeof window !== "undefined") window.location.reload()
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(details)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            setShowDetails(true)
        }
    }

    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background p-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                ↻
            </div>
            <h1 className="text-lg font-semibold text-foreground">
                {isLoadError ? "Hay una nueva versión disponible" : "Ocurrió un error inesperado"}
            </h1>
            <p className="max-w-sm text-sm text-muted-foreground">
                {isLoadError
                    ? "Estamos actualizando la aplicación. Recargá para obtener la última versión."
                    : "Podés reintentar la acción o recargar la aplicación."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
                {!isLoadError && (
                    <button
                        onClick={() => reset()}
                        className="rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                    >
                        Reintentar
                    </button>
                )}
                <button
                    onClick={handleForceReload}
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                    Recargar aplicación
                </button>
            </div>

            {/* Diagnóstico: permite enviar el error real desde el dispositivo del cliente. */}
            <div className="mt-2 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCopy}
                        className="text-xs font-medium text-primary underline underline-offset-2"
                    >
                        {copied ? "¡Copiado!" : "Copiar detalles del error"}
                    </button>
                    <button
                        onClick={() => setShowDetails((v) => !v)}
                        className="text-xs text-muted-foreground underline underline-offset-2"
                    >
                        {showDetails ? "Ocultar detalles" : "Ver detalles"}
                    </button>
                </div>
                {showDetails && (
                    <pre className="mt-1 max-h-60 max-w-[90vw] overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-left text-[11px] leading-snug text-muted-foreground">
                        {details}
                    </pre>
                )}
            </div>
        </div>
    )
}
