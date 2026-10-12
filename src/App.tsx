import { CheckIcon, GraphIcon, RocketIcon, SearchIcon, ToolsIcon } from '@primer/octicons-react'
import {
  Heading,
  Label,
  type LabelProps,
  Link,
  PageHeader,
  Spinner,
  Stack,
  StateLabel,
  type StateLabelProps,
  Text,
  Timeline,
} from '@primer/react'
import { type ReactNode, useEffect, useState } from 'react'
import styles from './App.module.css'
import data from './data.json'

type Status = 'pr' | 'blocked' | 'held' | 'scanning'

type Finding = {
  repo: string
  status: Status
  workflow?: string
  pr?: number
  branch?: string
  issue?: number
  title?: string
  pattern?: string
  problem?: string
  fix?: string
  measured?: string
  estimatedMinPerWeek?: number
  pctOfRepo?: number
  validated?: string
  note?: string
}

type PrState = StateLabelProps['status']

const findings = data.findings as Finding[]
const REPO_URL = 'https://github.com/austenstone/oss-actions-optimization'

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : `${n}`)

const byImpact = (a: Finding, b: Finding) => (b.estimatedMinPerWeek ?? 0) - (a.estimatedMinPerWeek ?? 0)

const prs = findings.filter(({ status }) => status === 'pr').sort(byImpact)
const held = findings.filter(({ status }) => status === 'held' || status === 'blocked').sort(byImpact)
const scanning = findings.filter(({ status }) => status === 'scanning')
const shippedMinPerWeek = prs.reduce((sum, { estimatedMinPerWeek }) => sum + (estimatedMinPerWeek ?? 0), 0)

type PullResponse = { merged_at: string | null; state: string; draft: boolean }

const toPrState = ({ merged_at, state, draft }: PullResponse): PrState =>
  merged_at ? 'pullMerged' : state === 'closed' ? 'pullClosed' : draft ? 'draft' : 'pullOpened'

const prStateText: Partial<Record<PrState, string>> = {
  pullOpened: 'Open',
  pullMerged: 'Merged',
  pullClosed: 'Closed',
  draft: 'Draft',
}

const fetchPrState = async ({ repo, pr }: Finding) => {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/pulls/${pr}`)
    if (!res.ok) return null
    return [repo, toPrState((await res.json()) as PullResponse)] as const
  } catch {
    return null
  }
}

const usePrStates = () => {
  const [states, setStates] = useState<Record<string, PrState>>({})

  useEffect(() => {
    const load = async () => {
      const entries = await Promise.all(prs.map(fetchPrState))
      setStates(Object.fromEntries(entries.filter((e) => e !== null)))
    }
    load()
  }, [])

  return states
}

const heldLabel: Record<string, { text: string; variant: LabelProps['variant'] }> = {
  blocked: { text: 'Blocked', variant: 'severe' },
  held: { text: 'Held', variant: 'attention' },
}

const FindingCard = ({ finding, prState = 'pullOpened' }: { finding: Finding; prState?: PrState }) => {
  const {
    repo,
    workflow,
    pr,
    branch,
    issue,
    title,
    pattern,
    problem,
    fix,
    measured,
    estimatedMinPerWeek,
    pctOfRepo,
    validated,
    note,
    status,
  } = finding
  const href = pr ? `https://github.com/${repo}/pull/${pr}` : branch

  return (
    <div className={styles.card}>
      <Stack gap="condensed">
        <Stack direction="horizontal" align="center" wrap="wrap" gap="condensed">
          {pr ? (
            <StateLabel status={prState} size="small">
              {prStateText[prState]}
            </StateLabel>
          ) : (
            <Label variant={heldLabel[status]?.variant}>{heldLabel[status]?.text}</Label>
          )}
          <Link href={`https://github.com/${repo}`}>
            <Text weight="semibold">{repo}</Text>
          </Link>
          <span className={styles.mono}>{workflow}</span>
          {pattern && <Label variant="secondary">{pattern}</Label>}
          {issue && <Link href={`https://github.com/${repo}/issues/${issue}`}>Issue #{issue}</Link>}
        </Stack>
        <Heading as="h3" variant="small">
          {href ? (
            <Link href={href}>
              {title}
              {pr && <span className={styles.muted}> #{pr}</span>}
            </Link>
          ) : (
            title
          )}
        </Heading>
        <Text as="p">{problem}</Text>
        <Text as="p">
          <Text weight="semibold">Fix:</Text> {fix}
        </Text>
        <Stack direction="horizontal" wrap="wrap" gap="condensed">
          {estimatedMinPerWeek && <Label variant="success">~{fmt(estimatedMinPerWeek)} job-min/week (est.)</Label>}
          {pctOfRepo && <Label variant="success">~{pctOfRepo}% of the repo's CI minutes</Label>}
          {validated && <Label variant="accent">Fork-validated</Label>}
        </Stack>
        <Text as="p" size="small" className={styles.muted}>
          <Text weight="semibold">Measured:</Text> {measured}
          {validated && ` ${validated}`}
          {note && ` ${note}`}
        </Text>
      </Stack>
    </div>
  )
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className={styles.section}>
    <Heading as="h2" variant="medium" className={styles.sectionTitle}>
      {title}
    </Heading>
    {children}
  </section>
)

const steps = [
  { icon: SearchIcon, title: 'Find', body: 'Shortlist the busiest public repos and their heaviest workflows.' },
  {
    icon: GraphIcon,
    title: 'Measure',
    body: 'Pull real runs, jobs and step timing from the public Actions API. Separate queue time, wall clock, job minutes and waste.',
  },
  {
    icon: ToolsIcon,
    title: 'Fix',
    body: 'Pick the strongest finding and write the smallest diff that removes it. Fail open: when in doubt, run everything.',
  },
  { icon: RocketIcon, title: 'Ship', body: "Validate on a fork where possible, then open a short PR that follows the repo's template." },
]

const rules = [
  ['Structural waste over red builds.', 'A workflow that mostly fails needs a diagnosis, not a CI tweak.'],
  ['Measured vs estimated, always labeled.', 'Measured numbers come from a stated window of real runs. Estimates project them forward.'],
  ["Don't change what a project means to test.", 'Changes that alter coverage on purpose go to maintainers as findings, not PRs.'],
  ['Short PRs.', 'Problem, fix, how it was tested. The diff does the talking.'],
  ['Minutes, not dollars.', 'Public repos run free on standard GitHub-hosted runners. The win is capacity and faster queues.'],
]

const App = () => {
  const prStates = usePrStates()
  const merged = Object.values(prStates).filter((s) => s === 'pullMerged').length

  const stats = [
    [`${prs.length}`, 'PRs opened'],
    [`${merged}`, 'merged'],
    [`${findings.length}`, 'repos scanned'],
    [`~${fmt(shippedMinPerWeek)}`, 'job-min/week in open PRs (est.)'],
  ]

  return (
    <main className={styles.page}>
      <PageHeader>
        <PageHeader.TitleArea>
          <PageHeader.Title as="h1">Optimizing GitHub Actions across open source</PageHeader.Title>
        </PageHeader.TitleArea>
      </PageHeader>
      <Text as="p" className={styles.lede}>
        AI agents scan busy public repos, measure where Actions minutes go, and send small PRs that cut the waste. Every
        number here comes from public run history.
      </Text>

      <div className={styles.stats}>
        {stats.map(([value, label]) => (
          <div key={label} className={styles.stat}>
            <span className={styles.statValue}>{value}</span>
            <Text size="small" className={styles.muted}>
              {label}
            </Text>
          </div>
        ))}
      </div>

      <Section title="Pull requests">
        <Stack gap="normal">
          {prs.map((f) => (
            <FindingCard key={f.repo} finding={f} prState={prStates[f.repo]} />
          ))}
        </Stack>
      </Section>

      <Section title="Found, not shipped">
        <Stack gap="normal">
          {held.map((f) => (
            <FindingCard key={f.repo} finding={f} />
          ))}
          {scanning.length > 0 && (
            <Stack direction="horizontal" align="center" gap="condensed">
              <Spinner size="small" />
              <Text className={styles.muted}>In progress: {scanning.map(({ repo }) => repo).join(', ')}</Text>
            </Stack>
          )}
        </Stack>
      </Section>

      <Section title="How it works">
        <Timeline>
          {steps.map(({ icon: Icon, title, body }) => (
            <Timeline.Item key={title}>
              <Timeline.Badge>
                <Icon />
              </Timeline.Badge>
              <Timeline.Body>
                <Text weight="semibold">{title}.</Text> {body}
              </Timeline.Body>
            </Timeline.Item>
          ))}
        </Timeline>
        <Text as="p">
          The agents follow the public <Link href={data.skill}>actions-optimization skill</Link>.
        </Text>
      </Section>

      <Section title="Rules we hold ourselves to">
        <ul className={styles.list}>
          {rules.map(([lead, rest]) => (
            <li key={lead}>
              <CheckIcon className={styles.muted} /> <Text weight="semibold">{lead}</Text> {rest}
            </li>
          ))}
        </ul>
      </Section>

      <Text as="p" size="small" className={`${styles.section} ${styles.muted}`}>
        Updated {data.updated}. PR states load live from the GitHub API. Source:{' '}
        <Link href={REPO_URL}>austenstone/oss-actions-optimization</Link>
      </Text>
    </main>
  )
}

export default App
