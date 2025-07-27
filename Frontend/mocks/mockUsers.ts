import type { UserType } from "@/lib/types"

export const mockUsers: UserType[] = [
  {
    id: 1,
    dni: 1234567,
    firstName: "María",
    lastName: "Gómez",
    email: "maria@email.com",
    phone: "+34 666 123 456",
    age: 32,
    birthDate: new Date("1992-04-12"),
    address: "Calle Mayor 12, Madrid",
    role: "admin",
    status: "active",
    joinDate: new Date("2024-01-01"),
    activitiesCount: 5,
    lastActivity: new Date("2024-01-14"),
    password: "admin123",
  }
]
