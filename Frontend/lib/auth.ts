import type { UserType, UserRole } from "./types"
import { mockUsers } from "@/mocks/mockUsers"
// Mock authentication - replace with real auth service

export const authenticate = async (email: string, password: string): Promise<UserType | null> => {
  // Mock authentication logic
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const user = mockUsers.find((u) => u.email === email)
  if (user && password === user.password) {
    return user
  }
  return null
}

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    admin: 3,
    trainer: 2,
    client: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}
