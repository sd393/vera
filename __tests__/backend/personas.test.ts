import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join, resolve } from 'path'
import { detectPersona, buildPersonaSection, loadPersonaArtifacts } from '@/backend/personas'
import { detectPersonaMeta } from '@/lib/persona-detection'

const TEST_PERSONA_DIR = resolve(process.cwd(), 'model_data/personas/__test__')

describe('detectPersona', () => {
  it('returns null for undefined audience', () => {
    expect(detectPersona(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(detectPersona('')).toBeNull()
  })

  it('matches "VC" (case-insensitive)', () => {
    const persona = detectPersona('Series A VCs')
    expect(persona).not.toBeNull()
    expect(persona!.id).toBe('vc')
  })

  it('matches "venture capital"', () => {
    const persona = detectPersona('Venture Capital investors')
    expect(persona).not.toBeNull()
    expect(persona!.id).toBe('vc')
  })

  it('matches "venture capitalist"', () => {
    const persona = detectPersona('a venture capitalist')
    expect(persona).not.toBeNull()
    expect(persona!.id).toBe('vc')
  })

  it('matches "investor"', () => {
    const persona = detectPersona('angel investor panel')
    expect(persona).not.toBeNull()
    expect(persona!.id).toBe('vc')
  })

  it('matches "seed investor"', () => {
    const persona = detectPersona('Seed investor meeting')
    expect(persona).not.toBeNull()
    expect(persona!.id).toBe('vc')
  })

  it('matches "series a" and "series b"', () => {
    expect(detectPersona('Series A round')?.id).toBe('vc')
    expect(detectPersona('Series B investors')?.id).toBe('vc')
  })

  it('matches "limited partner"', () => {
    expect(detectPersona('limited partner meeting')?.id).toBe('vc')
  })

  it('does not false-positive on unrelated audiences', () => {
    expect(detectPersona('school board members')).toBeNull()
    expect(detectPersona('engineering team')).toBeNull()
    expect(detectPersona('marketing department')).toBeNull()
  })

  it('does not match "vc" as a substring (word-boundary check)', () => {
    expect(detectPersona('service providers')).toBeNull()
    expect(detectPersona('advocacy group')).toBeNull()
  })
})

describe('loadPersonaArtifacts', () => {
  beforeAll(() => {
    mkdirSync(join(TEST_PERSONA_DIR, 'writing-samples'), { recursive: true })
    mkdirSync(join(TEST_PERSONA_DIR, 'short-form'), { recursive: true })
    mkdirSync(join(TEST_PERSONA_DIR, 'empty-cat'), { recursive: true })

    writeFileSync(join(TEST_PERSONA_DIR, 'writing-samples', 'post-1.md'), 'First blog post content')
    writeFileSync(join(TEST_PERSONA_DIR, 'writing-samples', 'post-2.md'), 'Second blog post content')
    writeFileSync(join(TEST_PERSONA_DIR, 'short-form', 'tweet-1.txt'), 'A short tweet')
    // empty-cat has no files (just dir)
  })

  afterAll(() => {
    rmSync(TEST_PERSONA_DIR, { recursive: true, force: true })
  })

  it('assembles files from multiple categories with section headers', async () => {
    const result = await loadPersonaArtifacts('__test__', [
      { dir: 'writing-samples', label: 'Writing Samples' },
      { dir: 'short-form', label: 'Tweets & Short-Form' },
    ])
    expect(result).toContain('## Writing Samples')
    expect(result).toContain('First blog post content')
    expect(result).toContain('Second blog post content')
    expect(result).toContain('## Tweets & Short-Form')
    expect(result).toContain('A short tweet')
  })

  it('separates files within a category with ---', async () => {
    const result = await loadPersonaArtifacts('__test__', [
      { dir: 'writing-samples', label: 'Writing Samples' },
    ])
    expect(result).toContain('First blog post content\n\n---\n\nSecond blog post content')
  })

  it('skips empty categories', async () => {
    const result = await loadPersonaArtifacts('__test__', [
      { dir: 'writing-samples', label: 'Writing Samples' },
      { dir: 'empty-cat', label: 'Empty Category' },
    ])
    expect(result).toContain('## Writing Samples')
    expect(result).not.toContain('Empty Category')
  })

  it('skips nonexistent directories gracefully', async () => {
    const result = await loadPersonaArtifacts('__test__', [
      { dir: 'does-not-exist', label: 'Missing' },
    ])
    expect(result).toBe('')
  })

  it('ignores dotfiles like .gitkeep', async () => {
    writeFileSync(join(TEST_PERSONA_DIR, 'short-form', '.gitkeep'), '')
    const result = await loadPersonaArtifacts('__test__', [
      { dir: 'short-form', label: 'Short-Form' },
    ])
    expect(result).not.toContain('.gitkeep')
    expect(result).toContain('A short tweet')
  })

  it('returns empty string when all categories are empty', async () => {
    const result = await loadPersonaArtifacts('__test__', [
      { dir: 'empty-cat', label: 'Empty' },
    ])
    expect(result).toBe('')
  })

  it('extracts text from PDF files', async () => {
    // Minimal valid PDF with "PDF test content" text
    const minimalPdf = Buffer.from([
      '%PDF-1.0\n',
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n',
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n',
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n',
      '4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 100 700 Td (PDF test content) Tj ET\nendstream\nendobj\n',
      '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n',
      'xref\n0 6\n',
      '0000000000 65535 f \n',
      '0000000009 00000 n \n',
      '0000000058 00000 n \n',
      '0000000115 00000 n \n',
      '0000000266 00000 n \n',
      '0000000360 00000 n \n',
      'trailer<</Size 6/Root 1 0 R>>\nstartxref\n429\n%%EOF',
    ].join(''))

    mkdirSync(join(TEST_PERSONA_DIR, 'pdf-samples'), { recursive: true })
    writeFileSync(join(TEST_PERSONA_DIR, 'pdf-samples', 'report.pdf'), minimalPdf)

    const result = await loadPersonaArtifacts('__test__', [
      { dir: 'pdf-samples', label: 'PDF Samples' },
    ])
    expect(result).toContain('## PDF Samples')
    expect(result).toContain('PDF test content')
  })
})

describe('buildPersonaSection', () => {
  it('returns empty string for null', () => {
    expect(buildPersonaSection(null)).toBe('')
  })

  it('includes framing and artifacts for valid persona', () => {
    const persona = {
      id: 'test',
      label: 'Test',
      keywords: ['test'],
      artifacts: '## Writing Samples\n\nSome content',
    }
    const section = buildPersonaSection(persona)
    expect(section).toContain('PERSONA ARTIFACTS')
    expect(section).toContain('Adopt the evaluation criteria')
    expect(section).toContain('Some content')
  })

  it('respects framingOverride', () => {
    const persona = {
      id: 'test',
      label: 'Test Persona',
      keywords: ['test'],
      artifacts: 'test artifacts content',
      framingOverride: 'Custom framing instructions here.',
    }
    const section = buildPersonaSection(persona)
    expect(section).toContain('Custom framing instructions here.')
    expect(section).not.toContain('Absorb')
    expect(section).toContain('test artifacts content')
  })
})

describe('detectPersonaMeta (shared module)', () => {
  it('returns null for undefined audience', () => {
    expect(detectPersonaMeta(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(detectPersonaMeta('')).toBeNull()
  })

  it('returns PersonaMeta with id and label for matching audience', () => {
    const meta = detectPersonaMeta('Series A VCs')
    expect(meta).not.toBeNull()
    expect(meta!.id).toBe('vc')
    expect(meta!.label).toBe('Venture Capital Investor')
    expect(meta!.keywords).toBeInstanceOf(Array)
  })

  it('does not include artifacts (lightweight)', () => {
    const meta = detectPersonaMeta('investor panel')
    expect(meta).not.toBeNull()
    expect(meta).not.toHaveProperty('artifacts')
  })

  it('matches the same keywords as detectPersona', () => {
    const audiences = [
      'Series A VCs', 'Venture Capital investors', 'angel investor panel',
      'Seed investor meeting', 'limited partner meeting',
    ]
    for (const audience of audiences) {
      const meta = detectPersonaMeta(audience)
      const persona = detectPersona(audience)
      expect(meta?.id).toBe(persona?.id)
    }
  })

  it('returns null for non-matching audiences (same as detectPersona)', () => {
    const audiences = ['school board members', 'engineering team', 'service providers']
    for (const audience of audiences) {
      expect(detectPersonaMeta(audience)).toBeNull()
    }
  })
})
