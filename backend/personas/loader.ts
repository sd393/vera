import { readdirSync, readFileSync } from 'fs'
import { resolve, join, extname } from 'path'
import { extractText } from 'unpdf'

export interface ArtifactCategory {
  dir: string   // subdirectory name under the persona folder (e.g. 'writing-samples')
  label: string // section header in the assembled output (e.g. 'Writing Samples')
}

async function readArtifactFile(filePath: string): Promise<string> {
  if (extname(filePath).toLowerCase() === '.pdf') {
    const buffer = readFileSync(filePath)
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
    return (Array.isArray(text) ? text.join('\n') : text).trim()
  }
  return readFileSync(filePath, 'utf-8').trim()
}

/**
 * Reads all files from each category subdirectory under a persona folder
 * and assembles them into a single string with section headers.
 */
export async function loadPersonaArtifacts(personaId: string, categories: ArtifactCategory[]): Promise<string> {
  const baseDir = resolve(process.cwd(), 'model_data/personas', personaId)
  const sections: string[] = []

  for (const category of categories) {
    const catDir = join(baseDir, category.dir)
    let entries: string[]
    try {
      entries = readdirSync(catDir).filter(f => !f.startsWith('.')).sort()
    } catch {
      entries = []
    }
    if (entries.length === 0) continue

    const contents: string[] = []
    for (const file of entries) {
      const text = await readArtifactFile(join(catDir, file))
      if (text) contents.push(text)
    }

    if (contents.length === 0) continue
    sections.push(`## ${category.label}\n\n${contents.join('\n\n---\n\n')}`)
  }

  return sections.join('\n\n')
}
