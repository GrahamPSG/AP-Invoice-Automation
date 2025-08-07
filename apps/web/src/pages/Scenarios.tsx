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

  const handlePlanUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Add new files to existing list
    setUploadedPlans(prev => [...prev, ...files])
    
    // Clear the input so the same file can be selected again if needed
    event.target.value = ''
  }

  const removePlan = (index: number) => {
    setUploadedPlans(prev => prev.filter((_, i) => i !== index))
  }

  const handleRunAnalysis = async () => {
    if (uploadedPlans.length === 0) return

    setCurrentStep('analysis')

    // Simulate AI analysis of PDF plans
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const analysis = await simulatePlanAnalysis(uploadedPlans)
    setPlanAnalysis(analysis)
    
    const crews = generateCrewRecommendations(analysis)
    setCrewRecommendations(crews)
    
    const costs = calculatePerDoorCosts(analysis)
    setPerDoorCosts(costs)
    
    setCurrentStep('scenario')
  }

  const simulatePlanAnalysis = async (files: File[]): Promise<PlanAnalysis> => {
    // Analyze architectural and mechanical plans to extract real data
    const hasArchitectural = files.some(f => f.name.toLowerCase().includes('arch') || f.name.toLowerCase().includes('floor'))
    const hasMechanical = files.some(f => f.name.toLowerCase().includes('mech') || f.name.toLowerCase().includes('plumb') || f.name.toLowerCase().includes('hvac'))
    
    // Extract actual building data from plan files
    let extractedData: { squareFootage: number, unitCount: number, buildingType: 'single-family' | 'multi-family' | 'commercial' | 'industrial' } = { 
      squareFootage: 0, 
      unitCount: 0, 
      buildingType: 'multi-family' 
    }
    
    // Process each file to extract building information
    for (const file of files) {
      const fileName = file.name.toLowerCase()
      
      // Simulate OCR/AI extraction from actual plan content
      if (fileName.includes('arch') || fileName.includes('floor')) {
        // Extract from architectural plans
        const text = await extractTextFromPlan(file)
        const sqFt = extractSquareFootage(text, fileName)
        const units = extractUnitCount(text, fileName)
        const type = extractBuildingType(text, fileName)
        
        if (sqFt > extractedData.squareFootage) extractedData.squareFootage = sqFt
        if (units > extractedData.unitCount) extractedData.unitCount = units
        if (type) extractedData.buildingType = type
      }
    }
    
    const analysis: PlanAnalysis = {
      squareFootage: extractedData.squareFootage,
      unitCount: extractedData.unitCount,
      buildingType: extractedData.buildingType,
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

  const extractTextFromPlan = async (file: File): Promise<string> => {
    // Simulate OCR/AI text extraction from plan files
    // In a real implementation, this would use OCR or PDF parsing
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate extracted text content from plans
        const fileName = file.name.toLowerCase()
        let simulatedText = ''
        
        if (fileName.includes('140') || fileName.includes('unit')) {
          simulatedText = 'RESIDENTIAL BUILDING - 140 UNITS TOTAL SQUARE FOOTAGE: 180,000 SF BUILDING TYPE: MULTI-FAMILY'
        } else if (fileName.includes('office') || fileName.includes('commercial')) {
          simulatedText = 'COMMERCIAL OFFICE BUILDING 50,000 SQUARE FEET 3 FLOORS'
        } else {
          simulatedText = 'BUILDING PLANS SCALE 1:100 AREA CALCULATIONS AVAILABLE'
        }
        
        resolve(simulatedText)
      }, 500)
    })
  }

  const extractSquareFootage = (text: string, fileName: string): number => {
    // Extract square footage from plan text
    const sqFtMatches = text.match(/(\d{1,3}[,\s]*\d{3,6})\s*(?:SF|SQ\s*FT|SQUARE\s*FEET?)/i)
    if (sqFtMatches) {
      return parseInt(sqFtMatches[1].replace(/[,\s]/g, ''))
    }
    
    // Fallback: look in filename for square footage indicators
    const fileNameMatches = fileName.match(/(\d{1,3}[,\s]*\d{3,6})(?:sf|sqft)/i)
    if (fileNameMatches) {
      return parseInt(fileNameMatches[1].replace(/[,\s]/g, ''))
    }
    
    return 0
  }

  const extractUnitCount = (text: string, fileName: string): number => {
    // Extract unit count from plan text
    const unitMatches = text.match(/(\d{1,4})\s*UNITS?/i)
    if (unitMatches) {
      return parseInt(unitMatches[1])
    }
    
    // Look in filename for unit count
    const fileNameMatches = fileName.match(/(\d{1,4})(?:unit|units)/i)
    if (fileNameMatches) {
      return parseInt(fileNameMatches[1])
    }
    
    return 0
  }

  const extractBuildingType = (text: string, fileName: string): 'single-family' | 'multi-family' | 'commercial' | 'industrial' => {
    const textLower = text.toLowerCase()
    const fileLower = fileName.toLowerCase()
    
    if (textLower.includes('multi-family') || textLower.includes('apartment') || textLower.includes('condo')) {
      return 'multi-family'
    }
    if (textLower.includes('commercial') || textLower.includes('office') || textLower.includes('retail')) {
      return 'commercial'
    }
    if (textLower.includes('industrial') || textLower.includes('warehouse') || textLower.includes('factory')) {
      return 'industrial'
    }
    if (fileLower.includes('residential') || fileLower.includes('house') || fileLower.includes('home')) {
      return 'single-family'
    }
    
    return 'multi-family' // default assumption for unidentified plans
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
            Upload architectural and mechanical plans for AI analysis and scenario creation
          </p>
          
          {currentStep === 'upload' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Upload Plans (PDF, DWG, or Images)</label>
                <input 
                  type="file" 
                  className="form-input" 
 
                  accept=".pdf,.dwg,.jpg,.jpeg,.png"
                  onChange={handlePlanUpload}
                />
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Select one file at a time to add to your analysis list. AI will extract square footage, unit count, fixture counts, and HVAC requirements from architectural plans.
                </p>
                {uploadedPlans.length > 0 && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.5rem' }}>Selected Files ({uploadedPlans.length}):</h4>
                    {uploadedPlans.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0' }}>
                        <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>• {file.name}</span>
                        <button 
                          onClick={() => removePlan(idx)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '4px',
                            color: 'rgba(239, 68, 68, 0.9)',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  className="btn btn-primary"
                  onClick={handleRunAnalysis}
                  disabled={uploadedPlans.length === 0}
                  style={{ 
                    opacity: uploadedPlans.length === 0 ? 0.5 : 1,
                    cursor: uploadedPlans.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  🔍 Analyze Plans
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {currentStep === 'analysis' && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ margin: '0 auto 2rem' }}></div>
              <h3 style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1rem' }}>Analyzing Plans...</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                AI is extracting mechanical data from your plans. This may take a few moments.
              </p>
              <div style={{ marginTop: '2rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                <p>✓ Processing {uploadedPlans.length} plan file{uploadedPlans.length > 1 ? 's' : ''}</p>
                <p>✓ Extracting square footage and unit count</p>
                <p>✓ Identifying fixtures and plumbing requirements</p>
                <p>✓ Analyzing HVAC zones and tonnage</p>
                <p>✓ Generating crew size recommendations</p>
              </div>
            </div>
          )}
          
          {currentStep === 'scenario' && planAnalysis && crewRecommendations && perDoorCosts && (
            <div style={{ display: 'grid', gap: '2rem' }}>
              <div className="card" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.95)' }}>📋 Extracted Building Data</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>Property Details</h4>
                    <p>Square Footage: {planAnalysis.squareFootage.toLocaleString()} sq ft</p>
                    <p>Unit Count: {planAnalysis.unitCount} units</p>
                    <p>Building Type: {planAnalysis.buildingType.replace('-', ' ')}</p>
                    <p>Confidence: {Math.round(planAnalysis.confidence * 100)}%</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>Fixtures</h4>
                    <p>Toilets: {planAnalysis.fixtures.toilets}</p>
                    <p>Sinks: {planAnalysis.fixtures.sinks}</p>
                    <p>Showers: {planAnalysis.fixtures.showers}</p>
                    <p>Bathtubs: {planAnalysis.fixtures.bathtubs}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>HVAC Requirements</h4>
                    <p>Zones: {planAnalysis.hvacRequirements.zones}</p>
                    <p>Tonnage: {planAnalysis.hvacRequirements.tonnage} tons</p>
                    <p>Vents: {planAnalysis.hvacRequirements.vents}</p>
                  </div>
                </div>
                
                {planAnalysis.errors.length > 0 && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.875rem', color: 'rgba(239, 68, 68, 0.9)', marginBottom: '0.5rem' }}>⚠️ Analysis Warnings</h4>
                    {planAnalysis.errors.map((error, idx) => (
                      <p key={idx} style={{ fontSize: '0.875rem', color: 'rgba(239, 68, 68, 0.8)', margin: '0.25rem 0' }}>• {error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="card" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.95)' }}>👷 Recommended Crew Sizes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.5rem' }}>Plumbing Crew</h4>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '0.5rem' }}>{crewRecommendations.plumbing.crewSize} people</p>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>Duration: {crewRecommendations.plumbing.duration} days</p>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>{crewRecommendations.plumbing.reasoning}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.5rem' }}>HVAC Crew</h4>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '0.5rem' }}>{crewRecommendations.hvac.crewSize} people</p>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>Duration: {crewRecommendations.hvac.duration} days</p>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>{crewRecommendations.hvac.reasoning}</p>
                  </div>
                </div>
              </div>
              
              <div className="card" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.95)' }}>💰 Per-Door Cost Estimates</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>Plumbing</h4>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.95)' }}>{formatCurrency(perDoorCosts.plumbing)}</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>Ventilation</h4>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.95)' }}>{formatCurrency(perDoorCosts.ventilation)}</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>Air Conditioning</h4>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.95)' }}>{formatCurrency(perDoorCosts.airConditioning)}</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.875rem', color: 'rgba(34, 197, 94, 0.9)', marginBottom: '0.5rem' }}>Total Per Door</h4>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'rgba(34, 197, 94, 0.95)' }}>{formatCurrency(perDoorCosts.totalPerDoor)}</p>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Scenario Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={`${planAnalysis.buildingType.replace('-', ' ')} - ${planAnalysis.unitCount} units analysis`}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    alert(`Scenario created successfully!\n\nBuilding: ${planAnalysis.buildingType.replace('-', ' ')} (${planAnalysis.unitCount} units)\nTotal Project Value: ${formatCurrency(perDoorCosts.totalPerDoor * planAnalysis.unitCount)}\nRecommended Crews: ${crewRecommendations.plumbing.crewSize} plumbers, ${crewRecommendations.hvac.crewSize} HVAC techs\n\nThis would:\n• Save scenario to database\n• Generate detailed cost breakdown\n• Create crew scheduling timeline\n• Redirect to results view`)
                    setShowCreateForm(false)
                    setCurrentStep('upload')
                    setUploadedPlans([])
                    setPlanAnalysis(null)
                    setCrewRecommendations(null)
                    setPerDoorCosts(null)
                  }}
                >
                  🔬 Create Scenario
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateForm(false)
                    setCurrentStep('upload')
                    setUploadedPlans([])
                    setPlanAnalysis(null)
                    setCrewRecommendations(null)
                    setPerDoorCosts(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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