import { useState } from 'react'
import { useGetProjectsQuery } from '@/store/projectsApi'
import ProjectUpload from '@/components/forms/ProjectUpload'
import ColumnMapping from '@/components/forms/ColumnMapping'
import { useToast } from '@/hooks/useToast'
import Toast from '@/components/ui/Toast'

const Projects = () => {
  const { data: projects, error, isLoading } = useGetProjectsQuery()
  const [showUpload, setShowUpload] = useState(false)
  const [showMapping, setShowMapping] = useState(false)
  const [mappingData, setMappingData] = useState<any>(null)
  const { toasts, removeToast, success, error: showError } = useToast()

  const handleUploadSuccess = (result: any) => {
    if (result.parsedData?.headers) {
      // Show column mapping for Excel uploads
      setMappingData({
        projectId: result.project.id,
        headers: result.parsedData.headers,
        currentMapping: result.parsedData.suggestedMapping,
      })
      setShowMapping(true)
      setShowUpload(false)
      success('Project uploaded successfully! Please review the column mapping.')
    } else {
      // Direct project creation
      setShowUpload(false)
      success('Project created successfully!')
    }
  }

  const handleUploadError = (message: string) => {
    showError(message)
  }

  const handleMappingSuccess = () => {
    setShowMapping(false)
    setMappingData(null)
    success('Column mapping saved successfully!')
  }

  const handleMappingCancel = () => {
    setShowMapping(false)
    setMappingData(null)
  }

  if (showUpload) {
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
        <ProjectUpload
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
        />
      </div>
    )
  }

  if (showMapping && mappingData) {
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
        <ColumnMapping
          projectId={mappingData.projectId}
          headers={mappingData.headers}
          currentMapping={mappingData.currentMapping}
          onSuccess={handleMappingSuccess}
          onCancel={handleMappingCancel}
        />
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Projects</h3>
        <p className="text-gray-600 mb-4">Unable to load projects. Please try again.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your project cost data and create what-if scenarios
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload Project</span>
        </button>
      </div>

      {projects && projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No projects yet</h3>
          <p className="mt-2 text-gray-600">Get started by uploading your first project Excel file.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Upload Project
          </button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {projects?.map((project) => (
              <li key={project.id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {project.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {project.scope} • {project.durationWeeks} weeks • {project.crewSize} crew
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${project.grossProfit.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Gross Profit</p>
                      </div>
                      <button
                        className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                        onClick={() => {
                          // TODO: Navigate to project details or create scenario
                          console.log('View project:', project.id)
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Projects