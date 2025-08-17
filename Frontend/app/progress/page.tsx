"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Progress } from "@/components/ui/progress"
import { Award, Calendar, Target, TrendingUp } from "lucide-react"
import { useRouter } from "next/dist/client/components/navigation"

export default function ProgressPage() {
    const { user } = useAuth()
    const router = useRouter()
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">Cargando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <MobileHeader
                title="Mi Progreso"
                showBack
                onBack={() => router.push("/dashboard")}
            />

            <main className="container mx-auto px-4 py-6 pb-32 space-y-6">
                {/* Coming Soon Card */}
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 p-3 bg-emerald-500/10 rounded-full w-fit">
                            <TrendingUp className="h-8 w-8 text-emerald-500" />
                        </div>
                        <CardTitle className="text-2xl">Progreso Personal</CardTitle>
                        <p className="text-muted-foreground">
                            Próximamente podrás ver tu evolución y estadísticas detalladas
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Preview Cards */}
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="font-medium">Clases Completadas</p>
                                        <p className="text-sm text-muted-foreground">Este mes</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">--</p>
                                    <p className="text-sm text-muted-foreground">de --</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Target className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="font-medium">Objetivos Alcanzados</p>
                                        <p className="text-sm text-muted-foreground">Meta mensual</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">--%</p>
                                    <Progress value={0} className="w-20 h-2 mt-1" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Award className="h-5 w-5 text-yellow-500" />
                                    <div>
                                        <p className="font-medium">Logros Desbloqueados</p>
                                        <p className="text-sm text-muted-foreground">Insignias ganadas</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">--</p>
                                    <p className="text-sm text-muted-foreground">disponibles</p>
                                </div>
                            </div>
                        </div>

                        {/* Coming Soon Message */}
                        <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">¡Muy Pronto!</h3>
                            <p className="text-muted-foreground text-sm">
                                Estamos trabajando para brindarte estadísticas detalladas de tu progreso,
                                gráficos de evolución y un sistema de logros personalizado.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </main>

            <BottomNav />
        </div>
    )
}
