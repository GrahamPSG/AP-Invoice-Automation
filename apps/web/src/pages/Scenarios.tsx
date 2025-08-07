import { useState } from 'react'
import { useGetScenariosQuery } from '@/store/scenariosApi'
import ScenarioForm from '@/components/forms/ScenarioForm'
import ScenarioResults from '@/components/ui/ScenarioResults'
import { useToast } from '@/hooks/useToast'
import Toast from '@/components/ui/Toast'

const Scenarios = () => {
  const { data: scenarios, error, isLoading } = useGetScenariosQuery()
  const [showForm, setShowForm] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const { toasts, removeToast, success } = useToast()

  const handleFormSuccess = (scenario: any) => {
    setShowForm(false)
    setSelectedScenario(scenario)
    setShowResults(true)
    success(`Scenario ${scenario.id.slice(0, 8)} ${selectedScenario ? 'updated' : 'created'} successfully!`)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedScenario(null)
  }

  const handleViewScenario = (scenario: any) => {
    setSelectedScenario(scenario)
    setShowResults(true)
  }

  if (showForm) {
    return (
      <div>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
        <ScenarioForm
          scenario={selectedScenario}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    )
  }

  if (showResults && selectedScenario) {
    return (
      <div>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
        
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Scenario Results
              </h1>
              <p className="text-gray-600 mt-1">
                Scenario {selectedScenario.id.slice(0, 8)} • Created {new Date(selectedScenario.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="space-x-3">
              <button
                onClick={() => {
                  setShowForm(true)
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Edit Scenario
              </button>
              <button
                onClick={() => {
                  setShowResults(false)
                  setSelectedScenario(null)
                }}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Back to List
              </button>
            </div>
          </div>
        </div>

        <ScenarioResults outputs={selectedScenario.outputs} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Scenarios</h3>
        <p className="text-gray-600 mb-4">Unable to load scenarios. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scenarios</h1>
          <p className="text-gray-600 mt-1">
            Run what-if scenarios to optimize project profitability
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedScenario(null)
            setShowForm(true)
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Scenario</span>
        </button>
      </div>

      {scenarios && scenarios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No scenarios yet</h3>
          <p className="mt-2 text-gray-600">Create your first what-if scenario to analyze project variations.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Create Scenario
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {scenarios?.map((scenario) => (
            <div 
              key={scenario.id} 
              className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewScenario(scenario)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Scenario {scenario.id.slice(0, 8)}
                    </h3>
                    {scenario.isPublic && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Public
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {new Date(scenario.createdAt).toLocaleDateString()}
                    {scenario.projectId && ' • Based on project data'}
                  </p>
                  {scenario.outputs.alerts.length > 0 && (
                    <div className="flex items-center space-x-1 mt-2">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-yellow-700">
                        {scenario.outputs.alerts.length} alert{scenario.outputs.alerts.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    scenario.outputs.profitPct >= 15 ? 'text-green-600' : 
                    scenario.outputs.profitPct >= 10 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    ${scenario.outputs.profitDollars.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {scenario.outputs.profitPct.toFixed(1)}% profit
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Revenue:</span>
                  <span className="ml-2 font-medium">
                    ${scenario.outputs.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Cost:</span>
                  <span className="ml-2 font-medium">
                    ${scenario.outputs.totalCost.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Margin:</span>
                  <span className="ml-2 font-medium">
                    {scenario.outputs.grossMarginPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Scenarios