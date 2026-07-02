'use client'

import { createContext, useContext } from 'react'

// Shared state hub for the dashboard tabs. DashboardShell holds all the state/handlers (it always
// has) and exposes them here so each tab can live in its own file and read exactly what it needs via
// useDashboard(), instead of everything being inlined in one giant component. The provider value is
// grown incrementally as tabs are extracted — a tab only needs the slice it actually uses.
export const DashboardContext = createContext(null)

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard deve ser usado dentro de <DashboardContext.Provider>.')
  }
  return context
}
