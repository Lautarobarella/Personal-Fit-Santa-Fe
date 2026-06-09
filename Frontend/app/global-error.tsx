"use client"

import { useEffect } from "react"

/**
 * global-error.tsx captura errores que ocurren en el layout raíz (incluida la
 * hidratación). Reemplaza por completo al layout, por eso debe renderizar su
 * propio <html>/<body>. Usa estilos inline a propósito: si el error fue por un
 * chunk que no cargó, las hojas de estilo de la app podrían no estar disponibles.
 *
 * Estrategia: si el error parece un fallo de carga de chunk, intentamos la
 * recuperación automática (reload con cache-busting). Si esa recuperación ya se
 * agotó (guarda anti-loop), mostramos una UI amigable con un botón que limpia
 * todo y recarga —el equivalente self-service a "borrá la caché del navegador".
 */
export default function GlobalError({
    error,
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

    const handleForceReload = () => {
        const rec = (typeof window !== "undefined" && (window as any).__pfChunkRecovery) || null
        if (rec) {
            rec.forceReload()
        } else if (typeof window !== "undefined") {
            window.location.reload()
        }
    }

    return (
        <html lang="es">
            <body
                style={{
                    margin: 0,
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
                    background: "#fafafa",
                    color: "#1f2937",
                    padding: "24px",
                }}
            >
                <div style={{ maxWidth: "420px", textAlign: "center" }}>
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            margin: "0 auto 20px",
                            borderRadius: "9999px",
                            background: "#FF7A30",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "28px",
                            fontWeight: 700,
                        }}
                    >
                        ↻
                    </div>
                    <h1 style={{ fontSize: "20px", margin: "0 0 8px", fontWeight: 600 }}>
                        Hay una nueva versión disponible
                    </h1>
                    <p style={{ fontSize: "15px", lineHeight: 1.5, color: "#4b5563", margin: "0 0 24px" }}>
                        Estamos actualizando la aplicación. Tocá el botón para recargar con la
                        última versión.
                    </p>
                    <button
                        onClick={handleForceReload}
                        style={{
                            background: "#FF7A30",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "12px 24px",
                            fontSize: "15px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Recargar aplicación
                    </button>
                </div>
            </body>
        </html>
    )
}
