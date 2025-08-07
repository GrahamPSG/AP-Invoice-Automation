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
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="card" style={{
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        margin: 0
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className="card-title">Upload Project Data</h2>
          <button 
            onClick={onClose}
            className="btn btn-secondary btn-small"
            style={{ padding: '0.5rem' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Basic Project Info */}
          <div>
            <h3 className="section-title">Project Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  placeholder="e.g., COPA21101 - 1263 Balfour Avenue"
                  required
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
            <h3 className="section-title">Labor Analysis</h3>
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
            <h3 className="section-title">Cost Breakdown</h3>
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
                <label className="form-label">Subcontractors</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.subcontractorCost}
                  onChange={(e) => handleInputChange('subcontractorCost', Number(e.target.value))}
                  placeholder="25000"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Permits & Rentals</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.permitsRentalsCost}
                  onChange={(e) => handleInputChange('permitsRentalsCost', Number(e.target.value))}
                  placeholder="8500"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Overhead Allocation</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.overheadAllocation}
                  onChange={(e) => handleInputChange('overheadAllocation', Number(e.target.value))}
                  placeholder="32500"
                />
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <strong>Total Cost: ${calculateTotalCost().toLocaleString()}</strong>
            </div>
          </div>

          {/* Profit Analysis */}
          <div>
            <h3 className="section-title">Profit Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Gross Profit</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.grossProfit}
                  onChange={(e) => handleInputChange('grossProfit', Number(e.target.value))}
                  placeholder="60000"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Net Profit</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.netProfit}
                  onChange={(e) => handleInputChange('netProfit', Number(e.target.value))}
                  placeholder="45000"
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
            <h3 className="section-title">Crew & Performance Metrics</h3>
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
                <label className="form-label">Revenue per Tech</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={formData.revenuePerTech}
                  onChange={(e) => handleInputChange('revenuePerTech', Number(e.target.value))}
                  placeholder="40562"
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
              <label className="form-label">Project Phases</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.phases}
                onChange={(e) => handleInputChange('phases', e.target.value)}
                placeholder="Rough-in, Top-out, Trim, Final"
              />
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              📊 Save Project Data
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectUploadModal