import {
  CheckCircleIcon,
  CommentDiscussionIcon,
  GitMergeIcon,
  GitPullRequestClosedIcon,
  GitPullRequestIcon,
  GraphIcon,
  MoonIcon,
  RocketIcon,
  SearchIcon,
  SunIcon,
  ToolsIcon,
} from '@primer/octicons-react'
import {
  Button,
  Grid,
  Heading,
  Hero,
  InlineLink,
  Label,
  type LabelProps,
  Link,
  Pillar,
  Statistic,
  Testimonial,
  Text,
  ThemeProvider,
} from '@primer/react-brand'
import { type ReactNode, useState } from 'react'
import styles from './App.module.css'
import {
  declined,
  type Finding,
  featured,
  fmt,
  inReview,
  mergedCases,
  notShipped,
  prUrl,
  REPO_URL,
  repeatPatterns,
  scanning,
  shortDate,
  skill,
  stats,
  syncedAt,
  syncOf,
  updated,
} from './findings'

const Eyebrow = ({ children, accent }: { children: ReactNode; accent?: boolean }) => (
  <Text as="p" font="monospace" size="100" className={accent ? `${styles.eyebrow} ${styles.accent}` : styles.eyebrow}>
    {children}
  </Text>
)

const Accent = ({ children }: { children: ReactNode }) => <span className={styles.accent}>{children}</span>

const SectionHead = ({
  index,
  label,
  aside,
  children,
}: {
  index: string
  label: string
  aside?: ReactNode
  children: ReactNode
}) => (
  <header className={styles.sectionHead}>
    <div className={styles.eyebrowRow}>
      <Eyebrow>
        {index} / {label}
      </Eyebrow>
      {aside}
    </div>
    <Heading as="h2" size="2" weight="semibold" font="monospace" letterSpacing="condensed">
      {children}
    </Heading>
  </header>
)

const Field = ({ label, children }: { label: string; children: ReactNode }) =>
  children ? (
    <div className={styles.field}>
      <Eyebrow>{label}</Eyebrow>
      <Text as="p" size="300" variant="muted">
        {children}
      </Text>
    </div>
  ) : null

const ShareBar = ({ pct }: { pct: number }) => (
  <div className={styles.share}>
    <div className={styles.shareMeta}>
      <Eyebrow>Share of repo CI minutes</Eyebrow>
      <Text font="monospace" size="100" variant="muted">
        ~{pct}% (est.)
      </Text>
    </div>
    <div className={styles.bar}>
      <span className={styles.barKept} style={{ width: `${100 - pct}%` }} />
      <span className={styles.barCut} style={{ width: `${pct}%` }} />
    </div>
  </div>
)

const Impact = ({ minutes, size = 'medium' }: { minutes?: number; size?: 'small' | 'medium' | 'large' }) =>
  minutes ? (
    <Statistic size={size}>
      <Statistic.Heading className={styles.accent}>~{fmt(minutes)}</Statistic.Heading>
      <Statistic.Description variant="muted">job-min/week (est.)</Statistic.Description>
    </Statistic>
  ) : null

const Quote = ({ finding: { response, repo } }: { finding: Finding }) =>
  response ? (
    <blockquote className={styles.quote}>
      <Text as="p" size="300">
        “{response.quote}”
      </Text>
      <Text as="p" font="monospace" size="100" variant="muted">
        <InlineLink href={response.url}>@{response.author}</InlineLink>, maintainer of {repo.split('/')[1]}
      </Text>
    </blockquote>
  ) : null

const refOf = (f: Finding) => (f.pr ? `#${f.pr}` : f.issue ? `issue #${f.issue}` : '')
const hrefOf = (f: Finding) =>
  f.pr ? prUrl(f) : f.issue ? `https://github.com/${f.repo}/issues/${f.issue}` : `https://github.com/${f.repo}`

const Featured = ({ finding }: { finding: Finding }) => {
  const { repo, title, problem, fix, measured, validated, response, pctOfRepo, estimatedMinPerWeek, pattern } = finding
  return (
    <section id="featured" className={styles.section}>
      <SectionHead
        index="01"
        label="Featured case"
        aside={
          <Link href={prUrl(finding)} size="small" variant="accent" arrowDirection="none">
            {repo} {refOf(finding)} ↗
          </Link>
        }
      >
        {title}. <Accent>Merged {shortDate(syncOf(finding).mergedAt)}.</Accent>
      </SectionHead>
      <Grid className={styles.grid}>
        <Grid.Column span={{ xsmall: 12, large: 5 }}>
          <div className={styles.featuredAside}>
            <Label color="purple" leadingVisual={<GitMergeIcon />}>
              {pattern}
            </Label>
            <Impact minutes={estimatedMinPerWeek} size="large" />
            {pctOfRepo && <ShareBar pct={pctOfRepo} />}
          </div>
        </Grid.Column>
        <Grid.Column span={{ xsmall: 12, large: 7 }}>
          <Field label="Problem">{problem}</Field>
          <Field label="Fix">{fix}</Field>
          <Field label="Measured">{[measured, validated].filter(Boolean).join(' ')}</Field>
        </Grid.Column>
      </Grid>
      {response && (
        <Testimonial size="large" quoteMarkColor="green" className={styles.testimonial}>
          <Testimonial.Quote>{response.quote}</Testimonial.Quote>
          <Testimonial.Name position={`Maintainer, ${repo}`}>
            <InlineLink href={response.url}>@{response.author}</InlineLink>
          </Testimonial.Name>
        </Testimonial>
      )}
    </section>
  )
}

const CaseRow = ({ finding }: { finding: Finding }) => {
  const { repo, title, problem, fix, measured, validated, note, pctOfRepo, estimatedMinPerWeek, pattern } = finding
  return (
    <article className={styles.row}>
      <Grid className={styles.grid}>
        <Grid.Column span={{ xsmall: 12, large: 4 }}>
          <div className={styles.rowAside}>
            <Eyebrow accent>
              {repo.split('/')[1]} / {refOf(finding)} · merged {shortDate(syncOf(finding).mergedAt)}
            </Eyebrow>
            <Heading as="h3" size="5" weight="semibold">
              <a href={prUrl(finding)} className={styles.titleLink}>
                {title}
              </a>
            </Heading>
            {pattern && (
              <Label size="small" color="gray">
                {pattern}
              </Label>
            )}
            <Impact minutes={estimatedMinPerWeek} size="small" />
            {pctOfRepo && <ShareBar pct={pctOfRepo} />}
          </div>
        </Grid.Column>
        <Grid.Column span={{ xsmall: 12, large: 8 }}>
          <Field label="Problem">{problem}</Field>
          <Field label="Fix">{fix}</Field>
          <Field label="Measured">{[measured, validated, note].filter(Boolean).join(' ')}</Field>
          <Quote finding={finding} />
        </Grid.Column>
      </Grid>
    </article>
  )
}

const PatternGroup = ({ pattern, list }: { pattern: string; list: Finding[] }) => {
  const [example] = list
  return (
    <article className={styles.row}>
      <Grid className={styles.grid}>
        <Grid.Column span={{ xsmall: 12, large: 4 }}>
          <div className={styles.rowAside}>
            <Eyebrow accent>
              One pattern · {list.length} repos · {list.length} merges
            </Eyebrow>
            <Heading as="h3" size="5" weight="semibold">
              {pattern}
            </Heading>
            <Impact minutes={list.reduce((sum, f) => sum + (f.estimatedMinPerWeek ?? 0), 0)} size="small" />
          </div>
        </Grid.Column>
        <Grid.Column span={{ xsmall: 12, large: 8 }}>
          <Field label={`e.g. ${example.repo.split('/')[1]}`}>{example.problem}</Field>
          <Field label="Fix">{example.fix}</Field>
          <ul className={styles.ledger}>
            {list.map((f) => (
              <li key={`${f.repo}#${f.pr}`}>
                <div className={styles.ledgerLine}>
                  <a href={prUrl(f)} className={styles.titleLink}>
                    <Text font="monospace" size="200">
                      {f.repo} {refOf(f)}
                    </Text>
                  </a>
                  <Text font="monospace" size="100" variant="muted">
                    {f.estimatedMinPerWeek ? `~${fmt(f.estimatedMinPerWeek)} min/wk · ` : ''}merged{' '}
                    {shortDate(syncOf(f).mergedAt)}
                  </Text>
                </div>
                {f.response && (
                  <Text as="p" size="200" variant="muted" className={styles.ledgerQuote}>
                    “{f.response.quote}” <InlineLink href={f.response.url}>@{f.response.author}</InlineLink>
                  </Text>
                )}
              </li>
            ))}
          </ul>
        </Grid.Column>
      </Grid>
    </article>
  )
}

type Badge = { text: string; color: LabelProps['color']; icon: ReactNode }

const badgeOf = (f: Finding): Badge => {
  const { status, review } = syncOf(f)
  if (f.status === 'fixed') return { text: 'Fixed by maintainers', color: 'green', icon: <CheckCircleIcon /> }
  if (f.status === 'held') return { text: 'Held', color: 'yellow', icon: <CommentDiscussionIcon /> }
  if (f.status === 'blocked') return { text: 'Issue filed', color: 'orange', icon: <CommentDiscussionIcon /> }
  if (status === 'closed') return { text: 'Declined', color: 'gray', icon: <GitPullRequestClosedIcon /> }
  if (review === 'approved') return { text: 'Approved', color: 'green', icon: <GitPullRequestIcon /> }
  if (review === 'changes') return { text: 'Changes requested', color: 'yellow', icon: <GitPullRequestIcon /> }
  if (status === 'draft') return { text: 'Draft', color: 'gray', icon: <GitPullRequestIcon /> }
  return { text: 'In review', color: 'blue', icon: <GitPullRequestIcon /> }
}

const CompactRow = ({ finding, quiet }: { finding: Finding; quiet?: boolean }) => {
  const { repo, title, problem, note, estimatedMinPerWeek, pattern, fixedBy } = finding
  const { text, color, icon } = badgeOf(finding)
  return (
    <article className={`${styles.compact} ${quiet ? styles.quiet : ''}`}>
      <div className={styles.compactMain}>
        <div className={styles.compactMeta}>
          <Label size="small" color={color} leadingVisual={icon}>
            {text}
          </Label>
          <Text font="monospace" size="100" variant="muted">
            {repo} {refOf(finding)}
            {pattern && ` · ${pattern}`}
          </Text>
        </div>
        <Heading as="h3" size="6" weight="semibold">
          <a href={hrefOf(finding)} className={styles.titleLink}>
            {title}
          </a>
        </Heading>
        <Text as="p" size="200" variant="muted">
          {quiet ? note ?? problem : problem}
          {fixedBy && (
            <>
              {' '}
              <InlineLink href={`https://github.com/${repo}/pull/${fixedBy}`}>Fix #{fixedBy}</InlineLink>
            </>
          )}
        </Text>
        <Quote finding={finding} />
      </div>
      {estimatedMinPerWeek && (
        <div className={styles.compactStat}>
          <Text font="monospace" size="400" weight="semibold" className={quiet ? undefined : styles.accent}>
            ~{fmt(estimatedMinPerWeek)}
          </Text>
          <Text font="monospace" size="100" variant="muted">
            min/wk (est.)
          </Text>
        </div>
      )}
    </article>
  )
}

const steps = [
  { icon: SearchIcon, title: 'Find', body: 'Shortlist the busiest public repos and their heaviest workflows.' },
  { icon: GraphIcon, title: 'Measure', body: 'Pull runs, jobs and step timing from the public Actions API.' },
  { icon: ToolsIcon, title: 'Fix', body: 'Write the smallest diff that removes the waste. When in doubt, run everything.' },
  { icon: RocketIcon, title: 'Ship', body: "Validate on a fork where possible, then open a short PR in the repo's format." },
]

const rules = [
  ['Structural waste over red builds.', 'A workflow that mostly fails needs a diagnosis, not a CI tweak.'],
  ['Measured vs estimated, always labeled.', 'Measured numbers come from a stated window of real runs.'],
  ["Don't change what a project means to test.", 'Coverage trade-offs go to maintainers as findings, not PRs.'],
  ['Short PRs.', 'Problem, fix, how it was tested. The diff does the talking.'],
  ['Minutes, not dollars.', 'Public repos run free on standard hosted runners. The win is capacity.'],
]

const App = () => {
  const [colorMode, setColorMode] = useState<'dark' | 'light'>('dark')
  const isDark = colorMode === 'dark'

  return (
    <ThemeProvider colorMode={colorMode} className={styles.root}>
      <nav className={styles.nav}>
        <div className={`${styles.frame} ${styles.navInner}`}>
          <Text font="monospace" size="200" weight="semibold">
            <span className={styles.muted}>//</span> oss-actions-optimization
          </Text>
          <div className={styles.navLinks}>
            <a href="#merged">Merged</a>
            <a href="#review">In review</a>
            <a href="#declined">Not merged</a>
            <a href="#method">Method</a>
            <Button
              variant="subtle"
              size="small"
              hasArrow={false}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              onClick={() => setColorMode(isDark ? 'light' : 'dark')}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </Button>
          </div>
        </div>
      </nav>

      <main className={styles.frame}>
        <Hero align="start" className={styles.hero}>
          <Hero.Eyebrow>
            <Eyebrow>
              <span className={styles.muted}>//</span> <Accent>case study</Accent> · GitHub Actions in open source
            </Eyebrow>
          </Hero.Eyebrow>
          <Hero.Heading size="display" font="monospace" weight="semibold" letterSpacing="condensed" fullWidth>
            From public run data to <Accent>fixes merged upstream.</Accent>
          </Hero.Heading>
          <Hero.Description variant="muted">
            AI agents measured where {stats.repos} popular open source repos spend their GitHub Actions minutes, then
            sent small PRs to cut the waste. Maintainers made every merge decision.
          </Hero.Description>
          <Hero.PrimaryAction href="#featured">Read the merged cases</Hero.PrimaryAction>
          <Hero.SecondaryAction href={skill}>Get the skill</Hero.SecondaryAction>
        </Hero>

        <Grid className={styles.stats}>
          {[
            [`${stats.merged}`, 'PRs merged upstream'],
            [`~${fmt(stats.mergedMinutes)}`, 'job-min/week cut by merged PRs (est.)'],
            [`${stats.mergeRate}%`, `of decided PRs merged (${stats.merged} of ${stats.decided})`],
            [`${stats.inReview}`, `PRs in review, ${stats.approved} approved`],
          ].map(([value, label]) => (
            <Grid.Column key={label} span={{ xsmall: 6, large: 3 }}>
              <Statistic variant="boxed" padding="normal" size="medium">
                <Statistic.Heading>{value}</Statistic.Heading>
                <Statistic.Description variant="muted">{label}</Statistic.Description>
              </Statistic>
            </Grid.Column>
          ))}
        </Grid>

        {featured && <Featured finding={featured} />}

        <section id="merged" className={styles.section}>
          <SectionHead index="02" label="Merged upstream" aside={<Eyebrow>Problem · fix · evidence</Eyebrow>}>
            Different repos. <Accent>Same bar: maintainers merged it.</Accent>
          </SectionHead>
          {mergedCases.map((f) => (
            <CaseRow key={`${f.repo}#${f.pr}`} finding={f} />
          ))}
          {repeatPatterns.map(({ pattern, list }) => (
            <PatternGroup key={pattern} pattern={pattern} list={list} />
          ))}
        </section>

        <section id="review" className={styles.section}>
          <SectionHead index="03" label="In review" aside={<Eyebrow>Live PR state</Eyebrow>}>
            {stats.inReview} more PRs, <Accent>waiting on maintainers.</Accent>
          </SectionHead>
          {inReview.map((f) => (
            <CompactRow key={`${f.repo}#${f.pr}`} finding={f} />
          ))}
          {scanning.length > 0 && (
            <Text as="p" font="monospace" size="100" variant="muted" className={styles.footnote}>
              Scanning: {scanning.map(({ repo }) => repo).join(', ')}
            </Text>
          )}
        </section>

        <section id="declined" className={styles.section}>
          <SectionHead index="04" label="Not merged">
            Not every fix lands. <span className={styles.muted}>Here's what didn't, and why.</span>
          </SectionHead>
          {[...declined, ...notShipped].map((f) => (
            <CompactRow key={`${f.repo}:${f.title}`} finding={f} quiet />
          ))}
        </section>

        <section id="method" className={styles.section}>
          <SectionHead
            index="05"
            label="Method"
            aside={
              <Link href={skill} size="small" variant="accent" arrowDirection="none">
                actions-optimization skill ↗
              </Link>
            }
          >
            Four steps. <Accent>Public data only.</Accent>
          </SectionHead>
          <Grid className={styles.grid}>
            {steps.map(({ icon, title, body }) => (
              <Grid.Column key={title} span={{ xsmall: 12, medium: 6, large: 3 }}>
                <Pillar>
                  <Pillar.Icon icon={icon} />
                  <Pillar.Heading as="h3">{title}</Pillar.Heading>
                  <Pillar.Description>{body}</Pillar.Description>
                </Pillar>
              </Grid.Column>
            ))}
          </Grid>
          <ol className={styles.rules}>
            {rules.map(([lead, rest], i) => (
              <li key={lead}>
                <Text font="monospace" size="100" className={styles.accent}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Text as="p" size="300">
                  <Text weight="semibold">{lead}</Text> <Text variant="muted">{rest}</Text>
                </Text>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${styles.section} ${styles.cta}`}>
          <Heading as="h2" size="3" font="monospace" weight="semibold" letterSpacing="condensed">
            Run the same playbook <Accent>on your repo.</Accent>
          </Heading>
          <div className={styles.ctaActions}>
            <Button as="a" href={skill} variant="primary">
              Get the actions-optimization skill
            </Button>
            <Button as="a" href={REPO_URL} variant="secondary">
              View the source
            </Button>
          </div>
        </section>

        <footer className={styles.footer}>
          <Text font="monospace" size="100" variant="muted">
            Updated {updated} · PR states synced {syncedAt.slice(0, 16).replace('T', ' ')} UTC · Every number comes from
            public GitHub Actions run history.
          </Text>
        </footer>
      </main>
    </ThemeProvider>
  )
}

export default App
