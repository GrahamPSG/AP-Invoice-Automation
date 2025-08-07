import { createRoot } from 'react-dom/client'

function App() {
  return (
    <div style={{
      padding: '40px 20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        textAlign: 'center',
        color: '#111827',
        marginBottom: '2rem'
      }}>
        What-If Calculator
      </h1>
      
      <p style={{
        fontSize: '1.2rem',
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: '3rem',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        Run what-if scenarios against historical job-cost data. Upload Excel workbooks,
        map columns, and explore different project parameters to optimize your estimates.
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginTop: '3rem'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#111827' }}>Upload Projects</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Import historical job cost data from Excel workbooks
          </p>
        </div>
        
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#111827' }}>Run Scenarios</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Adjust crew sizes, schedules, and costs to see impact on profitability
          </p>
        </div>
        
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#111827' }}>Export Results</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Generate PDF reports and Excel exports for stakeholders
          </p>
        </div>
      </div>
      
      <div style={{
        textAlign: 'center',
        marginTop: '3rem',
        padding: '2rem',
        background: '#f3f4f6',
        borderRadius: '8px'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>🚀 Demo Version</h2>
        <p style={{ margin: '1rem 0', fontSize: '1rem' }}>
          This is a working demonstration of the What-If Calculator interface.
        </p>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
          Built with React, TypeScript, and deployed on Vercel.
        </p>
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)