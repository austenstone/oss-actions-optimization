import { readFile, writeFile } from 'node:fs/promises'

const token = process.env.GITHUB_TOKEN
if (!token) throw new Error('GITHUB_TOKEN is required')

const { findings } = JSON.parse(await readFile(new URL('../src/data.json', import.meta.url), 'utf8'))
const prs = findings.filter(({ pr }) => pr)

const fields = 'state isDraft mergedAt reviewDecision latestReviews(first: 20) { nodes { state } }'
const query = `{ ${prs
  .map(({ repo, pr }, i) => {
    const [owner, name] = repo.split('/')
    return `p${i}: repository(owner: "${owner}", name: "${name}") { pullRequest(number: ${pr}) { ${fields} } }`
  })
  .join('\n')} }`

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { authorization: `bearer ${token}`, 'content-type': 'application/json' },
  body: JSON.stringify({ query }),
})
const { data, errors } = await res.json()
if (errors) throw new Error(JSON.stringify(errors))

const toReview = ({ reviewDecision, latestReviews }) => {
  const states = latestReviews.nodes.map(({ state }) => state)
  if (reviewDecision === 'CHANGES_REQUESTED' || states.includes('CHANGES_REQUESTED')) return 'changes'
  if (reviewDecision === 'APPROVED' || states.includes('APPROVED')) return 'approved'
  return null
}

const state = Object.fromEntries(
  prs.map(({ repo }, i) => {
    const p = data[`p${i}`].pullRequest
    const status = p.mergedAt ? 'merged' : p.state === 'CLOSED' ? 'closed' : p.isDraft ? 'draft' : 'open'
    return [repo, { status, review: toReview(p), mergedAt: p.mergedAt }]
  }),
)

await writeFile(
  new URL('../src/pr-state.json', import.meta.url),
  `${JSON.stringify({ syncedAt: new Date().toISOString(), prs: state }, null, 2)}\n`,
)
console.log(`Synced ${prs.length} PRs`)
