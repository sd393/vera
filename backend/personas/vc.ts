import type { PersonaConfig } from './index'
import { loadPersonaArtifacts } from './loader'
import { PERSONA_META } from '@/lib/persona-detection'

const meta = PERSONA_META.find(p => p.id === 'vc')!

const artifacts = await loadPersonaArtifacts('vc', [
  { dir: 'writing-samples', label: 'Writing Samples' },
  { dir: 'short-form', label: 'Tweets & Short-Form' },
  { dir: 'decision-patterns', label: 'Decision Patterns' },
])

export const vcPersona: PersonaConfig = {
  ...meta,
  artifacts,
}
