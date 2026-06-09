"use client"

import { useEffect, useState } from "react"

/**
 * global-error.tsx captura errores del layout raíz (incluida la hidratación).
 * Reemplaza por completo al layout, por eso renderiza su propio <html>/<body>
 * con estilos inline (si falló un chunk, las hojas de estilo podrían faltar).
 *
 *  - Si el error parece fallo de carga de chunk: recuperación automática.
 *  - Siempre: reporta a /client-log (docker logs) y permite copiar los detalles.
 */
export default function GlobalError({
    error,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const rec = (typeof window !== "undefined" && (window as any).__pfChunkRecovery) || null
        rec?.report?.({
            source: "global-error-boundary",
            message: error?.message ?? null,
            stack: error?.stack ?? null,
            digest: error?.digest ?? null,
        })
        if (rec && rec.looksLikeLoadError(error)) {
            rec.recover()
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
        const rec = (typeof window !== "undefined" && (window as any).__pfChunkRecovery) || null
        if (rec) rec.forceReload()
        else if (typeof window !== "undefined") window.location.reload()
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(details)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            /* el <textarea> de abajo permite seleccionar y copiar a mano */
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
                <div style={{ maxWidth: "440px", width: "100%", textAlign: "center" }}>
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
                        Ocurrió un error
                    </h1>
                    <p style={{ fontSize: "15px", lineHeight: 1.5, color: "#4b5563", margin: "0 0 20px" }}>
                        Probá recargar la aplicación. Si el problema sigue, copiá los detalles y
                        envialos al soporte.
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

                    <div style={{ marginTop: "20px" }}>
                        <button
                            onClick={handleCopy}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#FF7A30",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: "pointer",
                                textDecoration: "underline",
                            }}
                        >
                            {copied ? "¡Copiado!" : "Copiar detalles del error"}
                        </button>
                        <textarea
                            readOnly
                            value={details}
                            onFocus={(e) => e.currentTarget.select()}
                            style={{
                                marginTop: "10px",
                                width: "100%",
                                height: "120px",
                                fontSize: "11px",
                                lineHeight: 1.4,
                                color: "#6b7280",
                                background: "#f3f4f6",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                padding: "8px",
                                boxSizing: "border-box",
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                resize: "none",
                            }}
                        />
                    </div>
                </div>
            </body>
        </html>
    )
}
