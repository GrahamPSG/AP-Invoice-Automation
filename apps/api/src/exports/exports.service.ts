import { Injectable, Logger } from '@nestjs/common'
import * as XLSX from 'xlsx'
import * as puppeteer from 'puppeteer'
import { Scenario } from '../scenarios/scenario.entity'

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name)

  async generatePdfReport(scenario: Scenario): Promise<Buffer> {
    this.logger.log(`Generating PDF report for scenario ${scenario.id}`)
    
    let browser: puppeteer.Browser | null = null
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      
      const page = await browser.newPage()
      
      // Generate HTML content
      const htmlContent = this.generateHtmlReport(scenario)
      
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      })
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      })
      
      return Buffer.from(pdfBuffer)
      
    } catch (error) {
      this.logger.error(`Failed to generate PDF: ${error.message}`)
      throw error
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  async generateExcelReport(scenario: Scenario): Promise<Buffer> {
    this.logger.log(`Generating Excel report for scenario ${scenario.id}`)
    
    try {
      const workbook = XLSX.utils.book_new()
      
      // Summary sheet
      const summaryData = [
        ['What-If Scenario Report'],
        [''],
        ['Scenario ID', scenario.id],
        ['Created', scenario.createdAt.toLocaleDateString()],
        ['Public', scenario.isPublic ? 'Yes' : 'No'],
        [''],
        ['FINANCIAL SUMMARY'],
        ['Total Revenue', `$${scenario.outputs.totalRevenue.toLocaleString()}`],
        ['Total Cost', `$${scenario.outputs.totalCost.toLocaleString()}`],
        ['Profit', `$${scenario.outputs.profitDollars.toLocaleString()}`],
        ['Profit %', `${scenario.outputs.profitPct.toFixed(1)}%`],
        ['Gross Margin %', `${scenario.outputs.grossMarginPct.toFixed(1)}%`],
        [''],
        ['OPERATIONAL METRICS'],
        ['Labor Hours', scenario.outputs.laborHours.toLocaleString()],
        ['Labor per Unit', `${scenario.outputs.laborPerUnit.toFixed(2)} hrs`],
      ]
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      
      // Input parameters sheet
      const inputsData = [
        ['INPUT PARAMETERS'],
        [''],
        ['Project Size'],
        ['Units', scenario.inputs.projectSize.units || 'N/A'],
        ['Square Feet', scenario.inputs.projectSize.sqFt || 'N/A'],
        ['Dollar Value', scenario.inputs.projectSize.dollars ? `$${scenario.inputs.projectSize.dollars.toLocaleString()}` : 'N/A'],
        [''],
        ['Scope', scenario.inputs.scope.join(', ')],
        [''],
        ['ADJUSTMENTS'],
        ['Crew Change', scenario.inputs.crewChange],
        ['Schedule Change (weeks)', scenario.inputs.scheduleChangeWeeks],
        ['Overhead Change %', scenario.inputs.overheadChangePct || 0],
        ['Material Inflation %', scenario.inputs.materialInflationPct || 0],
        ['Labor Rate Change %', scenario.inputs.laborRateChangePct || 0],
        ['Target Profit %', scenario.inputs.targetProfitPct || 0],
      ]
      
      const inputsSheet = XLSX.utils.aoa_to_sheet(inputsData)
      XLSX.utils.book_append_sheet(workbook, inputsSheet, 'Inputs')
      
      // Cash flow sheet
      const cashFlowData = [
        ['CASH FLOW FORECAST'],
        [''],
        ['Week', 'Cumulative Cash Flow'],
        ...scenario.outputs.cashFlowForecast.map(point => [
          point.week,
          point.cash
        ])
      ]
      
      const cashFlowSheet = XLSX.utils.aoa_to_sheet(cashFlowData)
      XLSX.utils.book_append_sheet(workbook, cashFlowSheet, 'Cash Flow')
      
      // Alerts sheet
      if (scenario.outputs.alerts.length > 0) {
        const alertsData = [
          ['ALERTS AND RECOMMENDATIONS'],
          [''],
          ['Severity', 'Message'],
          ...scenario.outputs.alerts.map(alert => [
            alert.severity.toUpperCase(),
            alert.message
          ])
        ]
        
        const alertsSheet = XLSX.utils.aoa_to_sheet(alertsData)
        XLSX.utils.book_append_sheet(workbook, alertsSheet, 'Alerts')
      }
      
      // Generate buffer
      const buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx'
      })
      
      return buffer
      
    } catch (error) {
      this.logger.error(`Failed to generate Excel: ${error.message}`)
      throw error
    }
  }

  private generateHtmlReport(scenario: Scenario): string {
    const formatCurrency = (value: number) => `$${value.toLocaleString()}`
    const formatPercent = (value: number) => `${value.toFixed(1)}%`
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>What-If Scenario Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #3b82f6;
          margin: 0;
          font-size: 2.5em;
        }
        .header p {
          color: #666;
          margin: 10px 0;
        }
        .section {
          margin-bottom: 30px;
          break-inside: avoid;
        }
        .section h2 {
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .metric-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        .metric-card h3 {
          margin: 0 0 10px 0;
          color: #374151;
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .metric-card .value {
          font-size: 1.8em;
          font-weight: bold;
          color: #1f2937;
          margin: 0;
        }
        .profit-positive { color: #10b981; }
        .profit-negative { color: #ef4444; }
        .profit-neutral { color: #f59e0b; }
        .inputs-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .inputs-table th,
        .inputs-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .inputs-table th {
          background: #f9fafb;
          font-weight: 600;
        }
        .cash-flow-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 0.9em;
        }
        .cash-flow-table th,
        .cash-flow-table td {
          padding: 8px 12px;
          text-align: right;
          border-bottom: 1px solid #e5e7eb;
        }
        .cash-flow-table th {
          background: #f9fafb;
          font-weight: 600;
        }
        .alert {
          padding: 12px 16px;
          margin: 10px 0;
          border-radius: 6px;
          border-left: 4px solid;
        }
        .alert-critical {
          background: #fef2f2;
          border-color: #ef4444;
          color: #991b1b;
        }
        .alert-warning {
          background: #fffbeb;
          border-color: #f59e0b;
          color: #92400e;
        }
        .alert-info {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #1e40af;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 0.9em;
        }
        @media print {
          .section { break-inside: avoid; }
          .metrics-grid { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>What-If Scenario Report</h1>
        <p>Scenario ID: ${scenario.id}</p>
        <p>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        <p>Created: ${scenario.createdAt.toLocaleDateString()}</p>
      </div>

      <div class="section">
        <h2>Executive Summary</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <h3>Total Revenue</h3>
            <p class="value">${formatCurrency(scenario.outputs.totalRevenue)}</p>
          </div>
          <div class="metric-card">
            <h3>Total Cost</h3>
            <p class="value">${formatCurrency(scenario.outputs.totalCost)}</p>
          </div>
          <div class="metric-card">
            <h3>Profit</h3>
            <p class="value ${scenario.outputs.profitDollars >= 0 ? 'profit-positive' : 'profit-negative'}">
              ${formatCurrency(scenario.outputs.profitDollars)}
            </p>
          </div>
          <div class="metric-card">
            <h3>Profit Margin</h3>
            <p class="value ${scenario.outputs.profitPct >= 15 ? 'profit-positive' : scenario.outputs.profitPct >= 10 ? 'profit-neutral' : 'profit-negative'}">
              ${formatPercent(scenario.outputs.profitPct)}
            </p>
          </div>
          <div class="metric-card">
            <h3>Gross Margin</h3>
            <p class="value">${formatPercent(scenario.outputs.grossMarginPct)}</p>
          </div>
          <div class="metric-card">
            <h3>Labor Hours</h3>
            <p class="value">${scenario.outputs.laborHours.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Input Parameters</h2>
        <table class="inputs-table">
          <tr><th>Parameter</th><th>Value</th></tr>
          <tr><td>Project Scope</td><td>${scenario.inputs.scope.join(', ')}</td></tr>
          <tr><td>Project Size (Units)</td><td>${scenario.inputs.projectSize.units || 'N/A'}</td></tr>
          <tr><td>Project Size (Sq Ft)</td><td>${scenario.inputs.projectSize.sqFt || 'N/A'}</td></tr>
          <tr><td>Project Size ($)</td><td>${scenario.inputs.projectSize.dollars ? formatCurrency(scenario.inputs.projectSize.dollars) : 'N/A'}</td></tr>
          <tr><td>Crew Change</td><td>${scenario.inputs.crewChange > 0 ? '+' : ''}${scenario.inputs.crewChange} people</td></tr>
          <tr><td>Schedule Change</td><td>${scenario.inputs.scheduleChangeWeeks > 0 ? '+' : ''}${scenario.inputs.scheduleChangeWeeks} weeks</td></tr>
          <tr><td>Overhead Change</td><td>${scenario.inputs.overheadChangePct || 0}%</td></tr>
          <tr><td>Material Inflation</td><td>${scenario.inputs.materialInflationPct || 0}%</td></tr>
          <tr><td>Labor Rate Change</td><td>${scenario.inputs.laborRateChangePct || 0}%</td></tr>
          <tr><td>Target Profit</td><td>${scenario.inputs.targetProfitPct || 0}%</td></tr>
        </table>
      </div>

      ${scenario.outputs.cashFlowForecast.length > 0 ? `
      <div class="section">
        <h2>Cash Flow Forecast</h2>
        <table class="cash-flow-table">
          <thead>
            <tr><th>Week</th><th>Cumulative Cash Flow</th></tr>
          </thead>
          <tbody>
            ${scenario.outputs.cashFlowForecast.map(point => 
              `<tr><td>${point.week}</td><td>${formatCurrency(point.cash)}</td></tr>`
            ).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${scenario.outputs.alerts.length > 0 ? `
      <div class="section">
        <h2>Alerts & Recommendations</h2>
        ${scenario.outputs.alerts.map(alert => 
          `<div class="alert alert-${alert.severity}">${alert.message}</div>`
        ).join('')}
      </div>
      ` : ''}

      <div class="footer">
        <p>Generated by What-If Calculator • Built with Claude Code</p>
      </div>
    </body>
    </html>
    `
  }
}