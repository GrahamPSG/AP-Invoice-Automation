import { useForm, Controller } from 'react-hook-form'
import { useGetProjectsQuery } from '@/store/projectsApi'
import { useCreateScenarioMutation, useUpdateScenarioMutation } from '@/store/scenariosApi'
import { ScenarioInput } from '@shared/types'

interface ScenarioFormProps {
  scenario?: any // Existing scenario for editing
  onSuccess?: (scenario: any) => void
  onCancel?: () => void
}

interface FormData extends ScenarioInput {
  projectId?: string
  isPublic?: boolean
}

const ScenarioForm = ({ scenario, onSuccess, onCancel }: ScenarioFormProps) => {
  const { data: projects = [] } = useGetProjectsQuery()
  const [createScenario, { isLoading: isCreating }] = useCreateScenarioMutation()
  const [updateScenario, { isLoading: isUpdating }] = useUpdateScenarioMutation()
  
  const isEditing = !!scenario
  const isLoading = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      projectId: scenario?.projectId || '',
      projectSize: {
        units: scenario?.inputs.projectSize.units || undefined,
        dollars: scenario?.inputs.projectSize.dollars || undefined,
        sqFt: scenario?.inputs.projectSize.sqFt || undefined,
      },
      scope: scenario?.inputs.scope || ['combined'],
      crewChange: scenario?.inputs.crewChange || 0,
      scheduleChangeWeeks: scenario?.inputs.scheduleChangeWeeks || 0,
      overheadChangePct: scenario?.inputs.overheadChangePct || 0,
      materialInflationPct: scenario?.inputs.materialInflationPct || 0,
      laborRateChangePct: scenario?.inputs.laborRateChangePct || 0,
      targetProfitPct: scenario?.inputs.targetProfitPct || 15,
      isPublic: scenario?.isPublic || false,
    },
  })

  const selectedProject = watch('projectId')
  const baseProject = projects.find(p => p.id === selectedProject)

  const onSubmit = async (data: FormData) => {
    try {
      const scenarioData = {
        projectId: data.projectId || undefined,
        isPublic: data.isPublic,
        projectSize: data.projectSize,
        scope: data.scope,
        crewChange: data.crewChange,
        scheduleChangeWeeks: data.scheduleChangeWeeks,
        overheadChangePct: data.overheadChangePct,
        materialInflationPct: data.materialInflationPct,
        laborRateChangePct: data.laborRateChangePct,
        targetProfitPct: data.targetProfitPct,
      }

      let result
      if (isEditing) {
        result = await updateScenario({
          id: scenario.id,
          inputs: scenarioData,
        }).unwrap()
      } else {
        result = await createScenario(scenarioData).unwrap()
      }

      onSuccess?.(result)
    } catch (error: any) {
      console.error('Failed to save scenario:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Edit Scenario' : 'New What-If Scenario'}
          </h2>
          <p className="text-gray-600">
            Adjust project parameters to see how changes affect costs and profitability.
          </p>
        </div>

        {/* Base Project Selection */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Base Project</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Base Project (Optional)
              </label>
              <select
                {...register('projectId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Green Field (No Base Project)</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} - {project.scope}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select a project to use as baseline for calculations
              </p>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('isPublic')}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
                <span className="text-sm text-gray-700">Make scenario public</span>
              </label>
              <p className="ml-2 text-xs text-gray-500">
                Other users can view this scenario
              </p>
            </div>
          </div>

          {baseProject && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Base Project Info</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Duration:</span>
                  <span className="ml-2 font-medium">{baseProject.durationWeeks} weeks</span>
                </div>
                <div>
                  <span className="text-blue-700">Crew Size:</span>
                  <span className="ml-2 font-medium">{baseProject.crewSize} people</span>
                </div>
                <div>
                  <span className="text-blue-700">Gross Profit:</span>
                  <span className="ml-2 font-medium">${baseProject.grossProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Project Size */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Size</h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Units
              </label>
              <input
                type="number"
                step="0.01"
                {...register('projectSize.units', { min: 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Square Feet
              </label>
              <input
                type="number"
                step="0.01"
                {...register('projectSize.sqFt', { min: 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., 5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dollar Value
              </label>
              <input
                type="number"
                step="0.01"
                {...register('projectSize.dollars', { min: 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., 250000"
              />
            </div>
          </div>
        </div>

        {/* Scope */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Scope</h3>
          
          <Controller
            name="scope"
            control={control}
            rules={{ required: 'At least one scope must be selected' }}
            render={({ field }) => (
              <div className="space-y-2">
                {['plumbing', 'hvac', 'combined'].map(option => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.value.includes(option as any)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange([...field.value, option])
                        } else {
                          field.onChange(field.value.filter((v: string) => v !== option))
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                    <span className="text-sm text-gray-700 capitalize">{option}</span>
                  </label>
                ))}
                {errors.scope && (
                  <p className="text-sm text-red-600">{errors.scope.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {/* Resource Changes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Adjustments</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crew Size Change
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  {...register('crewChange', { min: -10, max: 10 })}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">people</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Add or remove crew members (-10 to +10)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Change
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  {...register('scheduleChangeWeeks', { min: -52, max: 52 })}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">weeks</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Extend or compress timeline (-52 to +52 weeks)
              </p>
            </div>
          </div>
        </div>

        {/* Cost Adjustments */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Adjustments</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Labor Rate Change
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  {...register('laborRateChangePct', { min: -50, max: 100 })}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Inflation
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  {...register('materialInflationPct', { min: -50, max: 100 })}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overhead Change
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  {...register('overheadChangePct', { min: -50, max: 50 })}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Profit Margin
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  {...register('targetProfitPct', { min: 0, max: 50 })}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
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
            disabled={isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{isEditing ? 'Update Scenario' : 'Create Scenario'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default ScenarioForm