export type UUID = string

export interface User {
  id: UUID
  email: string
  role: 'viewer' | 'editor' | 'admin'
  createdAt: Date
}

export interface CostBreakdown {
  labor: number
  materials: number
  equipment: number
  overhead: number
  profit: number
}

export interface Project {
  id: UUID
  name: string
  sizeUnits?: number
  sizeSqFt?: number
  sizeDollars?: number
  scope: 'plumbing' | 'hvac' | 'combined'
  durationWeeks: number
  costs: CostBreakdown
  crewSize: number
  revenuePerTechDay: number
  grossProfit: number
  netProfit: number
  cashFlow?: CashPoint[]
  columnMap: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

export interface Scenario {
  id: UUID
  projectId: UUID | null
  ownerId: UUID
  isPublic: boolean
  inputs: ScenarioInput
  outputs: ScenarioOutput
  createdAt: Date
  updatedAt: Date
}

export interface ScenarioInput {
  projectSize: { units?: number; dollars?: number; sqFt?: number }
  scope: ('plumbing' | 'hvac' | 'combined')[]
  crewChange: number
  scheduleChangeWeeks: number
  overheadChangePct?: number
  materialInflationPct?: number
  laborRateChangePct?: number
  targetProfitPct?: number
}

export interface ScenarioOutput {
  totalRevenue: number
  totalCost: number
  grossMarginPct: number
  laborHours: number
  laborPerUnit: number
  profitDollars: number
  profitPct: number
  cashFlowForecast: CashPoint[]
  alerts: Alert[]
}

export interface Alert {
  message: string
  severity: 'info' | 'warning' | 'critical'
}

export interface CashPoint {
  week: number
  cash: number
}

export interface ApiError {
  error: string
  message: string
  details?: any
}