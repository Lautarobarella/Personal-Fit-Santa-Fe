import { ReactQueryProvider } from "@/components/providers/react-query-provider"
import { ReactNode } from "react"

export default function PaymentsLayout({ children }: { children: ReactNode }) {
    return (
        <ReactQueryProvider>
            {children}
        </ReactQueryProvider>
    )
}