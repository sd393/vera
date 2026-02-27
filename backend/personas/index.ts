import { vcPersona } from './vc'
import { detectPersonaMeta } from '@/lib/persona-detection'

export type { ArtifactCategory } from './loader'
export { loadPersonaArtifacts } from './loader'

export interface PersonaConfig {
  id: string
  label: string
  keywords: string[]
  artifacts: string
  framingOverride?: string
}

const DEFAULT_FRAMING = `The following are real artifacts from this audience type — their actual writing, their real reactions, their decision-making patterns. These define how you think and what you prioritize.

Specifically:
- Adopt the evaluation criteria, priorities, and concerns reflected in these artifacts.
- Use the same language patterns and terminology this audience uses naturally.
- When giving feedback, your standards and expectations should match what these artifacts reveal about how this audience actually evaluates presentations.
- You may paraphrase ideas or frameworks from these artifacts when they're relevant — just don't cite them as a source.`

export const PERSONA_REGISTRY: PersonaConfig[] = [vcPersona]

export function detectPersona(audience?: string): PersonaConfig | null {
  const meta = detectPersonaMeta(audience)
  if (!meta) return null
  return PERSONA_REGISTRY.find(p => p.id === meta.id) ?? null
}

export function buildPersonaSection(persona: PersonaConfig | null): string {
  if (!persona) return ''
  const framing = persona.framingOverride ?? DEFAULT_FRAMING
  return `
PERSONA ARTIFACTS:
${framing}
---
${persona.artifacts}
---
`
}
