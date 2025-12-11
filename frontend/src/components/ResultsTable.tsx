import { useState, Fragment } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Mail,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Flame,
  Thermometer,
  Snowflake,
  TrendingUp,
  MessageSquare,
  Zap,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2
} from 'lucide-react'
import type { LeadAnalysis } from '@/services/api'

interface ResultsTableProps {
  results: LeadAnalysis[]
  onEmailDraft: (lead: LeadAnalysis) => void
}

type SortField = 'score' | 'customer_name'
type SortDirection = 'asc' | 'desc'

function getScoreFillClass(score: number): string {
  if (score >= 80) return 'score-fill-hot'
  if (score >= 60) return 'score-fill-warm'
  if (score >= 40) return 'score-fill-cold'
  return 'score-fill-ice'
}

function getScoreBadgeClass(score: number): string {
  if (score >= 80) return 'badge-hot'
  if (score >= 60) return 'badge-warm'
  if (score >= 40) return 'badge-cold'
  return 'badge-ice'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Hot'
  if (score >= 60) return 'Warm'
  if (score >= 40) return 'Cold'
  return 'Ice Cold'
}

function getScoreIcon(score: number) {
  if (score >= 80) return <Flame className="h-3 w-3" />
  if (score >= 60) return <Thermometer className="h-3 w-3" />
  return <Snowflake className="h-3 w-3" />
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount}`
}

export function ResultsTable({ results, onEmailDraft }: ResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'score' ? 'desc' : 'asc')
    }
  }

  const sortedResults = [...results].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1
    if (sortField === 'score') {
      return (a.score - b.score) * multiplier
    }
    return a.customer_name.localeCompare(b.customer_name) * multiplier
  })

  // Statistics
  const hotLeads = results.filter(r => r.score >= 80).length
  const warmLeads = results.filter(r => r.score >= 60 && r.score < 80).length
  const coldLeads = results.filter(r => r.score < 60).length
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass stat-card stat-card-hot rounded-xl border-slate-700/50 card-hover animate-fade-in-up">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Flame className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-3xl font-black text-emerald-400">{hotLeads}</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">Hot Leads</p>
            <p className="text-xs text-slate-500">80+ score</p>
          </CardContent>
        </Card>

        <Card className="glass stat-card stat-card-warm rounded-xl border-slate-700/50 card-hover animate-fade-in-up stagger-1">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Thermometer className="h-5 w-5 text-yellow-400" />
              </div>
              <span className="text-3xl font-black text-yellow-400">{warmLeads}</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">Warm Leads</p>
            <p className="text-xs text-slate-500">60-79 score</p>
          </CardContent>
        </Card>

        <Card className="glass stat-card stat-card-cold rounded-xl border-slate-700/50 card-hover animate-fade-in-up stagger-2">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Snowflake className="h-5 w-5 text-orange-400" />
              </div>
              <span className="text-3xl font-black text-orange-400">{coldLeads}</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">Cold Leads</p>
            <p className="text-xs text-slate-500">&lt;60 score</p>
          </CardContent>
        </Card>

        <Card className="glass stat-card stat-card-neutral rounded-xl border-slate-700/50 card-hover animate-fade-in-up stagger-3">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-slate-400" />
              </div>
              <span className="text-3xl font-black text-white">{avgScore}</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">Average Score</p>
            <p className="text-xs text-slate-500">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="glass-strong rounded-2xl border-slate-700/50 overflow-hidden animate-fade-in-up stagger-4">
        <CardHeader className="border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">Analysis Results</CardTitle>
              <CardDescription className="text-slate-400">
                Leads sorted by score • Click a row for details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/30">
                  <th className="text-left py-4 px-6 font-semibold text-slate-300">
                    <button
                      onClick={() => handleSort('customer_name')}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      Lead
                      <ArrowUpDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-300">
                    <button
                      onClick={() => handleSort('score')}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      Score
                      <ArrowUpDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-300">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-300 hidden md:table-cell">Company</th>
                  <th className="text-right py-4 px-6 font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((lead, index) => (
                  <Fragment key={index}>
                    <tr
                      className="border-b border-slate-700/30 table-row-hover cursor-pointer group"
                      onClick={() => toggleRow(index)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-700 transition-colors">
                            {expandedRows.has(index) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                          <span className="font-semibold text-white">
                            {lead.customer_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-24 score-bar">
                            <div
                              className={`score-fill ${getScoreFillClass(lead.score)}`}
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <span className="font-bold text-white w-8 text-right">
                            {lead.score}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getScoreBadgeClass(lead.score)}`}
                        >
                          {getScoreIcon(lead.score)}
                          {getScoreLabel(lead.score)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-sm max-w-xs truncate hidden md:table-cell">
                        {lead.lead_data?.company_name || '-'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEmailDraft(lead)
                          }}
                          className="btn-primary rounded-lg px-4"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      </td>
                    </tr>
                    {expandedRows.has(index) && (
                      <tr className="bg-slate-800/30 animate-fade-in-up">
                        <td colSpan={5} className="py-6 px-6">
                          <div className="ml-9 space-y-6">
                            {/* Lead Details Grid */}
                            {lead.lead_data && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Building2 className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-400">Industry:</span>
                                  <span className="text-white">{lead.lead_data.industry || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-400">Location:</span>
                                  <span className="text-white">{lead.lead_data.city}, {lead.lead_data.country}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-400">Employees:</span>
                                  <span className="text-white">{lead.lead_data.employee_count?.toLocaleString() || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-400">Revenue:</span>
                                  <span className="text-white">{formatCurrency(lead.lead_data.annual_revenue_usd || 0)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-slate-400">Budget:</span>
                                  <span className="text-white">{lead.lead_data.budget_range || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-400">Timeline:</span>
                                  <span className="text-white">{lead.lead_data.purchase_timeline || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-slate-400">Decision:</span>
                                  <span className="text-white">{lead.lead_data.decision_authority || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-slate-400">Source:</span>
                                  <span className="text-white">{lead.lead_data.lead_source || '-'}</span>
                                </div>
                              </div>
                            )}

                            {/* Score Breakdown */}
                            {lead.score_breakdown && (
                              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                                  Score Breakdown (Hybrid System)
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {Object.entries(lead.score_breakdown).map(([key, value]) => (
                                    <div key={key} className="text-center">
                                      <div className="text-lg font-bold text-white">{value}</div>
                                      <div className="text-xs text-slate-500 capitalize">{key.replace('_', ' ')}</div>
                                    </div>
                                  ))}
                                </div>
                                {lead.rule_based_score !== undefined && lead.ai_adjustment !== undefined && (
                                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-center gap-6 text-sm">
                                    <div>
                                      <span className="text-slate-400">Rule-based: </span>
                                      <span className="text-white font-semibold">{lead.rule_based_score}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">AI Adjustment: </span>
                                      <span className={`font-semibold ${lead.ai_adjustment >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {lead.ai_adjustment >= 0 ? '+' : ''}{lead.ai_adjustment}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Final: </span>
                                      <span className="text-emerald-400 font-bold">{lead.score}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Reason */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                                  Why this score?
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed pl-6">
                                  {lead.reason}
                                </p>
                              </div>

                              {/* Recommended Actions - Bullet Points */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                                  <Zap className="h-4 w-4 text-cyan-400" />
                                  Recommended Actions
                                </div>
                                <ul className="space-y-2 pl-6">
                                  {lead.actions && lead.actions.length > 0 ? (
                                    lead.actions.map((action, actionIndex) => (
                                      <li key={actionIndex} className="flex items-start gap-2 text-slate-400 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span>{action}</span>
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-slate-500 text-sm">No specific actions recommended</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
