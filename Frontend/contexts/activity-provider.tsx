"use client"

import { useActivity, type ActivityState } from "@/hooks/activities/use-activity"
import { createContext, useContext, type ReactNode } from "react"

/**
 * Activity Context Interface
 * Maps directly to the `useActivity` hook return type.
 */
type ActivityContextType = ActivityState

// Context initialization
const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

interface ActivityProviderProps {
  children: ReactNode
}

/**
 * Activity Provider
 * 
 * Acts as the centralized state container for all Activity-related logic.
 * It abstracts the `useActivity` hook, ensuring that the state is singleton-scoped 
 * within the provider tree, preventing unnecessary hook re-instantiations.
 */
export function ActivityProvider({ children }: ActivityProviderProps) {
  // Instantiates the core business logic hook
  const activityState = useActivity()

  return (
    <ActivityContext.Provider value={activityState}>
      {children}
    </ActivityContext.Provider>
  )
}

/**
 * useActivityContext Hook
 * 
 * Accessor for the Activity Context.
 * Ensures the component is correctly nested within the provider tree.
 * 
 * @throws Error if used outside of <ActivityProvider />
 * @returns The shared ActivityState
 */
export function useActivityContext(): ActivityContextType {
  const context = useContext(ActivityContext)

  if (context === undefined) {
    throw new Error('useActivity debe ser usado dentro de un ActivityProvider')
  }

  return context
}
