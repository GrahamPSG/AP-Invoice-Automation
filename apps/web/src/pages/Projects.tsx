import { useState } from 'react'

interface Project {
  id: string
  name: string
  scope: 'plumbing' | 'hvac' | 'combined'
  revenue: number
  laborCost: number
  materialCost: number
  profitMargin: number
  duration: number
  crewSize: number
  status: 'completed' | 'in-progress' | 'planned'
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Office Building HVAC Installation',
    scope: 'hvac',
    revenue: 324500,
    laborCost: 89200,
    materialCost: 156800,
    profitMargin: 18.5,
    duration: 12,
    crewSize: 8,
    status: 'completed'
  },
  {
    id: '2',
    name: 'Retail Plumbing Retrofit',
    scope: 'plumbing',
    revenue: 187300,
    laborCost: 52400,
    materialCost: 89600,
    profitMargin: 22.1,
    duration: 8,
    crewSize: 5,
    status: 'completed'
  },
  {
    id: '3',
    name: 'Industrial Complex Build-out',
    scope: 'combined',
    revenue: 892100,
    laborCost: 267300,
    materialCost: 445200,
    profitMargin: 15.2,
    duration: 24,
    crewSize: 15,
    status: 'in-progress'
  }
]

const Projects = () => {
  const [projects] = useState<Project[]>(mockProjects)
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'planned'>('all')

  const filteredProjects = projects.filter(project => 
    filter === 'all' || project.status === filter
  )

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
            onClick={() => alert('Upload functionality would allow you to:\n\n• Import Excel files with project data\n• Map columns to project fields\n• Validate and clean data\n• Add projects to database\n• Generate summary reports\n\nSupported formats: .xlsx, .xls, .csv')}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Revenue:</strong> {formatCurrency(project.revenue)}
              </div>
              <div>
                <strong>Labor Cost:</strong> {formatCurrency(project.laborCost)}
              </div>
              <div>
                <strong>Material Cost:</strong> {formatCurrency(project.materialCost)}
              </div>
              <div>
                <strong>Profit Margin:</strong> {project.profitMargin}%
              </div>
              <div>
                <strong>Duration:</strong> {project.duration} weeks
              </div>
              <div>
                <strong>Crew Size:</strong> {project.crewSize} people
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
                onClick={() => alert(`Viewing details for ${project.name}:\n\nRevenue: ${formatCurrency(project.revenue)}\nLabor: ${formatCurrency(project.laborCost)}\nMaterials: ${formatCurrency(project.materialCost)}\nProfit Margin: ${project.profitMargin}%\nDuration: ${project.duration} weeks\nCrew: ${project.crewSize} people`)}
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
    </div>
  )
}

export default Projects