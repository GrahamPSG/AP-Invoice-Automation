// Shared types for the What-If Calculator application

export interface User {
  id: string
  email: string
  name: string
  role: 'viewer' | 'editor' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  squareFootage: number
  unitCount: number
  buildingType: 'single-family' | 'multi-family' | 'commercial' | 'industrial'
  baseRevenue: number
  baseCosts: {
    labor: number
    materials: number
    overhead: number
  }
  scope?: string[]
  durationWeeks?: number
  crewSize?: number
  grossProfit?: number
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Scenario {
  id: string
  name: string
  projectId: string
  projectName: string
  parameters: {
    crewChange: number
    scheduleChangeWeeks: number
    laborRateChangePct: number
    materialInflationPct: number
    overheadChangePct: number
    targetProfitPct: number
  }
  results: {
    baseRevenue: number
    adjustedRevenue: number
    baseCosts: number
    adjustedCosts: number
    baseProfit: number
    adjustedProfit: number
    profitChange: number
    profitMarginChange: number
  }
  createdAt: string
  updatedAt: string
  userId: string
  isPublic: boolean
}

export interface ScenarioInput {
  name?: string
  projectSize: {
    units?: number
    dollars?: number
    sqFt?: number
  }
  scope: string[]
  crewChange: number
  scheduleChangeWeeks: number
  laborRateChangePct: number
  materialInflationPct: number
  overheadChangePct: number
  targetProfitPct: number
}

export interface ScenarioCreate {
  name: string
  projectId: string
  parameters: Scenario['parameters']
  isPublic?: boolean
}

export interface ScenarioUpdate {
  name?: string
  parameters?: Partial<Scenario['parameters']>
  isPublic?: boolean
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  success: boolean
  message?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface Alert {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
}

export interface CashPoint {
  week: number
  amount: number
  type: 'inflow' | 'outflow'
  description: string
}