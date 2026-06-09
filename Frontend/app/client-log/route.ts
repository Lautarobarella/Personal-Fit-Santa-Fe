/**
 * Endpoint de logging de errores del cliente.
 * ------------------------------------------
 * Recibe errores capturados en el navegador (window.onerror,
 * unhandledrejection, error boundaries) y los imprime a stdout del server de
 * Next, de modo que aparezcan en `docker logs personalfit-frontend`.
 *
 * Por qué NO /api/*: las llamadas /api/* del frontend van al backend (URL
 * absoluta, ver api/JWTAuth/config.ts) y el proxy las enruta a Spring, así que
 * un route handler en /api/* quedaría tapado. /client-log lo sirve Next.
 *
 * Nota: usamos console.error a propósito; el compiler de Next (next.config.mjs)
 * elimina console.* en producción EXCEPTO error/warn, así que este log sobrevive.
 */

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request): Promise<Response> {
    try {
        const body = (await request.json()) as Record<string, unknown>

        const entry = {
            tag: "CLIENT-ERROR",
            time: new Date().toISOString(),
            source: body?.source ?? null,
            message: body?.message ?? null,
            digest: body?.digest ?? null,
            stack: typeof body?.stack === "string" ? (body.stack as string).slice(0, 4000) : null,
            resource: body?.resource ?? null,
            url: body?.url ?? null,
            userAgent: body?.userAgent ?? request.headers.get("user-agent"),
        }

        console.error("[CLIENT-ERROR]", JSON.stringify(entry))
    } catch {
        console.error("[CLIENT-ERROR] payload inválido o no parseable")
    }

    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    })
}
