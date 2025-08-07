const Home = () => {
  return (
    <div className="container">
      <h1>What-If Calculator</h1>
      
      <p>
        Run what-if scenarios against historical job-cost data. Upload Excel workbooks,
        map columns, and explore different project parameters to optimize your estimates.
      </p>
      
      <div className="grid">
        <div className="card">
          <h3>Upload Projects</h3>
          <p>
            Import historical job cost data from Excel workbooks
          </p>
        </div>
        
        <div className="card">
          <h3>Run Scenarios</h3>
          <p>
            Adjust crew sizes, schedules, and costs to see impact on profitability
          </p>
        </div>
        
        <div className="card">
          <h3>Export Results</h3>
          <p>
            Generate PDF reports and Excel exports for stakeholders
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home