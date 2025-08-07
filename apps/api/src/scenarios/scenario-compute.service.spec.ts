import { Test, TestingModule } from '@nestjs/testing'
import { ScenarioComputeService } from './scenario-compute.service'
import { Project } from '../projects/project.entity'

describe('ScenarioComputeService', () => {
  let service: ScenarioComputeService

  const mockProject: Partial<Project> = {
    id: '1',
    name: 'Test Project',
    scope: 'plumbing',
    durationWeeks: 12,
    costs: {
      labor: 50000,
      materials: 30000,
      equipment: 15000,
      overhead: 10000,
      profit: 8000,
    },
    crewSize: 4,
    revenuePerTechDay: 500,
    grossProfit: 25000,
    netProfit: 17000,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScenarioComputeService],
    }).compile()

    service = module.get<ScenarioComputeService>(ScenarioComputeService)
  })

  describe('computeScenario', () => {
    it('should compute basic scenario without project base', () => {
      const inputs = {
        projectSize: { units: 100 },
        scope: ['plumbing'] as const,
        crewChange: 0,
        scheduleChangeWeeks: 0,
        overheadChangePct: 0,
        materialInflationPct: 0,
        laborRateChangePct: 0,
        targetProfitPct: 15,
      }

      const result = service.computeScenario(inputs)

      expect(result).toHaveProperty('totalRevenue')
      expect(result).toHaveProperty('totalCost')
      expect(result).toHaveProperty('profitDollars')
      expect(result).toHaveProperty('profitPct')
      expect(result).toHaveProperty('grossMarginPct')
      expect(result).toHaveProperty('laborHours')
      expect(result).toHaveProperty('laborPerUnit')
      expect(result).toHaveProperty('cashFlowForecast')
      expect(result).toHaveProperty('alerts')

      expect(typeof result.totalRevenue).toBe('number')
      expect(typeof result.totalCost).toBe('number')
      expect(result.profitPct).toBeCloseTo(15, 1)
      expect(result.alerts).toBeInstanceOf(Array)
      expect(result.cashFlowForecast).toBeInstanceOf(Array)
    })

    it('should compute scenario with project base', () => {
      const inputs = {
        projectSize: { units: 100 },
        scope: ['plumbing'] as const,
        crewChange: 1, // Add 1 crew member
        scheduleChangeWeeks: -2, // Compress by 2 weeks
        overheadChangePct: 5,
        materialInflationPct: 10,
        laborRateChangePct: 8,
        targetProfitPct: 20,
      }

      const result = service.computeScenario(inputs, mockProject as Project)

      // Check that crew size adjustment affects costs
      expect(result.totalCost).toBeGreaterThan(0)
      expect(result.totalRevenue).toBeGreaterThan(result.totalCost)
      expect(result.profitDollars).toBe(result.totalRevenue - result.totalCost)
      
      // Check that target profit is approximately met
      expect(result.profitPct).toBeCloseTo(20, 0)
      
      // Check cash flow forecast
      expect(result.cashFlowForecast.length).toBe(10) // 12 - 2 weeks
      expect(result.cashFlowForecast[0]).toHaveProperty('week', 1)
      expect(result.cashFlowForecast[0]).toHaveProperty('cash')
    })

    it('should generate alerts for risky scenarios', () => {
      const inputs = {
        projectSize: { units: 100 },
        scope: ['plumbing'] as const,
        crewChange: 5, // Large crew increase
        scheduleChangeWeeks: -8, // Aggressive compression
        overheadChangePct: 0,
        materialInflationPct: 15, // High inflation
        laborRateChangePct: 0,
        targetProfitPct: 3, // Low profit target
      }

      const result = service.computeScenario(inputs, mockProject as Project)

      expect(result.alerts.length).toBeGreaterThan(0)
      
      // Check for specific alert types
      const alertMessages = result.alerts.map(alert => alert.message)
      expect(alertMessages.some(msg => msg.includes('profit margin'))).toBe(true)
      expect(alertMessages.some(msg => msg.includes('crew size'))).toBe(true)
      expect(alertMessages.some(msg => msg.includes('schedule compression'))).toBe(true)
      expect(alertMessages.some(msg => msg.includes('material inflation'))).toBe(true)

      // Check alert severities
      const severities = result.alerts.map(alert => alert.severity)
      expect(severities).toContain('critical')
      expect(severities).toContain('warning')
    })

    it('should handle edge cases gracefully', () => {
      const inputs = {
        projectSize: { units: 0 },
        scope: ['combined'] as const,
        crewChange: -10, // Remove all crew (should default to minimum)
        scheduleChangeWeeks: -100, // Extreme schedule compression
        overheadChangePct: -50, // Reduce overhead
        materialInflationPct: -25, // Deflation
        laborRateChangePct: -30, // Rate reduction
        targetProfitPct: 0, // No profit
      }

      const result = service.computeScenario(inputs, mockProject as Project)

      // Should not throw errors and provide valid results
      expect(result.totalCost).toBeGreaterThan(0)
      expect(result.totalRevenue).toBeGreaterThan(0)
      expect(result.laborHours).toBeGreaterThan(0)
      expect(result.cashFlowForecast.length).toBeGreaterThan(0)
      
      // Minimum constraints should be applied
      expect(result.cashFlowForecast.length).toBeGreaterThanOrEqual(1)
    })

    it('should calculate labor per unit correctly', () => {
      const inputs = {
        projectSize: { units: 50 },
        scope: ['hvac'] as const,
        crewChange: 0,
        scheduleChangeWeeks: 0,
        laborRateChangePct: 0,
      }

      const result = service.computeScenario(inputs, mockProject as Project)

      expect(result.laborPerUnit).toBe(result.laborHours / 50)
      expect(result.laborPerUnit).toBeGreaterThan(0)
    })

    it('should handle different project sizes', () => {
      const scenarios = [
        { projectSize: { units: 100 }, expectedUnits: 100 },
        { projectSize: { sqFt: 5000 }, expectedUnits: 5000 },
        { projectSize: { dollars: 250000 }, expectedUnits: 250000 },
        { projectSize: { units: 50, sqFt: 3000 }, expectedUnits: 50 }, // Units takes precedence
      ]

      scenarios.forEach(({ projectSize, expectedUnits }) => {
        const inputs = {
          projectSize,
          scope: ['plumbing'] as const,
          crewChange: 0,
          scheduleChangeWeeks: 0,
        }

        const result = service.computeScenario(inputs)
        const actualUnits = projectSize.units || projectSize.sqFt || projectSize.dollars || 1000
        
        expect(result.laborPerUnit).toBe(result.laborHours / actualUnits)
      })
    })
  })
})