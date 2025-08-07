const Home = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        What-If Calculator
      </h1>
      
      <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
        Run what-if scenarios against historical job-cost data. Upload Excel workbooks,
        map columns, and explore different project parameters to optimize your estimates.
      </p>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Upload Projects</h3>
          <p className="text-gray-600">
            Import historical job cost data from Excel workbooks
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Run Scenarios</h3>
          <p className="text-gray-600">
            Adjust crew sizes, schedules, and costs to see impact on profitability
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Export Results</h3>
          <p className="text-gray-600">
            Generate PDF reports and Excel exports for stakeholders
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home