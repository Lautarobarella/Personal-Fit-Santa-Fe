import { PaymentType } from "@/lib/types"

export const mockPayments: PaymentType[] = [
  {
    id: 1,
    clientId: 4,
    clientName: "Bruno Castro",
    amount: 150,
    createdAt: new Date("2024-07-01"),
    expiresAt: new Date("2024-07-10"),
    status: "paid",
    verifiedAt: new Date("2024-07-05")
  },
  {
    id: 2,
    clientId: 5,
    clientName: "Sofía Ramírez",
    amount: 150,
    createdAt: new Date("2024-07-01"),
    expiresAt: new Date("2024-07-10"),
    status: "rejected",
    rejectionReason: "Comprobante ilegible"
  },
  {
    id: 3,
    clientId: 6,
    clientName: "Valentina Morales",
    amount: 150,
    createdAt: new Date("2024-07-05"),
    expiresAt: new Date("2024-07-15"),
    status: "pending"
  },
  {
    id: 4,
    clientId: 7,
    clientName: "Diego Suárez",
    amount: 150,
    createdAt: new Date("2024-06-01"),
    expiresAt: new Date("2024-06-10"),
    status: "debtor"
  },
  {
    id: 5,
    clientId: 8,
    clientName: "Lucía Pérez",
    amount: 150,
    createdAt: new Date("2024-07-01"),
    expiresAt: new Date("2024-07-10"),
    status: "paid",
    verifiedAt: new Date("2024-07-08")
  },
  {
    id: 6,
    clientId: 9,
    clientName: "Federico Alonso",
    amount: 150,
    createdAt: new Date("2024-07-10"),
    expiresAt: new Date("2024-07-20"),
    status: "debtor"
  },
  {
    id: 7,
    clientId: 10,
    clientName: "Agustina Mendoza",
    amount: 150,
    createdAt: new Date("2024-05-01"),
    expiresAt: new Date("2024-05-10"),
    status: "debtor"
  },
  {
    id: 8,
    clientId: 11,
    clientName: "Tomás Navarro",
    amount: 150,
    createdAt: new Date("2024-07-01"),
    expiresAt: new Date("2024-07-10"),
    status: "debtor"
  },
  {
    id: 9,
    clientId: 12,
    clientName: "Julieta Campos",
    amount: 150,
    createdAt: new Date("2024-07-05"),
    expiresAt: new Date("2024-07-15"),
    status: "debtor"
  },
  {
    id: 10,
    clientId: 13,
    clientName: "Rodrigo Silva",
    amount: 150,
    createdAt: new Date("2024-07-01"),
    expiresAt: new Date("2024-07-10"),
    status: "paid",
    verifiedAt: new Date("2024-07-04")
  },
  {
    id: 11,
    clientId: 14,
    clientName: "Florencia Reyes",
    amount: 150,
    createdAt: new Date("2024-07-01"),
    expiresAt: new Date("2024-07-10"),
    status: "debtor"
  },
  {
    id: 12,
    clientId: 15,
    clientName: "Ignacio Domínguez",
    amount: 150,
    createdAt: new Date("2024-07-10"),
    expiresAt: new Date("2024-07-20"),
    status: "debtor"
  }
]
