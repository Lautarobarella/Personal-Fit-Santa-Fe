"use client"

import { useEffect } from "react"

/**
 * error.tsx captura errores dentro del subtree de páginas (por ejemplo, un
 * ChunkLoadError al navegar a una ruta cuyo chunk ya no existe tras un deploy).
 * A diferencia de global-error.tsx, acá el layout raíz y sus estilos ya están
 * montados, así que podemos reutilizar las clases de la app.
 *
 * Si el error parece un fallo de carga de chunk intentamos la recuperación
 * automática; si ya se agotó, ofrecemos recarga + "reset" total.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        const rec = (typeof window !== "undefined" && (window as any).__pfChunkRecovery) || null
        if (rec && rec.looksLikeLoadError(error)) {
            rec.recover()
        }
    }, [error])

    const recovery = (typeof window !== "undefined" && (window as any).__pfChunkRecovery) || null
    const isLoadError = recovery ? recovery.looksLikeLoadError(error) : false

    const handleForceReload = () => {
        if (recovery) {
            recovery.forceReload()
        } else if (typeof window !== "undefined") {
            window.location.reload()
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
        </div>
    )
}
