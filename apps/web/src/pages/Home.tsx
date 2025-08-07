import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProjectUploadModal from '../components/ProjectUploadModal'

export default function Home() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const navigate = useNavigate()

  const handleNewProject = (projectData: any) => {
    // In a real app, this would save to a database
    console.log('New project data:', projectData)
    alert('Project uploaded successfully! Redirecting to Projects page...')
    navigate('/projects')
  }

  const handleExportDemo = () => {
    alert(`📄 DEMO EXPORT FUNCTIONALITY

This would generate comprehensive reports including:

📊 EXECUTIVE SUMMARY
• Portfolio performance overview
• Key profitability metrics
• Resource utilization analysis

📈 DETAILED ANALYTICS  
• Project-by-project breakdown
• Cost analysis trends
• Labor efficiency metrics
• Profit margin comparisons

📋 CHARTS & VISUALIZATIONS
• Revenue vs. cost trends
• Crew productivity graphs  
• Project timeline analysis
• Profit margin distribution

💾 EXPORT OPTIONS
• PDF reports with charts
• Excel spreadsheets with data
• CSV files for further analysis
• PowerPoint presentation templates

The exported files would be downloaded to your device.`)
  }
  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero-title">What-If Calculator</h1>
        <p className="hero-subtitle">
          Run what-if scenarios against historical job-cost data. Upload Excel workbooks,
          map columns, and explore different project parameters to optimize your estimates.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/projects" className="btn btn-primary">
            📊 View Projects
          </Link>
          <Link to="/scenarios" className="btn btn-secondary">
            🔬 Run Scenarios
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">📁</div>
          <h3 className="feature-title">Upload Projects</h3>
          <p className="feature-description">
            Import historical job cost data from Excel workbooks with intelligent column mapping 
            and data validation to ensure accuracy.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <button 
              className="btn btn-primary btn-small"
              onClick={() => setShowUploadModal(true)}
              style={{ width: '100%' }}
            >
              📁 Upload Project Data
            </button>
          </div>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3 className="feature-title">Run Scenarios</h3>
          <p className="feature-description">
            Adjust crew sizes, schedules, material costs, and overhead to see real-time 
            impact on profitability and project outcomes.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link 
              to="/scenarios" 
              className="btn btn-primary btn-small"
              style={{ width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none' }}
            >
              🔬 Run Scenarios
            </Link>
          </div>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">📈</div>
          <h3 className="feature-title">Export Results</h3>
          <p className="feature-description">
            Generate comprehensive PDF reports and Excel exports with charts, analysis, 
            and recommendations for stakeholders.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <button 
              className="btn btn-primary btn-small"
              onClick={handleExportDemo}
              style={{ width: '100%' }}
            >
              📄 Export Results
            </button>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="demo">
        <h2 className="demo-title">🚀 Live Demo</h2>
        <p className="demo-subtitle">
          This is a fully functional demonstration of the What-If Calculator interface.
        </p>
        <p className="demo-description">
          Built with React, TypeScript, and modern web technologies. Deployed on Vercel 
          for lightning-fast performance and global CDN distribution.
        </p>
      </section>

      {/* Sample Data Preview */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Sample Project Data</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Scope</th>
                <th>Revenue</th>
                <th>Labor Cost</th>
                <th>Materials</th>
                <th>Profit Margin</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Office Building HVAC</td>
                <td>HVAC Installation</td>
                <td>$324,500</td>
                <td>$89,200</td>
                <td>$156,800</td>
                <td>18.5%</td>
                <td><span className="status status-success">Completed</span></td>
              </tr>
              <tr>
                <td>Retail Plumbing Retrofit</td>
                <td>Plumbing</td>
                <td>$187,300</td>
                <td>$52,400</td>
                <td>$89,600</td>
                <td>22.1%</td>
                <td><span className="status status-success">Completed</span></td>
              </tr>
              <tr>
                <td>Industrial Complex</td>
                <td>Combined</td>
                <td>$892,100</td>
                <td>$267,300</td>
                <td>$445,200</td>
                <td>15.2%</td>
                <td><span className="status status-warning">In Progress</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Upload Modal */}
      <ProjectUploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleNewProject}
      />
    </div>
  )
}