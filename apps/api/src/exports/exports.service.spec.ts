import { Test, TestingModule } from '@nestjs/testing'
import { Logger } from '@nestjs/common'
import { ExportsService } from './exports.service'
import { Scenario } from '../scenarios/scenario.entity'
import * as XLSX from 'xlsx'
import * as puppeteer from 'puppeteer'

// Mock external dependencies
jest.mock('xlsx')
jest.mock('puppeteer')

const mockXLSX = XLSX as jest.Mocked<typeof XLSX>
const mockPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>

describe('ExportsService', () => {
  let service: ExportsService
  let mockBrowser: jest.Mocked<puppeteer.Browser>
  let mockPage: jest.Mocked<puppeteer.Page>

  const mockScenario: Scenario = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    inputs: {
      projectSize: { units: 100, sqFt: 5000, dollars: 250000 },
      scope: ['plumbing', 'hvac'],
      crewChange: 2,
      scheduleChangeWeeks: -1,
      overheadChangePct: 5,
      materialInflationPct: 3,
      laborRateChangePct: 2,
      targetProfitPct: 15,
    },
    outputs: {
      totalRevenue: 300000,
      totalCost: 255000,
      profitDollars: 45000,
      profitPct: 15.0,
      grossMarginPct: 18.2,
      laborHours: 2400,
      laborPerUnit: 24.0,
      cashFlowForecast: [
        { week: 1, cash: -50000 },
        { week: 2, cash: -25000 },
        { week: 3, cash: 0 },
        { week: 4, cash: 45000 },
      ],
      alerts: [
        { severity: 'warning', message: 'Crew size increase may impact project coordination' },
        { severity: 'info', message: 'Schedule compression detected, monitor quality metrics' },
      ],
    },
    isPublic: false,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    user: null,
    project: null,
  } as Scenario

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup puppeteer mocks
    mockPage = {
      setContent: jest.fn(),
      pdf: jest.fn(),
    } as any

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    } as any

    mockPuppeteer.launch = jest.fn().mockResolvedValue(mockBrowser)

    // Setup XLSX mocks
    const mockWorkbook = { SheetNames: [], Sheets: {} }
    const mockSheet = {}
    
    mockXLSX.utils = {
      book_new: jest.fn().mockReturnValue(mockWorkbook),
      aoa_to_sheet: jest.fn().mockReturnValue(mockSheet),
      book_append_sheet: jest.fn(),
    } as any

    mockXLSX.write = jest.fn().mockReturnValue(Buffer.from('mock-excel-data'))

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportsService],
    }).compile()

    service = module.get<ExportsService>(ExportsService)
  })

  describe('generatePdfReport', () => {
    it('should generate PDF successfully', async () => {
      const mockPdfBuffer = Buffer.from('mock-pdf-data')
      mockPage.pdf.mockResolvedValue(mockPdfBuffer)

      const result = await service.generatePdfReport(mockScenario)

      expect(mockPuppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      expect(mockBrowser.newPage).toHaveBeenCalled()
      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('What-If Scenario Report'),
        { waitUntil: 'networkidle0' }
      )
      expect(mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      })
      expect(mockBrowser.close).toHaveBeenCalled()
      expect(result).toEqual(mockPdfBuffer)
    })

    it('should handle PDF generation errors', async () => {
      const error = new Error('PDF generation failed')
      mockPage.pdf.mockRejectedValue(error)

      await expect(service.generatePdfReport(mockScenario))
        .rejects.toThrow('PDF generation failed')
      
      expect(mockBrowser.close).toHaveBeenCalled()
    })

    it('should close browser even if PDF generation fails', async () => {
      mockBrowser.newPage.mockRejectedValue(new Error('Browser error'))

      await expect(service.generatePdfReport(mockScenario))
        .rejects.toThrow('Browser error')
      
      expect(mockBrowser.close).toHaveBeenCalled()
    })

    it('should generate correct HTML content', async () => {
      const mockPdfBuffer = Buffer.from('mock-pdf-data')
      mockPage.pdf.mockResolvedValue(mockPdfBuffer)

      await service.generatePdfReport(mockScenario)

      const htmlContent = mockPage.setContent.mock.calls[0][0]
      
      // Check that HTML contains key scenario data
      expect(htmlContent).toContain('What-If Scenario Report')
      expect(htmlContent).toContain(mockScenario.id)
      expect(htmlContent).toContain('$300,000') // Total revenue
      expect(htmlContent).toContain('$255,000') // Total cost
      expect(htmlContent).toContain('$45,000') // Profit
      expect(htmlContent).toContain('15.0%') // Profit percentage
      expect(htmlContent).toContain('plumbing, hvac') // Scope
      expect(htmlContent).toContain('Crew size increase may impact') // Alert message
    })
  })

  describe('generateExcelReport', () => {
    it('should generate Excel successfully', async () => {
      const result = await service.generateExcelReport(mockScenario)

      expect(mockXLSX.utils.book_new).toHaveBeenCalled()
      expect(mockXLSX.utils.aoa_to_sheet).toHaveBeenCalledTimes(4) // Summary, Inputs, Cash Flow, Alerts
      expect(mockXLSX.utils.book_append_sheet).toHaveBeenCalledTimes(4)
      expect(mockXLSX.write).toHaveBeenCalledWith(
        expect.any(Object),
        { type: 'buffer', bookType: 'xlsx' }
      )
      expect(result).toEqual(Buffer.from('mock-excel-data'))
    })

    it('should create summary sheet with correct data', async () => {
      await service.generateExcelReport(mockScenario)

      const summaryCall = mockXLSX.utils.aoa_to_sheet.mock.calls.find(call => 
        call[0][0][0] === 'What-If Scenario Report'
      )

      expect(summaryCall).toBeDefined()
      const summaryData = summaryCall[0]
      
      // Check key summary data
      expect(summaryData).toContainEqual(['Scenario ID', mockScenario.id])
      expect(summaryData).toContainEqual(['Total Revenue', '$300,000'])
      expect(summaryData).toContainEqual(['Total Cost', '$255,000'])
      expect(summaryData).toContainEqual(['Profit', '$45,000'])
      expect(summaryData).toContainEqual(['Profit %', '15.0%'])
      expect(summaryData).toContainEqual(['Labor Hours', '2,400'])
    })

    it('should create inputs sheet with correct parameters', async () => {
      await service.generateExcelReport(mockScenario)

      const inputsCall = mockXLSX.utils.aoa_to_sheet.mock.calls.find(call => 
        call[0][0][0] === 'INPUT PARAMETERS'
      )

      expect(inputsCall).toBeDefined()
      const inputsData = inputsCall[0]
      
      expect(inputsData).toContainEqual(['Scope', 'plumbing, hvac'])
      expect(inputsData).toContainEqual(['Units', 100])
      expect(inputsData).toContainEqual(['Square Feet', 5000])
      expect(inputsData).toContainEqual(['Dollar Value', '$250,000'])
      expect(inputsData).toContainEqual(['Crew Change', 2])
      expect(inputsData).toContainEqual(['Schedule Change (weeks)', -1])
    })

    it('should create cash flow sheet with forecast data', async () => {
      await service.generateExcelReport(mockScenario)

      const cashFlowCall = mockXLSX.utils.aoa_to_sheet.mock.calls.find(call => 
        call[0][0][0] === 'CASH FLOW FORECAST'
      )

      expect(cashFlowCall).toBeDefined()
      const cashFlowData = cashFlowCall[0]
      
      expect(cashFlowData).toContainEqual([1, -50000])
      expect(cashFlowData).toContainEqual([2, -25000])
      expect(cashFlowData).toContainEqual([3, 0])
      expect(cashFlowData).toContainEqual([4, 45000])
    })

    it('should create alerts sheet when alerts exist', async () => {
      await service.generateExcelReport(mockScenario)

      const alertsCall = mockXLSX.utils.aoa_to_sheet.mock.calls.find(call => 
        call[0][0][0] === 'ALERTS AND RECOMMENDATIONS'
      )

      expect(alertsCall).toBeDefined()
      const alertsData = alertsCall[0]
      
      expect(alertsData).toContainEqual(['WARNING', 'Crew size increase may impact project coordination'])
      expect(alertsData).toContainEqual(['INFO', 'Schedule compression detected, monitor quality metrics'])
    })

    it('should skip alerts sheet when no alerts exist', async () => {
      const scenarioWithoutAlerts = { 
        ...mockScenario, 
        outputs: { ...mockScenario.outputs, alerts: [] }
      }

      await service.generateExcelReport(scenarioWithoutAlerts)

      expect(mockXLSX.utils.book_append_sheet).toHaveBeenCalledTimes(3) // Only Summary, Inputs, Cash Flow
    })

    it('should handle Excel generation errors', async () => {
      mockXLSX.write.mockImplementation(() => {
        throw new Error('Excel generation failed')
      })

      await expect(service.generateExcelReport(mockScenario))
        .rejects.toThrow('Excel generation failed')
    })

    it('should handle scenarios with minimal data', async () => {
      const minimalScenario = {
        ...mockScenario,
        inputs: {
          ...mockScenario.inputs,
          projectSize: { units: 50 }, // Only units, no sqFt or dollars
        }
      }

      await service.generateExcelReport(minimalScenario)

      const inputsCall = mockXLSX.utils.aoa_to_sheet.mock.calls.find(call => 
        call[0][0][0] === 'INPUT PARAMETERS'
      )

      const inputsData = inputsCall[0]
      expect(inputsData).toContainEqual(['Units', 50])
      expect(inputsData).toContainEqual(['Square Feet', 'N/A'])
      expect(inputsData).toContainEqual(['Dollar Value', 'N/A'])
    })
  })

  describe('error handling and logging', () => {
    it('should log PDF generation start and errors', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log')
      const errorSpy = jest.spyOn(Logger.prototype, 'error')
      
      mockPage.pdf.mockRejectedValue(new Error('Test error'))

      try {
        await service.generatePdfReport(mockScenario)
      } catch (error) {
        // Expected to throw
      }

      expect(loggerSpy).toHaveBeenCalledWith(
        `Generating PDF report for scenario ${mockScenario.id}`
      )
      expect(errorSpy).toHaveBeenCalledWith('Failed to generate PDF: Test error')
    })

    it('should log Excel generation start and errors', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log')
      const errorSpy = jest.spyOn(Logger.prototype, 'error')
      
      mockXLSX.utils.book_new.mockImplementation(() => {
        throw new Error('Test Excel error')
      })

      try {
        await service.generateExcelReport(mockScenario)
      } catch (error) {
        // Expected to throw
      }

      expect(loggerSpy).toHaveBeenCalledWith(
        `Generating Excel report for scenario ${mockScenario.id}`
      )
      expect(errorSpy).toHaveBeenCalledWith('Failed to generate Excel: Test Excel error')
    })
  })
})