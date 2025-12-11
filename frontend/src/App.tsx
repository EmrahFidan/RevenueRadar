import { useState } from 'react'
import { Upload, FileSpreadsheet, Loader2, X, Copy, Check, Sparkles, Target, Zap, Download, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ResultsTable } from '@/components/ResultsTable'
import {
  analyzeFile,
  draftEmail,
  exportToExcel,
  downloadBlob,
  type LeadAnalysis,
  type EmailDraft
} from '@/services/api'

type ScoreFilter = 'all' | 'hot' | 'warm' | 'cold'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<LeadAnalysis[] | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all')
  const [isExporting, setIsExporting] = useState(false)

  // Email modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null)
  const [selectedLead, setSelectedLead] = useState<LeadAnalysis | null>(null)
  const [copied, setCopied] = useState<'subject' | 'body' | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validExtensions = ['.xlsx', '.csv']
      const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'))

      if (!validExtensions.includes(fileExtension)) {
        setError('Only .xlsx and .csv files are supported.')
        setFile(null)
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await analyzeFile(file)
      setResults(response.results)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage || 'An error occurred during analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      const validExtensions = ['.xlsx', '.csv']
      const fileExtension = droppedFile.name.toLowerCase().slice(droppedFile.name.lastIndexOf('.'))

      if (!validExtensions.includes(fileExtension)) {
        setError('Only .xlsx and .csv files are supported.')
        return
      }

      setFile(droppedFile)
      setError(null)
    }
  }

  const handleEmailDraft = async (lead: LeadAnalysis) => {
    setSelectedLead(lead)
    setEmailModalOpen(true)
    setEmailLoading(true)
    setEmailDraft(null)

    try {
      const draft = await draftEmail(
        lead.customer_name,
        lead.lead_data?.company_name || '',
        lead.reason
      )
      setEmailDraft(draft)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage || 'Failed to generate email draft')
      setEmailModalOpen(false)
    } finally {
      setEmailLoading(false)
    }
  }

  const handleCopy = async (type: 'subject' | 'body') => {
    if (!emailDraft) return
    const text = type === 'subject' ? emailDraft.subject : emailDraft.body
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const closeEmailModal = () => {
    setEmailModalOpen(false)
    setEmailDraft(null)
    setSelectedLead(null)
  }

  const handleExportExcel = async () => {
    if (!results) return

    setIsExporting(true)
    try {
      const blob = await exportToExcel(results)
      const date = new Date().toISOString().split('T')[0]
      downloadBlob(blob, `RevenueRadar_Results_${date}.xlsx`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage || 'Failed to export to Excel')
    } finally {
      setIsExporting(false)
    }
  }

  // Filter results based on search and score filter
  const getFilteredResults = () => {
    if (!results) return []

    let filtered = results

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(lead =>
        lead.customer_name.toLowerCase().includes(query) ||
        lead.lead_data?.company_name?.toLowerCase().includes(query) ||
        lead.lead_data?.industry?.toLowerCase().includes(query) ||
        lead.lead_data?.country?.toLowerCase().includes(query)
      )
    }

    // Apply score filter
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(lead => {
        if (scoreFilter === 'hot') return lead.score >= 80
        if (scoreFilter === 'warm') return lead.score >= 60 && lead.score < 80
        if (scoreFilter === 'cold') return lead.score < 60
        return true
      })
    }

    return filtered
  }

  const filteredResults = getFilteredResults()

  // Results view
  if (results) {
    return (
      <div className="min-h-screen bg-grid-pattern p-4 md:p-8">
        {/* Background gradient orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center glow-green">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gradient">
                  RevenueRadar
                </h1>
              </div>
              <p className="text-slate-400 text-sm md:text-base">
                Analysis complete • <span className="text-emerald-400 font-semibold">{results.length}</span> leads scored
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="bg-slate-700/50 hover:bg-slate-600/50 text-white px-4 py-2 rounded-xl border border-slate-600/50"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export Excel
              </Button>
              <Button
                onClick={() => { setResults(null); setFile(null); setSearchQuery(''); setScoreFilter('all'); }}
                className="btn-primary px-6 py-3 rounded-xl"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 animate-fade-in-up stagger-1">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, company, industry, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </div>

            {/* Score Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-400" />
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'hot', label: 'Hot (80+)' },
                  { value: 'warm', label: 'Warm (60-79)' },
                  { value: 'cold', label: 'Cold (<60)' },
                ].map((filter) => {
                  const isSelected = scoreFilter === filter.value
                  let selectedStyle = ''
                  let unselectedStyle = 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700/50'

                  if (isSelected) {
                    if (filter.value === 'all') {
                      selectedStyle = 'bg-slate-600 text-white border-2 border-white/50 shadow-lg'
                    } else if (filter.value === 'hot') {
                      selectedStyle = 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    } else if (filter.value === 'warm') {
                      selectedStyle = 'bg-yellow-500/30 text-yellow-300 border-2 border-yellow-400 shadow-lg shadow-yellow-500/20'
                    } else {
                      selectedStyle = 'bg-orange-500/30 text-orange-300 border-2 border-orange-400 shadow-lg shadow-orange-500/20'
                    }
                  }

                  return (
                    <button
                      key={filter.value}
                      onClick={() => setScoreFilter(filter.value as ScoreFilter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected ? selectedStyle : unselectedStyle
                      }`}
                    >
                      {filter.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Results count after filtering */}
          {(searchQuery || scoreFilter !== 'all') && (
            <p className="text-slate-400 text-sm mb-4 animate-fade-in-up">
              Showing <span className="text-emerald-400 font-semibold">{filteredResults.length}</span> of {results.length} leads
            </p>
          )}

          <ResultsTable results={filteredResults} onEmailDraft={handleEmailDraft} />

          {/* Email Modal */}
          {emailModalOpen && (
            <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4 animate-fade-in-up">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto glass-strong rounded-2xl border-slate-700/50 animate-scale-in">
                <CardHeader className="flex flex-row items-start justify-between border-b border-slate-700/50 pb-4">
                  <div>
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      Email Draft
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-1">
                      AI-generated for {selectedLead?.customer_name}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeEmailModal}
                    className="rounded-xl hover:bg-slate-700/50 text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {emailLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 flex items-center justify-center mb-4 animate-pulse-glow">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                      </div>
                      <p className="text-slate-400">AI is generating your email draft...</p>
                    </div>
                  ) : emailDraft ? (
                    <div className="space-y-6">
                      <div className="animate-fade-in-up">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Subject</label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy('subject')}
                            className="rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white"
                          >
                            {copied === 'subject' ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            <span className="ml-2 text-xs">Copy</span>
                          </Button>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl text-white border border-slate-700/50">
                          {emailDraft.subject}
                        </div>
                      </div>
                      <div className="animate-fade-in-up stagger-1">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Body</label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy('body')}
                            className="rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white"
                          >
                            {copied === 'body' ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            <span className="ml-2 text-xs">Copy</span>
                          </Button>
                        </div>
                        <div className="bg-slate-800/50 p-5 rounded-xl text-slate-200 whitespace-pre-wrap border border-slate-700/50 leading-relaxed">
                          {emailDraft.body}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-grid-pattern relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 mb-6 glow-green animate-pulse-glow">
            <Target className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gradient mb-3">
            RevenueRadar
          </h1>
          <p className="text-slate-400 text-lg">
            Stop guessing, <span className="text-emerald-400 font-semibold">find your hottest leads</span>.
          </p>
        </div>

        <Card className="glass-strong rounded-2xl border-slate-700/50 overflow-hidden animate-fade-in-up stagger-1">
          <CardHeader className="text-center pb-2 pt-8">
            <CardTitle className="text-xl text-white font-bold">
              Upload Lead Data
            </CardTitle>
            <CardDescription className="text-slate-400">
              AI-powered analysis to score your potential customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-8">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 rounded-xl animate-scale-in">
                <AlertTitle className="text-red-400 font-semibold">Error</AlertTitle>
                <AlertDescription className="text-red-300/80">{error}</AlertDescription>
              </Alert>
            )}

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                upload-zone rounded-2xl p-10 text-center cursor-pointer
                ${isDragActive ? 'upload-zone-active' : ''}
                ${file ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
              `}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center gap-3 animate-scale-in">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 flex items-center justify-center">
                    <FileSpreadsheet className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-lg">{file.name}</p>
                    <p className="text-sm text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB • Ready for analysis
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center group-hover:bg-slate-700">
                    <Upload className="h-8 w-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-lg mb-1">
                      Drag your file here or click to browse
                    </p>
                    <p className="text-sm text-slate-500">
                      Excel (.xlsx) or CSV format
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!file || isLoading}
              className={`
                w-full py-6 rounded-xl text-base font-semibold transition-all duration-300
                ${file && !isLoading
                  ? 'btn-primary'
                  : 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                }
              `}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  AI Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Analyze Leads
                </>
              )}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[
                { icon: '🎯', label: 'Hybrid Scoring' },
                { icon: '⚡', label: 'Fast Analysis' },
                { icon: '✉️', label: 'AI Emails' },
              ].map((feature, i) => (
                <div
                  key={feature.label}
                  className={`text-center p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 animate-fade-in-up stagger-${i + 2}`}
                >
                  <div className="text-2xl mb-1">{feature.icon}</div>
                  <div className="text-xs text-slate-400 font-medium">{feature.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6 animate-fade-in-up stagger-5">
          Powered by <span className="text-emerald-400 font-medium">Groq AI</span> • Llama 3.3 70B
        </p>
      </div>
    </div>
  )
}

export default App
