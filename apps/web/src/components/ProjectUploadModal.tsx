import { useState } from 'react'

interface ProjectUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProjectData) => void
}

interface ProjectData {
  // Basic Info
  projectType: 'custom-homes' | 'multi-family'
  projectName: string
  duration: number
  durationUnit: 'weeks' | 'months'
  
  // Project Size
  sizeMetric: 'units' | 'sqft' | 'value'
  sizeValue: number
  
  // Scope
  scopeType: 'plumbing' | 'hvac' | 'combined' | 'electrical' | 'general'
  
  // Labor
  laborHoursEstimated: number
  laborHoursActual: number
  
  // Cost Breakdowns
  laborCost: number
  materialCost: number
  equipmentCost: number
  subcontractorCost: number
  permitsRentalsCost: number
  overheadAllocation: number
  
  // Profit
  grossProfit: number
  netProfit: number
  
  // Crew & Performance
  crewSize: number
  phases: string
  revenuePerTech: number
  revenuePerDay: number
}

const ProjectUploadModal = ({ isOpen, onClose, onSubmit }: ProjectUploadModalProps) => {
  const [step, setStep] = useState<'upload' | 'form'>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false)
  const [formData, setFormData] = useState<ProjectData>({
    projectType: 'custom-homes',
    projectName: '',
    duration: 0,
    durationUnit: 'weeks',
    sizeMetric: 'sqft',
    sizeValue: 0,
    scopeType: 'combined',
    laborHoursEstimated: 0,
    laborHoursActual: 0,
    laborCost: 0,
    materialCost: 0,
    equipmentCost: 0,
    subcontractorCost: 0,
    permitsRentalsCost: 0,
    overheadAllocation: 0,
    grossProfit: 0,
    netProfit: 0,
    crewSize: 0,
    phases: '',
    revenuePerTech: 0,
    revenuePerDay: 0
  })

  const handleInputChange = (field: keyof ProjectData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    
    // Simulate Excel parsing and data extraction
    // In a real implementation, you'd use a library like SheetJS to parse Excel files
    const simulatedData = await simulateExcelParsing(file)
    
    // Update form data with parsed values
    setFormData(prev => ({ ...prev, ...simulatedData.data }))
    
    // Track missing fields
    setMissingFields(simulatedData.missingFields)
    
    // Show missing fields popup if any
    if (simulatedData.missingFields.length > 0) {
      setShowMissingFieldsModal(true)
    }
    
    // Move to form step
    setStep('form')
  }

  const simulateExcelParsing = async (_file: File): Promise<{
    data: Partial<ProjectData>
    missingFields: string[]
  }> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simulate extracted data from Excel (you'd implement real parsing here)
    const extractedData: Partial<ProjectData> = {
      projectName: 'COPA21101 - 1263 Balfour Avenue', // Found in Excel
      projectType: 'custom-homes', // Found in Excel
      laborCost: 89200, // Found in Excel
      materialCost: 156800, // Found in Excel
      equipmentCost: 12500, // Found in Excel
      laborHoursActual: 712, // Found in Excel
      crewSize: 8, // Found in Excel
      duration: 12, // Found in Excel
      durationUnit: 'weeks', // Found in Excel
      // Some fields missing from Excel
    }
    
    // Fields that couldn't be found in the spreadsheet
    const missingFields = [
      'Subcontractor Cost',
      'Permits & Rentals Cost', 
      'Overhead Allocation',
      'Gross Profit',
      'Net Profit',
      'Revenue per Tech',
      'Project Phases'
    ]
    
    return { data: extractedData, missingFields }
  }

  const getFieldStyle = (fieldName: string) => {
    const isHighlighted = missingFields.some(field => 
      field.toLowerCase().includes(fieldName.toLowerCase()) ||
      fieldName.toLowerCase().includes(field.toLowerCase().replace(/[^a-z]/g, ''))
    )
    
    return {
      border: isHighlighted ? '2px solid #ef4444' : '1px solid rgba(0, 0, 0, 0.2)',
      background: isHighlighted ? '#fef2f2' : 'white'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  const calculateTotalCost = () => {
    return formData.laborCost + formData.materialCost + formData.equipmentCost + 
           formData.subcontractorCost + formData.permitsRentalsCost + formData.overheadAllocation
  }

  const calculateRevenue = () => {
    return calculateTotalCost() + formData.grossProfit
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%',
        maxHeight: '95vh',
        overflow: 'auto',
        margin: 0,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        color: '#111827'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>
            {step === 'upload' ? 'Upload Project Spreadsheet' : 'Review & Complete Project Data'}
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              padding: '0.5rem',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {step === 'upload' ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ 
              border: '2px dashed #d1d5db', 
              borderRadius: '12px', 
              padding: '3rem', 
              marginBottom: '2rem',
              background: '#f9fafb'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <h3 style={{ color: '#111827', marginBottom: '1rem' }}>Upload Your Project Spreadsheet</h3>
              <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: '1.5' }}>
                Upload your Excel file with project data. We'll automatically scan and extract:
                <br />• Project details and scope
                <br />• Labor analysis and cost breakdowns
                <br />• Profit analysis and crew metrics
              </p>
              
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 2rem',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  border: 'none',
                  fontSize: '16px'
                }}
              >
                📁 Choose Excel File
              </label>
              
              {uploadedFile && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: '#e0f2fe', 
                  borderRadius: '8px',
                  color: '#0369a1'
                }}>
                  ✅ Uploaded: {uploadedFile.name}
                  <br />
                  <div style={{ fontSize: '14px', marginTop: '0.5rem' }}>
                    Processing spreadsheet and extracting data...
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '1rem'
            }}>
              Supported formats: .xlsx, .xls, .csv
            </div>
          </div>
        ) : (
          <>
            {/* Missing Fields Modal */}
            {showMissingFieldsModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1001
              }}>
                <div style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '12px',
                  maxWidth: '500px',
                  width: '90%',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
                }}>
                  <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Missing Information</h3>
                  <p style={{ marginBottom: '1rem', color: '#374151' }}>
                    We couldn't find the following information in your spreadsheet. 
                    Please fill in these fields manually (highlighted in red):
                  </p>
                  <ul style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
                    {missingFields.map((field, index) => (
                      <li key={index} style={{ marginBottom: '0.5rem' }}>• {field}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setShowMissingFieldsModal(false)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Continue to Form
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Basic Project Info */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Project Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Project Name</label>
                <input 
                  type="text" 
                  value={formData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  placeholder="e.g., COPA21101 - 1263 Balfour Avenue"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    ...getFieldStyle('projectName')
                  }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Project Type</label>
                <select 
                  className="form-input"
                  value={formData.projectType}
                  onChange={(e) => handleInputChange('projectType', e.target.value as 'custom-homes' | 'multi-family')}
                >
                  <option value="custom-homes">Custom Homes</option>
                  <option value="multi-family">Multi Family</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', Number(e.target.value))}
                    placeholder="12"
                    required
                  />
                  <select 
                    className="form-input"
                    style={{ minWidth: '100px' }}
                    value={formData.durationUnit}
                    onChange={(e) => handleInputChange('durationUnit', e.target.value as 'weeks' | 'months')}
                  >
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Project Size</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formData.sizeValue}
                    onChange={(e) => handleInputChange('sizeValue', Number(e.target.value))}
                    placeholder="2500"
                    required
                  />
                  <select 
                    className="form-input"
                    style={{ minWidth: '100px' }}
                    value={formData.sizeMetric}
                    onChange={(e) => handleInputChange('sizeMetric', e.target.value as 'units' | 'sqft' | 'value')}
                  >
                    <option value="units">Units</option>
                    <option value="sqft">Sq.Ft.</option>
                    <option value="value">$ Value</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Scope Type</label>
                <select 
                  className="form-input"
                  value={formData.scopeType}
                  onChange={(e) => handleInputChange('scopeType', e.target.value as any)}
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="hvac">HVAC</option>
                  <option value="combined">Combined</option>
                  <option value="electrical">Electrical</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
          </div>

          {/* Labor Hours */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Labor Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Estimated Labor Hours</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.laborHoursEstimated}
                  onChange={(e) => handleInputChange('laborHoursEstimated', Number(e.target.value))}
                  placeholder="640"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Actual Labor Hours</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.laborHoursActual}
                  onChange={(e) => handleInputChange('laborHoursActual', Number(e.target.value))}
                  placeholder="712"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Hours Variance</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={`${((formData.laborHoursActual - formData.laborHoursEstimated) / formData.laborHoursEstimated * 100 || 0).toFixed(1)}%`}
                  disabled
                  style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                />
              </div>
            </div>
          </div>

          {/* Cost Breakdowns */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Cost Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Labor Cost</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.laborCost}
                  onChange={(e) => handleInputChange('laborCost', Number(e.target.value))}
                  placeholder="89200"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Materials</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.materialCost}
                  onChange={(e) => handleInputChange('materialCost', Number(e.target.value))}
                  placeholder="156800"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Equipment</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.equipmentCost}
                  onChange={(e) => handleInputChange('equipmentCost', Number(e.target.value))}
                  placeholder="12500"
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Subcontractors</label>
                <input 
                  type="number" 
                  value={formData.subcontractorCost}
                  onChange={(e) => handleInputChange('subcontractorCost', Number(e.target.value))}
                  placeholder="25000"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    ...getFieldStyle('subcontractor')
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Permits & Rentals</label>
                <input 
                  type="number" 
                  value={formData.permitsRentalsCost}
                  onChange={(e) => handleInputChange('permitsRentalsCost', Number(e.target.value))}
                  placeholder="8500"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    ...getFieldStyle('permits')
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Overhead Allocation</label>
                <input 
                  type="number" 
                  value={formData.overheadAllocation}
                  onChange={(e) => handleInputChange('overheadAllocation', Number(e.target.value))}
                  placeholder="32500"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    ...getFieldStyle('overhead')
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <strong>Total Cost: ${calculateTotalCost().toLocaleString()}</strong>
            </div>
          </div>

          {/* Profit Analysis */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Profit Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Gross Profit</label>
                <input 
                  type="number" 
                  value={formData.grossProfit}
                  onChange={(e) => handleInputChange('grossProfit', Number(e.target.value))}
                  placeholder="60000"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    ...getFieldStyle('gross profit')
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Net Profit</label>
                <input 
                  type="number" 
                  value={formData.netProfit}
                  onChange={(e) => handleInputChange('netProfit', Number(e.target.value))}
                  placeholder="45000"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    ...getFieldStyle('net profit')
                  }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Profit Margin</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={`${((formData.grossProfit / calculateRevenue()) * 100 || 0).toFixed(1)}%`}
                  disabled
                  style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <strong>Total Revenue: ${calculateRevenue().toLocaleString()}</strong>
            </div>
          </div>

          {/* Crew & Performance */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Crew & Performance Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Crew Size</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.crewSize}
                  onChange={(e) => handleInputChange('crewSize', Number(e.target.value))}
                  placeholder="8"
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Revenue per Tech</label>
                <input 
                  type="number" 
                  value={formData.revenuePerTech}
                  onChange={(e) => handleInputChange('revenuePerTech', Number(e.target.value))}
                  placeholder="40562"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    ...getFieldStyle('revenue per tech')
                  }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Revenue per Day</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.revenuePerDay}
                  onChange={(e) => handleInputChange('revenuePerDay', Number(e.target.value))}
                  placeholder="5408"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label style={{ display: 'block', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Project Phases</label>
              <input 
                type="text" 
                value={formData.phases}
                onChange={(e) => handleInputChange('phases', e.target.value)}
                placeholder="Rough-in, Top-out, Trim, Final"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '8px',
                  fontSize: '14px',
                  ...getFieldStyle('project phases')
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                padding: '0.875rem 1.5rem',
                background: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#6b7280',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              style={{
                padding: '0.875rem 1.5rem',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'white',
                fontWeight: '500'
              }}
            >
              📊 Save Project Data
            </button>
          </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectUploadModal