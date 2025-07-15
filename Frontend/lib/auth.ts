import type { User, UserRole } from "./types"

// Mock authentication - replace with real auth service
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@fittrainer.com",
    role: "administrator",
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "John Trainer",
    email: "trainer@fittrainer.com",
    role: "trainer",
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Jane Client",
    email: "client@fittrainer.com",
    role: "client",
    createdAt: new Date(),
  },
]

export const authenticate = async (email: string, password: string): Promise<User | null> => {
  // Mock authentication logic
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const user = mockUsers.find((u) => u.email === email)
  if (user && password === "password") {
    return user
  }
  return null
}

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    administrator: 3,
    trainer: 2,
    client: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}
