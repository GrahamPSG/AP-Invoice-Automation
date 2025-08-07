function App() {
  return (
    <div>
      <h1>What-If Calculator</h1>
      <p>This is a test to see if React is working</p>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h3>Upload Projects</h3>
          <p>Import historical job cost data</p>
        </div>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h3>Run Scenarios</h3>
          <p>Adjust parameters and see results</p>
        </div>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h3>Export Results</h3>
          <p>Generate reports for stakeholders</p>
        </div>
      </div>
    </div>
  )
}

export default App