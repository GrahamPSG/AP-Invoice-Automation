import { useState } from 'react'

interface Scenario {
  id: string
  name: string
  projectName: string
  baseRevenue: number
  profitChange: number
  profitMarginChange: number
  createdAt: string
}

const mockScenarios: Scenario[] = [
  {
    id: '1',
    name: 'Reduced Crew Size Analysis',
    projectName: 'Office Building HVAC Installation',
    baseRevenue: 324500,
    profitChange: 12800,
    profitMarginChange: 4.2,
    createdAt: '2024-01-20'
  },
  {
    id: '2',
    name: 'Material Cost Inflation Impact',
    projectName: 'Retail Plumbing Retrofit',
    baseRevenue: 187300,
    profitChange: -18900,
    profitMarginChange: -10.1,
    createdAt: '2024-02-05'
  }
]

const Scenarios = () => {
  const [scenarios] = useState<Scenario[]>(mockScenarios)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getChangeColor = (value: number) => {
    if (value > 0) return '#166534'
    if (value < 0) return '#dc2626'
    return '#6b7280'
  }

  const getChangeIcon = (value: number) => {
    if (value > 0) return '📈'
    if (value < 0) return '📉'
    return '➡️'
  }

  if (showCreateForm) {
    return (
      <div className="container">
        <div className="card">
          <h2 className="card-title">Create New Scenario</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.5rem', marginBottom: '2rem' }}>
            Configure parameters to analyze potential project outcomes
          </p>
          
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Scenario Name</label>
              <input type="text" className="form-input" placeholder="e.g., Increased Crew Size Analysis" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Base Project</label>
              <select className="form-input">
                <option>Office Building HVAC Installation</option>
                <option>Retail Plumbing Retrofit</option>
                <option>Industrial Complex Build-out</option>
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Crew Size Change</label>
                <input type="number" className="form-input" placeholder="0" />
              </div>
              
              <div className="form-group">
                <label className="form-label">Schedule Change (weeks)</label>
                <input type="number" className="form-input" placeholder="0" />
              </div>
              
              <div className="form-group">
                <label className="form-label">Material Inflation (%)</label>
                <input type="number" className="form-input" placeholder="0" />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              className="btn btn-primary"
              onClick={() => {
                alert('Scenario created successfully!\n\nThis would:\n• Calculate financial impacts\n• Generate risk analysis\n• Create comparison charts\n• Save to database\n• Redirect to results view')
                setShowCreateForm(false)
              }}
            >
              🔬 Run Scenario
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="card-title">What-If Scenarios</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            Analyze the impact of different project parameters on profitability
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          ➕ Create Scenario
        </button>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {scenarios.map(scenario => (
          <div key={scenario.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                  {getChangeIcon(scenario.profitChange)} {scenario.name}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  Base: {scenario.projectName} • {new Date(scenario.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getChangeColor(scenario.profitChange) }}>
                  {scenario.profitChange > 0 ? '+' : ''}{formatCurrency(scenario.profitChange)}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Profit Impact
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                  Key Metrics
                </h4>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  <div>Base Revenue: {formatCurrency(scenario.baseRevenue)}</div>
                  <div style={{ color: getChangeColor(scenario.profitChange) }}>
                    Profit Change: {scenario.profitChange > 0 ? '+' : ''}{formatCurrency(scenario.profitChange)}
                  </div>
                  <div style={{ color: getChangeColor(scenario.profitMarginChange) }}>
                    Margin Change: {scenario.profitMarginChange > 0 ? '+' : ''}{scenario.profitMarginChange}%
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                  Actions
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-primary btn-small"
                    onClick={() => alert(`Scenario Details: ${scenario.name}\n\nBase Project: ${scenario.projectName}\nBase Revenue: ${formatCurrency(scenario.baseRevenue)}\nProfit Change: ${scenario.profitChange > 0 ? '+' : ''}${formatCurrency(scenario.profitChange)}\nMargin Change: ${scenario.profitMarginChange > 0 ? '+' : ''}${scenario.profitMarginChange}%\nCreated: ${new Date(scenario.createdAt).toLocaleDateString()}\n\nThis would open a detailed analysis view with charts and recommendations.`)}
                  >
                    📊 View Details
                  </button>
                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => alert(`Exporting report for: ${scenario.name}\n\nThis would generate a PDF report containing:\n• Executive Summary\n• Parameter Adjustments\n• Financial Impact Analysis\n• Risk Assessment\n• Recommendations\n• Charts & Graphs\n\nReport would be downloaded as "${scenario.name.replace(/\s+/g, '_')}_Report.pdf"`)}
                  >
                    📄 Export Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {scenarios.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3 style={{ color: '#64748b', marginBottom: '1rem' }}>No scenarios yet</h3>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
            Create your first what-if scenario to analyze project profitability
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            🔬 Create Your First Scenario
          </button>
        </div>
      )}
    </div>
  )
}

export default Scenarios