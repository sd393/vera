export interface PersonaMeta {
  id: string
  label: string
  keywords: string[]
}

export const PERSONA_META: PersonaMeta[] = [
  {
    id: 'vc',
    label: 'Venture Capital Investor',
    keywords: [
      'vc',
      'vcs',
      'venture capital',
      'venture capitalist',
      'venture capitalists',
      'investor',
      'investors',
      'angel investor',
      'angel investors',
      'seed investor',
      'seed investors',
      'series a',
      'series b',
      'limited partner',
      'limited partners',
    ],
  },
]

export function detectPersonaMeta(audience?: string): PersonaMeta | null {
  if (!audience) return null
  const lower = audience.toLowerCase()
  for (const meta of PERSONA_META) {
    for (const keyword of meta.keywords) {
      const pattern = new RegExp(`\\b${keyword}\\b`, 'i')
      if (pattern.test(lower)) return meta
    }
  }
  return null
}
