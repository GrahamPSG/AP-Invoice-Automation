import { useState } from 'react'
import ProjectUploadModal from '../components/ProjectUploadModal'

interface Project {
  id: string
  name: string
  projectType: 'custom-homes' | 'multi-family'
  scope: 'plumbing' | 'hvac' | 'combined' | 'electrical' | 'general'
  revenue: number
  laborCost: number
  materialCost: number
  equipmentCost: number
  subcontractorCost: number
  permitsRentalsCost: number
  overheadAllocation: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  duration: number
  durationUnit: 'weeks' | 'months'
  crewSize: number
  revenuePerTech: number
  revenuePerDay: number
  laborHoursEstimated: number
  laborHoursActual: number
  status: 'completed' | 'in-progress' | 'planned'
  sizeValue: number
  sizeMetric: 'units' | 'sqft' | 'value'
  phases: string
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Office Building HVAC Installation',
    projectType: 'multi-family',
    scope: 'hvac',
    revenue: 324500,
    laborCost: 89200,
    materialCost: 156800,
    equipmentCost: 12500,
    subcontractorCost: 25000,
    permitsRentalsCost: 8500,
    overheadAllocation: 32500,
    grossProfit: 60000,
    netProfit: 45000,
    profitMargin: 18.5,
    duration: 12,
    durationUnit: 'weeks',
    crewSize: 8,
    revenuePerTech: 40562,
    revenuePerDay: 5408,
    laborHoursEstimated: 640,
    laborHoursActual: 712,
    status: 'completed',
    sizeValue: 4500,
    sizeMetric: 'sqft',
    phases: 'Rough-in, Top-out, Trim, Final'
  },
  {
    id: '2',
    name: 'Retail Plumbing Retrofit',
    projectType: 'multi-family',
    scope: 'plumbing',
    revenue: 187300,
    laborCost: 52400,
    materialCost: 89600,
    equipmentCost: 8200,
    subcontractorCost: 15000,
    permitsRentalsCost: 5500,
    overheadAllocation: 16600,
    grossProfit: 35000,
    netProfit: 28000,
    profitMargin: 22.1,
    duration: 8,
    durationUnit: 'weeks',
    crewSize: 5,
    revenuePerTech: 37460,
    revenuePerDay: 4682,
    laborHoursEstimated: 400,
    laborHoursActual: 385,
    status: 'completed',
    sizeValue: 2800,
    sizeMetric: 'sqft',
    phases: 'Demo, Rough-in, Finish'
  },
  {
    id: '3',
    name: 'Industrial Complex Build-out',
    projectType: 'multi-family',
    scope: 'combined',
    revenue: 892100,
    laborCost: 267300,
    materialCost: 445200,
    equipmentCost: 35000,
    subcontractorCost: 85000,
    permitsRentalsCost: 25000,
    overheadAllocation: 34600,
    grossProfit: 135000,
    netProfit: 110000,
    profitMargin: 15.2,
    duration: 24,
    durationUnit: 'weeks',
    crewSize: 15,
    revenuePerTech: 59473,
    revenuePerDay: 7434,
    laborHoursEstimated: 1800,
    laborHoursActual: 1920,
    status: 'in-progress',
    sizeValue: 12000,
    sizeMetric: 'sqft',
    phases: 'Phase 1: Underground, Phase 2: Rough-in, Phase 3: Finish'
  }
]

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'planned'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)

  const filteredProjects = projects.filter(project => 
    filter === 'all' || project.status === filter
  )

  const handleNewProject = (projectData: any) => {
    const newProject: Project = {
      id: (projects.length + 1).toString(),
      name: projectData.projectName,
      projectType: projectData.projectType,
      scope: projectData.scopeType,
      revenue: projectData.laborCost + projectData.materialCost + projectData.equipmentCost + 
              projectData.subcontractorCost + projectData.permitsRentalsCost + 
              projectData.overheadAllocation + projectData.grossProfit,
      laborCost: projectData.laborCost,
      materialCost: projectData.materialCost,
      equipmentCost: projectData.equipmentCost,
      subcontractorCost: projectData.subcontractorCost,
      permitsRentalsCost: projectData.permitsRentalsCost,
      overheadAllocation: projectData.overheadAllocation,
      grossProfit: projectData.grossProfit,
      netProfit: projectData.netProfit,
      profitMargin: (projectData.grossProfit / (projectData.laborCost + projectData.materialCost + projectData.equipmentCost + 
                    projectData.subcontractorCost + projectData.permitsRentalsCost + 
                    projectData.overheadAllocation + projectData.grossProfit)) * 100,
      duration: projectData.duration,
      durationUnit: projectData.durationUnit,
      crewSize: projectData.crewSize,
      revenuePerTech: projectData.revenuePerTech,
      revenuePerDay: projectData.revenuePerDay,
      laborHoursEstimated: projectData.laborHoursEstimated,
      laborHoursActual: projectData.laborHoursActual,
      status: 'completed',
      sizeValue: projectData.sizeValue,
      sizeMetric: projectData.sizeMetric,
      phases: projectData.phases
    }
    
    setProjects(prev => [...prev, newProject])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'status-success'
      case 'in-progress': return 'status-warning'
      case 'planned': return 'status-error'
      default: return ''
    }
  }

  return (
    <div className="container">
      <div className="card-header">
        <h1 className="card-title">Project Database</h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Historical job cost data for scenario analysis
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
            <label className="form-label">Filter by Status</label>
            <select 
              className="form-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All Projects</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="planned">Planned</option>
            </select>
          </div>
          
          <button 
            className="btn btn-primary btn-small"
            onClick={() => setShowUploadModal(true)}
            style={{ marginBottom: 0 }}
          >
            📁 Upload Project Data
          </button>
        </div>
      </div>

      {/* Projects */}
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {filteredProjects.map(project => (
          <div key={project.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
                {project.name}
              </h3>
              <span className={`status ${getStatusClass(project.status)}`}>
                {project.status.replace('-', ' ')}
              </span>
            </div>

            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', fontSize: '13px' }}>
              <strong>Type:</strong> {project.projectType === 'custom-homes' ? 'Custom Homes' : 'Multi Family'} • 
              <strong> Scope:</strong> {project.scope.toUpperCase()} • 
              <strong> Size:</strong> {project.sizeValue.toLocaleString()} {project.sizeMetric}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '14px' }}>
              <div>
                <strong>Total Revenue:</strong><br />
                {formatCurrency(project.revenue)}
              </div>
              <div>
                <strong>Labor Cost:</strong><br />
                {formatCurrency(project.laborCost)}
              </div>
              <div>
                <strong>Materials:</strong><br />
                {formatCurrency(project.materialCost)}
              </div>
              <div>
                <strong>Equipment:</strong><br />
                {formatCurrency(project.equipmentCost)}
              </div>
              <div>
                <strong>Gross Profit:</strong><br />
                <span style={{ color: project.grossProfit > 0 ? '#22c55e' : '#ef4444' }}>
                  {formatCurrency(project.grossProfit)}
                </span>
              </div>
              <div>
                <strong>Profit Margin:</strong><br />
                <span style={{ color: project.profitMargin > 15 ? '#22c55e' : project.profitMargin > 10 ? '#fbbf24' : '#ef4444' }}>
                  {project.profitMargin.toFixed(1)}%
                </span>
              </div>
              <div>
                <strong>Duration:</strong><br />
                {project.duration} {project.durationUnit}
              </div>
              <div>
                <strong>Crew Size:</strong><br />
                {project.crewSize} people
              </div>
              <div>
                <strong>Revenue/Tech:</strong><br />
                {formatCurrency(project.revenuePerTech)}
              </div>
              <div>
                <strong>Labor Hours:</strong><br />
                {project.laborHoursActual.toLocaleString()} hrs
                {project.laborHoursEstimated > 0 && (
                  <span style={{ 
                    color: project.laborHoursActual <= project.laborHoursEstimated ? '#22c55e' : '#ef4444',
                    fontSize: '12px',
                    marginLeft: '4px'
                  }}>
                    ({((project.laborHoursActual - project.laborHoursEstimated) / project.laborHoursEstimated * 100).toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-primary btn-small"
                onClick={() => alert(`Creating scenario for ${project.name}. This would open the scenario creation form with pre-filled project data.`)}
              >
                📊 Create Scenario
              </button>
              <button 
                className="btn btn-secondary btn-small"
                onClick={() => alert(`📋 PROJECT DETAILS: ${project.name}\n\n🏢 PROJECT INFO:\nType: ${project.projectType === 'custom-homes' ? 'Custom Homes' : 'Multi Family'}\nScope: ${project.scope.toUpperCase()}\nSize: ${project.sizeValue.toLocaleString()} ${project.sizeMetric}\nDuration: ${project.duration} ${project.durationUnit}\n\n💰 FINANCIAL BREAKDOWN:\nTotal Revenue: ${formatCurrency(project.revenue)}\nLabor: ${formatCurrency(project.laborCost)}\nMaterials: ${formatCurrency(project.materialCost)}\nEquipment: ${formatCurrency(project.equipmentCost)}\nSubcontractors: ${formatCurrency(project.subcontractorCost)}\nPermits/Rentals: ${formatCurrency(project.permitsRentalsCost)}\nOverhead: ${formatCurrency(project.overheadAllocation)}\n\n📊 PROFIT ANALYSIS:\nGross Profit: ${formatCurrency(project.grossProfit)}\nNet Profit: ${formatCurrency(project.netProfit)}\nProfit Margin: ${project.profitMargin.toFixed(1)}%\n\n👥 CREW & PERFORMANCE:\nCrew Size: ${project.crewSize} people\nRevenue per Tech: ${formatCurrency(project.revenuePerTech)}\nRevenue per Day: ${formatCurrency(project.revenuePerDay)}\nLabor Hours (Est/Actual): ${project.laborHoursEstimated.toLocaleString()}/${project.laborHoursActual.toLocaleString()}\nHours Variance: ${((project.laborHoursActual - project.laborHoursEstimated) / project.laborHoursEstimated * 100).toFixed(1)}%\n\n🔧 PROJECT PHASES:\n${project.phases}`)}
              >
                📝 View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 className="card-title">Portfolio Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {projects.length}
            </div>
            <div style={{ color: '#64748b' }}>Total Projects</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {formatCurrency(projects.reduce((sum, p) => sum + p.revenue, 0))}
            </div>
            <div style={{ color: '#64748b' }}>Total Revenue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {(projects.reduce((sum, p) => sum + p.profitMargin, 0) / projects.length).toFixed(1)}%
            </div>
            <div style={{ color: '#64748b' }}>Avg Profit Margin</div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <ProjectUploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleNewProject}
      />
    </div>
  )
}

export default Projects