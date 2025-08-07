import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: '8rem', marginBottom: '2rem' }}>
        🔍
      </div>
      
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        color: '#1e293b', 
        marginBottom: '1rem' 
      }}>
        Page Not Found
      </h1>
      
      <p style={{ 
        fontSize: '1.1rem', 
        color: '#64748b', 
        marginBottom: '3rem',
        maxWidth: '600px',
        margin: '0 auto 3rem auto'
      }}>
        The page you're looking for doesn't exist or has been moved. 
        Let's get you back to analyzing your projects.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary">
          🏠 Go Home
        </Link>
        <Link to="/projects" className="btn btn-secondary">
          📊 View Projects
        </Link>
        <Link to="/scenarios" className="btn btn-secondary">
          🔬 Run Scenarios
        </Link>
      </div>

      <div className="card" style={{ marginTop: '3rem', textAlign: 'left' }}>
        <h3 className="card-title">Quick Links</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              📁 Project Management
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem', color: '#64748b' }}>
              <li style={{ marginBottom: '0.25rem' }}>
                <Link to="/projects" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  View Project Database
                </Link>
              </li>
              <li>Upload historical job cost data</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              🔬 Scenario Analysis
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem', color: '#64748b' }}>
              <li style={{ marginBottom: '0.25rem' }}>
                <Link to="/scenarios" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  Run What-If Scenarios
                </Link>
              </li>
              <li>Analyze profitability impacts</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              📊 Reporting
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem', color: '#64748b' }}>
              <li>Export PDF reports</li>
              <li>Generate Excel exports</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}