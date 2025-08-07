import { useState } from 'react'
import { useUpdateColumnMapMutation } from '@/store/projectsApi'

interface ColumnMappingProps {
  projectId: string
  headers: string[]
  currentMapping: Record<string, string>
  onSuccess?: () => void
  onCancel?: () => void
}

const FIELD_LABELS = {
  name: 'Project Name',
  scope: 'Scope/Trade',
  labor: 'Labor Cost',
  materials: 'Material Cost',
  equipment: 'Equipment Cost',
  overhead: 'Overhead Cost',
  profit: 'Profit Amount',
  duration: 'Duration (Weeks)',
  crewSize: 'Crew Size',
  revenue: 'Total Revenue',
  units: 'Project Units',
  dollars: 'Project Value ($)',
  sqFt: 'Square Footage',
}

const FIELD_DESCRIPTIONS = {
  name: 'The project or job name',
  scope: 'Type of work (plumbing, HVAC, etc.)',
  labor: 'Direct labor costs',
  materials: 'Material and supply costs',
  equipment: 'Equipment and tool costs',
  overhead: 'Indirect costs and overhead',
  profit: 'Profit amount or markup',
  duration: 'Project duration in weeks',
  crewSize: 'Number of crew members',
  revenue: 'Total project revenue',
  units: 'Project size in units',
  dollars: 'Project value in dollars',
  sqFt: 'Project area in square feet',
}

const ColumnMapping = ({
  projectId,
  headers,
  currentMapping,
  onSuccess,
  onCancel,
}: ColumnMappingProps) => {
  const [mapping, setMapping] = useState<Record<string, string>>(currentMapping)
  const [updateColumnMap, { isLoading }] = useUpdateColumnMapMutation()

  const handleMappingChange = (field: string, column: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: column === '' ? '' : column,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateColumnMap({
        id: projectId,
        columnMap: mapping,
      }).unwrap()
      
      onSuccess?.()
    } catch (error) {
      console.error('Failed to update column mapping:', error)
    }
  }

  const getUsedColumns = () => {
    return Object.values(mapping).filter(Boolean)
  }

  const isColumnUsed = (column: string, currentField: string) => {
    const used = getUsedColumns()
    return used.includes(column) && mapping[currentField] !== column
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Column Mapping</h2>
          <p className="text-gray-600 mb-6">
            Map the columns from your Excel file to the appropriate project fields.
            Leave fields blank if not available in your data.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Available Columns ({headers.length})
              </h3>
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {headers.map((header, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                    >
                      {header}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {Object.entries(FIELD_LABELS).map(([field, label]) => (
            <div key={field} className="border border-gray-200 rounded-lg p-4">
              <div className="grid md:grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {label}
                    {(field === 'name' || field === 'scope') && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <p className="text-xs text-gray-500">
                    {FIELD_DESCRIPTIONS[field as keyof typeof FIELD_DESCRIPTIONS]}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <select
                    value={mapping[field] || ''}
                    onChange={(e) => handleMappingChange(field, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required={field === 'name' || field === 'scope'}
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map((header, index) => (
                      <option
                        key={index}
                        value={header}
                        disabled={isColumnUsed(header, field)}
                        className={isColumnUsed(header, field) ? 'text-gray-400' : ''}
                      >
                        {header}
                        {isColumnUsed(header, field) ? ' (already mapped)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Validation Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Mapping Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total fields:</span>
              <span className="font-medium">{Object.keys(FIELD_LABELS).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mapped:</span>
              <span className="font-medium text-green-600">
                {getUsedColumns().length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Required mapped:</span>
              <span className={`font-medium ${
                mapping.name && mapping.scope ? 'text-green-600' : 'text-red-600'
              }`}>
                {[mapping.name, mapping.scope].filter(Boolean).length} / 2
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !mapping.name || !mapping.scope}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>Save Mapping</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default ColumnMapping