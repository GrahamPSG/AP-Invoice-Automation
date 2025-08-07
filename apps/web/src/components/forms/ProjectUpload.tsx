import { useState } from 'react'
import { useUploadProjectMutation } from '@/store/projectsApi'

interface ProjectUploadProps {
  onSuccess?: (project: any) => void
  onError?: (error: string) => void
}

const ProjectUpload = ({ onSuccess, onError }: ProjectUploadProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [projectName, setProjectName] = useState('')
  const [scope, setScope] = useState<'plumbing' | 'hvac' | 'combined'>('combined')
  const [dragActive, setDragActive] = useState(false)
  
  const [uploadProject, { isLoading }] = useUploadProjectMutation()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    
    if (!validTypes.includes(file.type)) {
      onError?.('Please select a valid Excel file (.xlsx, .xls, or .csv)')
      return false
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      onError?.('File size must be less than 10MB')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file && !projectName) {
      onError?.('Please either upload a file or provide project details')
      return
    }

    try {
      const formData = new FormData()
      
      if (file) {
        formData.append('file', file)
      }
      
      // Add project metadata
      formData.append('name', projectName || file?.name.split('.')[0] || 'New Project')
      formData.append('scope', scope)
      formData.append('durationWeeks', '12')
      formData.append('crewSize', '4')
      formData.append('revenuePerTechDay', '500')
      formData.append('grossProfit', '0')
      formData.append('netProfit', '0')
      
      // Add default cost structure
      formData.append('costs[labor]', '0')
      formData.append('costs[materials]', '0')
      formData.append('costs[equipment]', '0')
      formData.append('costs[overhead]', '0')
      formData.append('costs[profit]', '0')

      const result = await uploadProject(formData).unwrap()
      onSuccess?.(result)
      
      // Reset form
      setFile(null)
      setProjectName('')
      setScope('combined')
      
    } catch (error: any) {
      const message = error?.data?.message || 'Failed to upload project'
      onError?.(message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Project</h2>
          <p className="text-gray-600 mb-6">
            Upload an Excel file with project cost data or create a new project manually.
          </p>
        </div>

        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : file
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".xlsx,.xls,.csv"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center space-y-4">
            {file ? (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove file
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your Excel file here
                  </p>
                  <p className="text-gray-500">or click to browse</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Supports .xlsx, .xls, and .csv files up to 10MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name {!file && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter project name"
              required={!file}
            />
          </div>

          <div>
            <label htmlFor="scope" className="block text-sm font-medium text-gray-700 mb-1">
              Scope
            </label>
            <select
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="plumbing">Plumbing</option>
              <option value="hvac">HVAC</option>
              <option value="combined">Combined</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFile(null)
              setProjectName('')
              setScope('combined')
            }}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || (!file && !projectName)}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{file ? 'Upload & Process' : 'Create Project'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectUpload