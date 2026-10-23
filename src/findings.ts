import data from './data.json'
import prState from './pr-state.json'

type Status = 'pr' | 'blocked' | 'held' | 'fixed' | 'scanning'

export type Response = { quote: string; author: string; url: string }

export type PrSync = {
  status: 'open' | 'merged' | 'closed' | 'draft'
  review: 'approved' | 'changes' | null
  mergedAt?: string | null
}

export type Finding = {
  repo: string
  status: Status
  workflow?: string
  pr?: number
  branch?: string
  issue?: number | null
  title?: string
  pattern?: string
  problem?: string
  fix?: string
  measured?: string
  estimatedMinPerWeek?: number
  pctOfRepo?: number
  validated?: string
  note?: string | null
  response?: Response
  fixedBy?: number | null
}

export const { updated, skill } = data
export const syncedAt = prState.syncedAt
export const REPO_URL = 'https://github.com/austenstone/oss-actions-optimization'

const findings = data.findings as Finding[]
const prStates = prState.prs as Record<string, PrSync>

export const syncOf = ({ repo, pr }: Finding): PrSync => prStates[`${repo}#${pr}`] ?? { status: 'open', review: null }

export const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : `${n}`)

export const sumMinutes = (list: Finding[]) =>
  list.reduce((sum, { estimatedMinPerWeek }) => sum + (estimatedMinPerWeek ?? 0), 0)

export const prUrl = ({ repo, pr }: Finding) => `https://github.com/${repo}/pull/${pr}`

export const shortDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : ''

const byImpact = (a: Finding, b: Finding) => (b.estimatedMinPerWeek ?? 0) - (a.estimatedMinPerWeek ?? 0)
const approvedFirst = (a: Finding, b: Finding) =>
  Number(syncOf(b).review === 'approved') - Number(syncOf(a).review === 'approved') || byImpact(a, b)

const prs = findings.filter(({ status }) => status === 'pr')
const withSync = (...statuses: PrSync['status'][]) => prs.filter((f) => statuses.includes(syncOf(f).status))

export const merged = withSync('merged').sort(byImpact)
export const inReview = withSync('open', 'draft').sort(approvedFirst)
export const declined = withSync('closed').sort(byImpact)
export const notShipped = findings.filter(({ status }) => ['held', 'blocked', 'fixed'].includes(status)).sort(byImpact)
export const scanning = findings.filter(({ status }) => status === 'scanning')

export const featured = merged.find(({ response }) => response) ?? merged[0]

const GROUP_MIN = 3
export const repeatPatterns = [...new Set(merged.map(({ pattern }) => pattern))]
  .filter((pattern): pattern is string => Boolean(pattern))
  .map((pattern) => ({ pattern, list: merged.filter((f) => f.pattern === pattern) }))
  .filter(({ list }) => list.length >= GROUP_MIN)
const grouped = new Set(repeatPatterns.flatMap(({ list }) => list))
export const mergedCases = merged.filter((f) => f !== featured && !grouped.has(f))

export const stats = {
  prs: prs.length,
  repos: new Set(prs.map(({ repo }) => repo)).size,
  merged: merged.length,
  mergedMinutes: sumMinutes(merged),
  mergeRate: Math.round((merged.length / Math.max(merged.length + declined.length, 1)) * 100),
  decided: merged.length + declined.length,
  inReview: inReview.length,
  approved: inReview.filter((f) => syncOf(f).review === 'approved').length,
}
