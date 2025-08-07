import { useState } from 'react'

interface PlanAnalysis {
  squareFootage: number
  unitCount: number
  buildingType: 'single-family' | 'multi-family' | 'commercial' | 'industrial'
  fixtures: {
    toilets: number
    sinks: number
    showers: number
    bathtubs: number
    drains: {
      floor: number
      shower: number
      sink: number
      other: number
    }
  }
  hvacRequirements: {
    zones: number
    tonnage: number
    vents: number
  }
  errors: string[]
  confidence: number
}

interface CrewRecommendations {
  plumbing: {
    crewSize: number
    duration: number
    reasoning: string
  }
  hvac: {
    crewSize: number
    duration: number
    reasoning: string
  }
}

interface PerDoorCosts {
  plumbing: number
  ventilation: number
  airConditioning: number
  totalPerDoor: number
}

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
  const [uploadedPlans, setUploadedPlans] = useState<File[]>([])
  const [planAnalysis, setPlanAnalysis] = useState<PlanAnalysis | null>(null)
  const [crewRecommendations, setCrewRecommendations] = useState<CrewRecommendations | null>(null)
  const [perDoorCosts, setPerDoorCosts] = useState<PerDoorCosts | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'upload' | 'analysis' | 'scenario'>('upload')

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

  const handlePlanUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setUploadedPlans(files)
    setIsAnalyzing(true)
    setCurrentStep('analysis')

    // Simulate AI analysis of PDF plans
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const analysis = await simulatePlanAnalysis(files)
    setPlanAnalysis(analysis)
    
    const crews = generateCrewRecommendations(analysis)
    setCrewRecommendations(crews)
    
    const costs = calculatePerDoorCosts(analysis)
    setPerDoorCosts(costs)
    
    setIsAnalyzing(false)
    setCurrentStep('scenario')
  }

  const simulatePlanAnalysis = async (files: File[]): Promise<PlanAnalysis> => {
    // Simulate AI analysis of architectural and mechanical plans
    const hasArchitectural = files.some(f => f.name.toLowerCase().includes('arch') || f.name.toLowerCase().includes('floor'))
    const hasMechanical = files.some(f => f.name.toLowerCase().includes('mech') || f.name.toLowerCase().includes('plumb') || f.name.toLowerCase().includes('hvac'))
    
    const analysis: PlanAnalysis = {
      squareFootage: Math.floor(Math.random() * 5000) + 2000,
      unitCount: Math.floor(Math.random() * 12) + 1,
      buildingType: Math.random() > 0.6 ? 'multi-family' : Math.random() > 0.3 ? 'commercial' : 'single-family',
      fixtures: {
        toilets: Math.floor(Math.random() * 15) + 2,
        sinks: Math.floor(Math.random() * 20) + 3,
        showers: Math.floor(Math.random() * 12) + 1,
        bathtubs: Math.floor(Math.random() * 8) + 0,
        drains: {
          floor: Math.floor(Math.random() * 8) + 2,
          shower: Math.floor(Math.random() * 12) + 1,
          sink: Math.floor(Math.random() * 20) + 3,
          other: Math.floor(Math.random() * 5) + 1
        }
      },
      hvacRequirements: {
        zones: Math.floor(Math.random() * 6) + 2,
        tonnage: Math.round((Math.random() * 8 + 3) * 10) / 10,
        vents: Math.floor(Math.random() * 25) + 8
      },
      errors: [],
      confidence: 0.85
    }

    // Add some realistic errors
    if (!hasArchitectural) {
      analysis.errors.push('No architectural plans detected - unit count may be estimated')
      analysis.confidence -= 0.15
    }
    if (!hasMechanical) {
      analysis.errors.push('No mechanical plans detected - fixture counts estimated from architectural plans')
      analysis.confidence -= 0.10
    }
    if (analysis.fixtures.bathtubs === 0 && analysis.buildingType === 'single-family') {
      analysis.errors.push('No bathtubs detected in single-family home - verify plans')
    }

    return analysis
  }

  const generateCrewRecommendations = (analysis: PlanAnalysis): CrewRecommendations => {
    // Base recommendations on historical data and project scale
    const totalFixtures = analysis.fixtures.toilets + analysis.fixtures.sinks + analysis.fixtures.showers + analysis.fixtures.bathtubs
    const complexity = analysis.squareFootage / 1000 * analysis.unitCount
    
    const plumbingCrew = Math.max(2, Math.min(8, Math.ceil(totalFixtures / 8)))
    const hvacCrew = Math.max(2, Math.min(6, Math.ceil(analysis.hvacRequirements.tonnage / 2)))
    
    return {
      plumbing: {
        crewSize: plumbingCrew,
        duration: Math.ceil(complexity / plumbingCrew * 1.5),
        reasoning: `Based on ${totalFixtures} fixtures across ${analysis.unitCount} units. Similar projects averaged ${Math.round(totalFixtures / plumbingCrew)} fixtures per person.`
      },
      hvac: {
        crewSize: hvacCrew,
        duration: Math.ceil(complexity / hvacCrew * 1.2),
        reasoning: `Based on ${analysis.hvacRequirements.tonnage} tons HVAC across ${analysis.hvacRequirements.zones} zones. Historical data shows ${Math.round(analysis.hvacRequirements.tonnage / hvacCrew * 10) / 10} tons per person optimal.`
      }
    }
  }

  const calculatePerDoorCosts = (analysis: PlanAnalysis): PerDoorCosts => {
    // Calculate per-door costs based on historical data
    const baseComplexity = analysis.buildingType === 'commercial' ? 1.4 : analysis.buildingType === 'multi-family' ? 1.2 : 1.0
    const fixtureComplexity = (analysis.fixtures.toilets + analysis.fixtures.sinks + analysis.fixtures.showers + analysis.fixtures.bathtubs) / analysis.unitCount
    
    const plumbingBase = 2800
    const ventilationBase = 1200
    const acBase = 3500
    
    const costs: PerDoorCosts = {
      plumbing: Math.round(plumbingBase * baseComplexity * (fixtureComplexity / 3)),
      ventilation: Math.round(ventilationBase * baseComplexity * (analysis.hvacRequirements.tonnage / analysis.unitCount / 2)),
      airConditioning: Math.round(acBase * baseComplexity * (analysis.hvacRequirements.tonnage / analysis.unitCount / 2)),
      totalPerDoor: 0
    }
    
    costs.totalPerDoor = costs.plumbing + costs.ventilation + costs.airConditioning
    
    return costs
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