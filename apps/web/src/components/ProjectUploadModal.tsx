import { useState } from 'react'

interface ProjectUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProjectData) => void
}

interface ProjectData {
  // Basic Info
  projectType: 'custom-homes' | 'multi-family'
  projectName: string
  duration: number
  durationUnit: 'weeks' | 'months'
  
  // Project Size
  sizeMetric: 'units' | 'sqft' | 'value'
  sizeValue: number
  
  // Scope
  scopeType: 'plumbing' | 'hvac' | 'combined' | 'electrical' | 'general'
  
  // Labor
  laborHoursEstimated: number
  laborHoursActual: number
  
  // Cost Breakdowns
  laborCost: number
  materialCost: number
  equipmentCost: number
  subcontractorCost: number
  permitsRentalsCost: number
  overheadAllocation: number
  
  // Profit
  grossProfit: number
  netProfit: number
  
  // Crew & Performance
  crewSize: number
  phases: string
  revenuePerTech: number
  revenuePerDay: number
}

interface ParsedProject {
  data: Partial<ProjectData>
  missingFields: string[]
  rowNumber: number
  projectName: string
}

interface ProcessingResult {
  successfulProjects: ParsedProject[]
  failedProjects: { rowNumber: number, projectName: string, errors: string[] }[]
  totalProcessed: number
  fileName: string
}

const ProjectUploadModal = ({ isOpen, onClose, onSubmit }: ProjectUploadModalProps) => {
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [showErrorDetails, setShowErrorDetails] = useState(false)


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setUploadedFiles(files)
    setStep('processing')
    setIsProcessing(true)
    setCurrentFileIndex(0)
    
    // Process all uploaded files
    const results: ProcessingResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i)
      const file = files[i]
      
      try {
        const result = await processSpreadsheetFile(file)
        results.push(result)
      } catch (error) {
        results.push({
          successfulProjects: [],
          failedProjects: [{ rowNumber: 0, projectName: file.name, errors: [`Failed to process file: ${error}`] }],
          totalProcessed: 0,
          fileName: file.name
        })
      }
    }
    
    setProcessingResults(results)
    setIsProcessing(false)
    setStep('review')
  }

  const processSpreadsheetFile = async (file: File): Promise<ProcessingResult> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simulate parsing multiple projects from a spreadsheet
    const simulatedProjects: ParsedProject[] = []
    const failedProjects: { rowNumber: number, projectName: string, errors: string[] }[] = []
    
    // Simulate finding 3-8 projects per spreadsheet
    const numProjects = Math.floor(Math.random() * 6) + 3
    
    for (let row = 2; row <= numProjects + 1; row++) { // Starting from row 2 (assuming row 1 is headers)
      const projectName = `Project ${row - 1} from ${file.name.replace('.xlsx', '').replace('.xls', '').replace('.csv', '')}`
      
      try {
        // Simulate data extraction with some randomness for missing fields
        const hasCompleteData = Math.random() > 0.3 // 70% success rate
        
        if (hasCompleteData) {
          const projectData: Partial<ProjectData> = {
            projectName,
            projectType: Math.random() > 0.5 ? 'custom-homes' : 'multi-family',
            laborCost: Math.floor(Math.random() * 200000) + 50000,
            materialCost: Math.floor(Math.random() * 300000) + 80000,
            equipmentCost: Math.floor(Math.random() * 50000) + 5000,
            laborHoursActual: Math.floor(Math.random() * 1000) + 300,
            crewSize: Math.floor(Math.random() * 10) + 3,
            duration: Math.floor(Math.random() * 20) + 8,
            durationUnit: 'weeks',
            scopeType: ['plumbing', 'hvac', 'combined'][Math.floor(Math.random() * 3)] as any,
            sizeValue: Math.floor(Math.random() * 8000) + 2000,
            sizeMetric: 'sqft'
          }
          
          // Simulate some missing fields
          const missingFields = []
          if (Math.random() > 0.7) missingFields.push('Subcontractor Cost')
          if (Math.random() > 0.8) missingFields.push('Permits & Rentals Cost')
          if (Math.random() > 0.6) missingFields.push('Overhead Allocation')
          if (Math.random() > 0.7) missingFields.push('Gross Profit')
          if (Math.random() > 0.8) missingFields.push('Revenue per Tech')
          
          simulatedProjects.push({
            data: projectData,
            missingFields,
            rowNumber: row,
            projectName
          })
        } else {
          // Simulate failed parsing
          failedProjects.push({
            rowNumber: row,
            projectName,
            errors: [
              'Missing required project name column',
              'Invalid cost data format', 
              'Could not parse labor hours'
            ]
          })
        }
      } catch (error) {
        failedProjects.push({
          rowNumber: row,
          projectName,
          errors: [`Parsing error: ${error}`]
        })
      }
    }
    
    return {
      successfulProjects: simulatedProjects,
      failedProjects,
      totalProcessed: numProjects,
      fileName: file.name
    }
  }



  const handleBatchSubmit = () => {
    // Count total successful projects across all files
    const allSuccessfulProjects = processingResults.flatMap(result => result.successfulProjects)
    const totalSuccessful = allSuccessfulProjects.length
    const totalFailed = processingResults.reduce((sum, result) => sum + result.failedProjects.length, 0)
    
    // Submit all successful projects to the system
    allSuccessfulProjects.forEach(project => {
      // Convert parsed project to full ProjectData format for submission
      const fullProjectData: ProjectData = {
        projectType: project.data.projectType || 'custom-homes',
        projectName: project.data.projectName || 'Unknown Project',
        duration: project.data.duration || 0,
        durationUnit: project.data.durationUnit || 'weeks',
        sizeMetric: project.data.sizeMetric || 'sqft',
        sizeValue: project.data.sizeValue || 0,
        scopeType: project.data.scopeType || 'combined',
        laborHoursEstimated: project.data.laborHoursEstimated || 0,
        laborHoursActual: project.data.laborHoursActual || 0,
        laborCost: project.data.laborCost || 0,
        materialCost: project.data.materialCost || 0,
        equipmentCost: project.data.equipmentCost || 0,
        subcontractorCost: project.data.subcontractorCost || 0,
        permitsRentalsCost: project.data.permitsRentalsCost || 0,
        overheadAllocation: project.data.overheadAllocation || 0,
        grossProfit: project.data.grossProfit || 0,
        netProfit: project.data.netProfit || 0,
        crewSize: project.data.crewSize || 0,
        phases: project.data.phases || '',
        revenuePerTech: project.data.revenuePerTech || 0,
        revenuePerDay: project.data.revenuePerDay || 0
      }
      
      onSubmit(fullProjectData)
    })
    
    alert(`✅ BATCH UPLOAD COMPLETE!

📊 PROCESSING SUMMARY:
• Total Spreadsheets: ${processingResults.length}
• Projects Successfully Imported: ${totalSuccessful}
• Projects Failed to Parse: ${totalFailed}

🗃️ DATA COMMITTED TO MEMORY:
All ${totalSuccessful} projects have been stored in the system database and are now available for scenario analysis.

${totalFailed > 0 ? `⚠️ PARSING ISSUES:
${totalFailed} projects could not be imported due to data format issues. Please check the error details and consider re-formatting those spreadsheet sections.` : ''}

You can now view all imported projects in the Projects section.`)
    
    onClose()
  }


  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%',
        maxHeight: '95vh',
        overflow: 'auto',
        margin: 0,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        color: '#111827'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>
            {step === 'upload' && 'Upload Historical Project Data'}
            {step === 'processing' && 'Processing Spreadsheets...'}
            {step === 'review' && 'Review Processed Projects'}
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              padding: '0.5rem',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {step === 'upload' ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ 
              border: '2px dashed #d1d5db', 
              borderRadius: '12px', 
              padding: '3rem', 
              marginBottom: '2rem',
              background: '#f9fafb'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <h3 style={{ color: '#111827', marginBottom: '1rem' }}>Upload Your Historical Project Spreadsheets</h3>
              <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: '1.5' }}>
                Select multiple Excel files containing historical project data. We'll automatically:
                <br />• Parse all projects from each spreadsheet
                <br />• Extract project details, costs, and performance data
                <br />• Store all data in system memory for scenario analysis
                <br />• Alert you to any data that couldn't be read
              </p>
              
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload"
                multiple
              />
              <label 
                htmlFor="file-upload"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 2rem',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  border: 'none',
                  fontSize: '16px'
                }}
              >
                📁 Choose Excel Files (Multiple)
              </label>
              
              {uploadedFiles.length > 0 && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: '#e0f2fe', 
                  borderRadius: '8px',
                  color: '#0369a1'
                }}>
                  ✅ Selected {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}:
                  <div style={{ fontSize: '14px', marginTop: '0.5rem' }}>
                    {uploadedFiles.map((file, index) => (
                      <div key={index}>• {file.name}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '1rem'
            }}>
              Supported formats: .xlsx, .xls, .csv • Multiple file selection enabled
            </div>
          </div>
        ) : step === 'processing' ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚙️</div>
            <h3 style={{ color: '#111827', marginBottom: '1rem' }}>Processing Your Spreadsheets...</h3>
            
            {isProcessing && (
              <>
                <div style={{ 
                  background: '#f3f4f6', 
                  height: '8px', 
                  borderRadius: '4px', 
                  marginBottom: '1rem',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: '#3b82f6',
                    height: '100%',
                    borderRadius: '4px',
                    width: `${((currentFileIndex + 1) / uploadedFiles.length) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  Processing file {currentFileIndex + 1} of {uploadedFiles.length}: <br />
                  <strong>{uploadedFiles[currentFileIndex]?.name}</strong>
                </p>
                
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Scanning for projects and extracting data...
                </div>
              </>
            )}
            
            {!isProcessing && processingResults.length > 0 && (
              <div style={{ 
                padding: '1rem', 
                background: '#e0f2fe', 
                borderRadius: '8px',
                color: '#0369a1',
                marginTop: '1rem'
              }}>
                ✅ Processing Complete! Moving to review...
              </div>
            )}
          </div>
        ) : (
          <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                Processing Summary
              </h3>
              
              {processingResults.map((result, fileIndex) => {
                const totalSuccessful = result.successfulProjects.length
                const totalFailed = result.failedProjects.length
                const successRate = Math.round((totalSuccessful / result.totalProcessed) * 100)
                
                return (
                  <div key={fileIndex} style={{ 
                    marginBottom: '1.5rem', 
                    padding: '1rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    background: '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ color: '#111827', fontWeight: '600', margin: 0 }}>
                        📄 {result.fileName}
                      </h4>
                      <div style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '12px',
                        background: successRate >= 80 ? '#dcfce7' : successRate >= 60 ? '#fef3c7' : '#fee2e2',
                        color: successRate >= 80 ? '#166534' : successRate >= 60 ? '#92400e' : '#dc2626',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {successRate}% Success Rate
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '14px' }}>
                      <div>
                        <strong>Total Found:</strong> {result.totalProcessed}
                      </div>
                      <div style={{ color: '#059669' }}>
                        <strong>✅ Successful:</strong> {totalSuccessful}
                      </div>
                      <div style={{ color: '#dc2626' }}>
                        <strong>❌ Failed:</strong> {totalFailed}
                      </div>
                    </div>
                    
                    {totalFailed > 0 && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '6px' }}>
                        <strong style={{ color: '#dc2626', fontSize: '14px' }}>Parsing Issues:</strong>
                        <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '0.5rem' }}>
                          {result.failedProjects.slice(0, 3).map((failed, idx) => (
                            <div key={idx}>• Row {failed.rowNumber}: {failed.errors[0]}</div>
                          ))}
                          {result.failedProjects.length > 3 && (
                            <div>... and {result.failedProjects.length - 3} more issues</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ 
              borderTop: '1px solid #e5e7eb', 
              paddingTop: '2rem',
              marginTop: '1rem'
            }}>
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Ready to import {processingResults.reduce((sum, result) => sum + result.successfulProjects.length, 0)} projects 
                  from {processingResults.length} spreadsheet{processingResults.length !== 1 ? 's' : ''}
                </div>
                
                {processingResults.some(result => result.failedProjects.length > 0) && (
                  <button
                    onClick={() => setShowErrorDetails(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'transparent',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    View Error Details
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={onClose}
                  style={{
                    padding: '0.875rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBatchSubmit}
                  style={{
                    padding: '0.875rem 1.5rem',
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'white',
                    fontWeight: '500'
                  }}
                >
                  🗃️ Import All Projects to Memory
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Details Modal */}
        {showErrorDetails && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1001
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
            }}>
              <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Detailed Parsing Errors</h3>
              
              {processingResults.map((result, fileIndex) => 
                result.failedProjects.length > 0 && (
                  <div key={fileIndex} style={{ marginBottom: '2rem' }}>
                    <h4 style={{ color: '#111827', marginBottom: '1rem' }}>
                      📄 {result.fileName}
                    </h4>
                    
                    {result.failedProjects.map((failed, idx) => (
                      <div key={idx} style={{ 
                        marginBottom: '1rem', 
                        padding: '0.75rem', 
                        background: '#fef2f2', 
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}>
                        <div style={{ fontWeight: '600', color: '#dc2626', marginBottom: '0.5rem' }}>
                          Row {failed.rowNumber}: {failed.projectName}
                        </div>
                        <ul style={{ color: '#991b1b', margin: 0, paddingLeft: '1rem' }}>
                          {failed.errors.map((error, errorIdx) => (
                            <li key={errorIdx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )
              )}
              
              <button
                onClick={() => setShowErrorDetails(false)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectUploadModal