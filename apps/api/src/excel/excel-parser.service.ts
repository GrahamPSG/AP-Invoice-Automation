import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import * as XLSX from 'xlsx'
import { CreateProjectDto } from '../projects/dto/create-project.dto'

export interface ParsedExcelData {
  headers: string[]
  rows: any[][]
  suggestedMapping: Record<string, string>
  projectData: Partial<CreateProjectDto>
}

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name)

  private readonly COLUMN_PATTERNS = {
    name: /project|job|name|title/i,
    scope: /scope|type|category|trade/i,
    labor: /labor|labour|manpower|crew/i,
    materials: /material|supplies|parts/i,
    equipment: /equipment|tools|machinery/i,
    overhead: /overhead|indirect|admin/i,
    profit: /profit|margin|markup/i,
    duration: /duration|weeks|days|schedule|timeline/i,
    crewSize: /crew.*size|team.*size|workers|headcount/i,
    revenue: /revenue|income|billing|total.*cost/i,
    units: /units|quantity|sqft|sq.*ft|square.*feet/i,
    dollars: /cost|price|amount|value|\$/i,
  }

  async parseExcelFile(buffer: Buffer, filename: string): Promise<ParsedExcelData> {
    try {
      this.logger.log(`Parsing Excel file: ${filename}`)
      
      // Read the workbook
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      
      // Get the first worksheet
      const worksheetName = workbook.SheetNames[0]
      if (!worksheetName) {
        throw new BadRequestException('No worksheets found in Excel file')
      }
      
      const worksheet = workbook.Sheets[worksheetName]
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false,
      }) as any[][]
      
      if (jsonData.length < 2) {
        throw new BadRequestException('Excel file must contain at least a header row and one data row')
      }
      
      const headers = jsonData[0].map(h => String(h).trim())
      const rows = jsonData.slice(1)
      
      // Generate suggested column mapping
      const suggestedMapping = this.generateColumnMapping(headers)
      
      // Extract project data from first row
      const projectData = this.extractProjectData(headers, rows[0], suggestedMapping)
      
      this.logger.log(`Successfully parsed Excel file with ${headers.length} columns and ${rows.length} rows`)
      
      return {
        headers,
        rows,
        suggestedMapping,
        projectData,
      }
      
    } catch (error) {
      this.logger.error(`Failed to parse Excel file: ${error.message}`)
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException(`Invalid Excel file format: ${error.message}`)
    }
  }

  private generateColumnMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {}
    
    for (const [key, pattern] of Object.entries(this.COLUMN_PATTERNS)) {
      const matchingHeader = headers.find(header => pattern.test(header))
      if (matchingHeader) {
        mapping[key] = matchingHeader
      }
    }
    
    return mapping
  }

  private extractProjectData(
    headers: string[],
    firstRow: any[],
    mapping: Record<string, string>
  ): Partial<CreateProjectDto> {
    const data: any = {}
    
    try {
      // Helper function to get value by mapped column
      const getValue = (key: string): any => {
        const columnName = mapping[key]
        if (!columnName) return undefined
        
        const columnIndex = headers.indexOf(columnName)
        if (columnIndex === -1) return undefined
        
        return firstRow[columnIndex]
      }
      
      // Extract basic project info
      const name = getValue('name')
      if (name) {
        data.name = String(name).trim()
      }
      
      // Extract scope - map common values
      const scopeValue = getValue('scope')
      if (scopeValue) {
        const scope = String(scopeValue).toLowerCase()
        if (scope.includes('plumb')) {
          data.scope = 'plumbing'
        } else if (scope.includes('hvac')) {
          data.scope = 'hvac'
        } else {
          data.scope = 'combined'
        }
      }
      
      // Extract numeric values with validation
      const parseNumber = (value: any): number | undefined => {
        if (value === null || value === undefined || value === '') return undefined
        const num = typeof value === 'string' 
          ? parseFloat(value.replace(/[$,]/g, '')) 
          : Number(value)
        return isNaN(num) ? undefined : Math.max(0, num)
      }
      
      // Cost breakdown
      const labor = parseNumber(getValue('labor'))
      const materials = parseNumber(getValue('materials'))
      const equipment = parseNumber(getValue('equipment'))
      const overhead = parseNumber(getValue('overhead'))
      const profit = parseNumber(getValue('profit'))
      
      if (labor !== undefined || materials !== undefined) {
        data.costs = {
          labor: labor || 0,
          materials: materials || 0,
          equipment: equipment || 0,
          overhead: overhead || 0,
          profit: profit || 0,
        }
      }
      
      // Project metrics
      const durationWeeks = parseNumber(getValue('duration'))
      if (durationWeeks !== undefined) {
        data.durationWeeks = Math.ceil(durationWeeks)
      }
      
      const crewSize = parseNumber(getValue('crewSize'))
      if (crewSize !== undefined) {
        data.crewSize = Math.ceil(crewSize)
      }
      
      const revenue = parseNumber(getValue('revenue'))
      if (revenue !== undefined) {
        data.revenuePerTechDay = revenue / ((durationWeeks || 12) * 5 * (crewSize || 4))
      }
      
      // Project size
      const units = parseNumber(getValue('units'))
      const dollars = parseNumber(getValue('dollars'))
      
      if (units !== undefined) {
        data.sizeUnits = units
      }
      if (dollars !== undefined) {
        data.sizeDollars = dollars
      }
      
      // Calculate profits if costs are available
      if (data.costs && revenue !== undefined) {
        const totalCost = data.costs.labor + data.costs.materials + data.costs.equipment + data.costs.overhead
        data.grossProfit = revenue - totalCost
        data.netProfit = data.grossProfit - data.costs.profit
      }
      
      this.logger.log(`Extracted project data: ${JSON.stringify(data)}`)
      
    } catch (error) {
      this.logger.warn(`Error extracting project data: ${error.message}`)
    }
    
    return data
  }

  validateColumnMapping(mapping: Record<string, string>, headers: string[]): string[] {
    const errors: string[] = []
    
    // Check that all mapped columns exist in headers
    for (const [field, column] of Object.entries(mapping)) {
      if (column && !headers.includes(column)) {
        errors.push(`Mapped column '${column}' for field '${field}' not found in Excel headers`)
      }
    }
    
    // Check for required mappings
    const requiredFields = ['name', 'scope']
    for (const field of requiredFields) {
      if (!mapping[field]) {
        errors.push(`Required field '${field}' must be mapped to a column`)
      }
    }
    
    return errors
  }
}