import { Injectable } from '@nestjs/common'
import { Project } from '../projects/project.entity'

interface ScenarioInputs {
  projectSize: { units?: number; dollars?: number; sqFt?: number }
  scope: ('plumbing' | 'hvac' | 'combined')[]
  crewChange: number
  scheduleChangeWeeks: number
  overheadChangePct?: number
  materialInflationPct?: number
  laborRateChangePct?: number
  targetProfitPct?: number
}

interface ScenarioOutputs {
  totalRevenue: number
  totalCost: number
  grossMarginPct: number
  laborHours: number
  laborPerUnit: number
  profitDollars: number
  profitPct: number
  cashFlowForecast: Array<{ week: number; cash: number }>
  alerts: Array<{ message: string; severity: 'info' | 'warning' | 'critical' }>
}

@Injectable()
export class ScenarioComputeService {
  computeScenario(
    inputs: ScenarioInputs,
    baseProject?: Project,
  ): ScenarioOutputs {
    const alerts: Array<{ message: string; severity: 'info' | 'warning' | 'critical' }> = []

    // Base calculations from project or defaults
    const baseLaborCost = baseProject?.costs.labor || 50000
    const baseMaterialCost = baseProject?.costs.materials || 30000
    const baseEquipmentCost = baseProject?.costs.equipment || 15000
    const baseOverheadCost = baseProject?.costs.overhead || 10000
    const baseProfit = baseProject?.costs.profit || 8000
    const baseDuration = baseProject?.durationWeeks || 12
    const baseCrewSize = baseProject?.crewSize || 4

    // Apply adjustments
    const adjustedCrewSize = Math.max(1, baseCrewSize + inputs.crewChange)
    const adjustedDuration = Math.max(1, baseDuration + inputs.scheduleChangeWeeks)
    
    // Labor adjustments
    const crewMultiplier = adjustedCrewSize / baseCrewSize
    const laborRateMultiplier = 1 + (inputs.laborRateChangePct || 0) / 100
    const adjustedLaborCost = baseLaborCost * crewMultiplier * laborRateMultiplier

    // Material adjustments
    const materialInflationMultiplier = 1 + (inputs.materialInflationPct || 0) / 100
    const adjustedMaterialCost = baseMaterialCost * materialInflationMultiplier

    // Equipment (scales with crew size)
    const adjustedEquipmentCost = baseEquipmentCost * crewMultiplier

    // Overhead adjustments
    const overheadMultiplier = 1 + (inputs.overheadChangePct || 0) / 100
    const adjustedOverheadCost = baseOverheadCost * overheadMultiplier

    // Total cost calculation
    const totalCost = adjustedLaborCost + adjustedMaterialCost + adjustedEquipmentCost + adjustedOverheadCost

    // Profit calculation
    const targetProfitPct = inputs.targetProfitPct || (baseProfit / (totalCost + baseProfit)) * 100
    const profitDollars = totalCost * (targetProfitPct / 100)
    const totalRevenue = totalCost + profitDollars

    // Unit calculations
    const projectSize = inputs.projectSize.units || inputs.projectSize.sqFt || inputs.projectSize.dollars || 1000
    const laborHours = (adjustedLaborCost / 75) // Assume $75/hour average
    const laborPerUnit = laborHours / projectSize

    // Gross margin
    const grossMarginPct = (profitDollars / totalRevenue) * 100

    // Profit percentage
    const profitPct = (profitDollars / totalCost) * 100

    // Generate alerts
    if (profitPct < 5) {
      alerts.push({
        message: 'Profit margin is below 5% - consider adjusting parameters',
        severity: 'critical',
      })
    }

    if (inputs.crewChange > 2) {
      alerts.push({
        message: 'Large crew size increase may require additional supervision costs',
        severity: 'warning',
      })
    }

    if (inputs.scheduleChangeWeeks < -4) {
      alerts.push({
        message: 'Aggressive schedule compression may increase overtime costs',
        severity: 'warning',
      })
    }

    if ((inputs.materialInflationPct || 0) > 10) {
      alerts.push({
        message: 'High material inflation - consider material buyout strategies',
        severity: 'info',
      })
    }

    // Simple cash flow forecast (weekly)
    const cashFlowForecast: Array<{ week: number; cash: number }> = []
    const weeklyRevenue = totalRevenue / adjustedDuration
    const weeklyCost = totalCost / adjustedDuration
    let cumulativeCash = 0

    for (let week = 1; week <= adjustedDuration; week++) {
      // Assume 70% of revenue comes in during work, 30% at completion
      const weeklyRevenueActual = week < adjustedDuration ? weeklyRevenue * 0.7 : weeklyRevenue * 0.3 + (totalRevenue * 0.3)
      cumulativeCash += weeklyRevenueActual - weeklyCost
      
      cashFlowForecast.push({
        week,
        cash: Math.round(cumulativeCash),
      })
    }

    return {
      totalRevenue: Math.round(totalRevenue),
      totalCost: Math.round(totalCost),
      grossMarginPct: Math.round(grossMarginPct * 100) / 100,
      laborHours: Math.round(laborHours),
      laborPerUnit: Math.round(laborPerUnit * 100) / 100,
      profitDollars: Math.round(profitDollars),
      profitPct: Math.round(profitPct * 100) / 100,
      cashFlowForecast,
      alerts,
    }
  }
}